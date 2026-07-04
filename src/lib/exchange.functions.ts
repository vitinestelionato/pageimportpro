import { createServerFn } from "@tanstack/react-start";

/**
 * Câmbio ao vivo — parsers puros exportados para permitir testes.
 *
 * Estratégia de resiliência (para reduzir chance de layout quebrado no Google Finance):
 *   1. Tenta múltiplos padrões conhecidos do HTML embutido (data-last-price,
 *      AF_initDataCallback[ds:3], números adjacentes ao símbolo do par).
 *   2. Valida cada valor com faixas plausíveis por moeda (evita retornar
 *      volume, timestamp, ou 52-week high como se fosse cotação).
 *   3. Se todos os padrões falharem, registra amostra do HTML (200 chars)
 *      com o motivo específico para facilitar diagnóstico no log.
 */

export type SupportedCurrency =
  | "USD" | "EUR" | "CNY" | "GBP" | "JPY" | "ARS" | "CAD" | "AUD" | "HKD" | "CHF" | "MXN" | "KRW";

export type ExchangeRates = {
  rates: Record<SupportedCurrency, number>;
  // Legado (mantido p/ compat com telas antigas)
  USD: number;
  EUR: number;
  CNY: number;
  updatedAt: string;
  fetchedAt: string;
  stale: boolean;
  source: "google_finance" | "awesomeapi" | "fallback" | "mixed";
  perPairSources: Partial<Record<SupportedCurrency, "google_finance" | "awesomeapi" | "fallback">>;
  warnings: string[];
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  "USD", "EUR", "CNY", "GBP", "JPY", "ARS", "CAD", "AUD", "HKD", "CHF", "MXN", "KRW",
];

// Faixas plausíveis por moeda (unidades de BRL por unidade estrangeira).
// Usadas para validar o valor extraído — protege contra parser pegar
// volume, número de ordem, ou 52-week high.
const SANITY_RANGES: Record<SupportedCurrency, [number, number]> = {
  USD: [3.5, 10],
  EUR: [3.8, 12],
  CNY: [0.4, 2.5],
  GBP: [4.5, 15],
  JPY: [0.02, 0.1],
  ARS: [0.001, 0.05],
  CAD: [2.5, 8],
  AUD: [2.5, 8],
  HKD: [0.4, 2],
  CHF: [4.0, 12],
  MXN: [0.15, 0.6],
  KRW: [0.002, 0.01],
};

const FALLBACK: Record<SupportedCurrency, number> = {
  USD: 5.4, EUR: 5.9, CNY: 0.75, GBP: 6.8, JPY: 0.035, ARS: 0.006,
  CAD: 3.9, AUD: 3.5, HKD: 0.69, CHF: 6.1, MXN: 0.28, KRW: 0.004,
};

type CacheEntry = { data: ExchangeRates; expiresAt: number };
let cache: CacheEntry | null = null;
const TTL_MS = 5 * 60 * 1000;
const FALLBACK_TTL_MS = 60_000;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// =====================================================================
// PARSER — pure, exported para testes
// =====================================================================

export type ParseAttempt = {
  strategy: string;
  matched: boolean;
  value: number | null;
  reason?: string;
};

export type ParseResult = {
  value: number | null;
  strategy: string | null;
  attempts: ParseAttempt[];
};

function isInRange(value: number, currency: SupportedCurrency): boolean {
  const [min, max] = SANITY_RANGES[currency];
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Parseia o HTML do Google Finance para um par `<CURRENCY>-BRL`.
 * Tenta várias estratégias em ordem de confiabilidade. Retorna também
 * as tentativas para observabilidade / testes.
 */
export function parseGoogleFinanceQuote(html: string, currency: SupportedCurrency): ParseResult {
  const attempts: ParseAttempt[] = [];

  const tryStrategy = (strategy: string, extractor: () => number | null): number | null => {
    try {
      const val = extractor();
      if (val == null) {
        attempts.push({ strategy, matched: false, value: null, reason: "sem_match" });
        return null;
      }
      if (!isInRange(val, currency)) {
        attempts.push({
          strategy, matched: true, value: val,
          reason: `fora_da_faixa[${SANITY_RANGES[currency].join("-")}]`,
        });
        return null;
      }
      attempts.push({ strategy, matched: true, value: val });
      return val;
    } catch (e) {
      attempts.push({ strategy, matched: false, value: null, reason: `erro:${(e as Error).message}` });
      return null;
    }
  };

  // Estratégia 1: atributo data-last-price (o mais estável historicamente)
  const s1 = tryStrategy("data-last-price", () => {
    const m = html.match(/data-last-price=["'](-?\d+\.\d+)["']/);
    return m ? Number(m[1]) : null;
  });
  if (s1 != null) return { value: s1, strategy: "data-last-price", attempts };

  // Estratégia 2: bloco AF_initDataCallback(ds:3)
  const s2 = tryStrategy("af_init_ds3", () => {
    const block = html.match(/key:\s*'ds:3'[\s\S]*?data:\s*(\[[\s\S]*?\]),\s*sideChannel/);
    if (!block) return null;
    const head = block[1].slice(0, 1500);
    const nums = head.match(/-?\d+\.\d+/g);
    if (!nums || nums.length === 0) return null;
    // O primeiro número plausível é o preço à vista.
    for (const raw of nums.slice(0, 6)) {
      const v = Number(raw);
      if (isInRange(v, currency)) return v;
    }
    return Number(nums[0]);
  });
  if (s2 != null) return { value: s2, strategy: "af_init_ds3", attempts };

  // Estratégia 3: atributo jsname="LXPcOd" ou data-value
  const s3 = tryStrategy("data-value", () => {
    const m = html.match(/data-value=["'](-?\d+\.\d+)["']/);
    return m ? Number(m[1]) : null;
  });
  if (s3 != null) return { value: s3, strategy: "data-value", attempts };

  // Estratégia 4: JSON-like `"regularMarketPrice":<num>`
  const s4 = tryStrategy("regularMarketPrice", () => {
    const m = html.match(/"regularMarketPrice"\s*:\s*(-?\d+\.\d+)/);
    return m ? Number(m[1]) : null;
  });
  if (s4 != null) return { value: s4, strategy: "regularMarketPrice", attempts };

  // Estratégia 5: par visível no texto ("1 USD = 5.42 BRL")
  const s5 = tryStrategy("visible-pair", () => {
    const re = new RegExp(`1\\s*${currency}\\s*=\\s*(-?\\d+\\.\\d+)\\s*BRL`, "i");
    const m = html.match(re);
    return m ? Number(m[1]) : null;
  });
  if (s5 != null) return { value: s5, strategy: "visible-pair", attempts };

  return { value: null, strategy: null, attempts };
}

// =====================================================================
// FETCH LAYER
// =====================================================================

async function fetchGoogleFinancePair(
  currency: SupportedCurrency,
  signal: AbortSignal,
): Promise<{ value: number | null; log: string }> {
  const pair = `${currency}-BRL`;
  try {
    const res = await fetch(`https://www.google.com/finance/quote/${pair}`, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal,
    });
    if (!res.ok) {
      const log = `[gfinance:${pair}] HTTP ${res.status}`;
      console.warn(log);
      return { value: null, log };
    }
    const html = await res.text();
    const parsed = parseGoogleFinanceQuote(html, currency);
    if (parsed.value != null) {
      return {
        value: parsed.value,
        log: `[gfinance:${pair}] OK strategy=${parsed.strategy} value=${parsed.value}`,
      };
    }
    const sample = html.slice(0, 200).replace(/\s+/g, " ");
    const log = `[gfinance:${pair}] PARSE_FAIL attempts=${JSON.stringify(parsed.attempts)} sample="${sample}"`;
    console.warn(log);
    return { value: null, log };
  } catch (e) {
    const log = `[gfinance:${pair}] FETCH_ERROR ${(e as Error).message}`;
    console.warn(log);
    return { value: null, log };
  }
}

async function fetchFromGoogleFinance(): Promise<{
  rates: Partial<Record<SupportedCurrency, number>>;
  logs: string[];
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const results = await Promise.all(
      SUPPORTED_CURRENCIES.map((c) => fetchGoogleFinancePair(c, controller.signal).then((r) => [c, r] as const)),
    );
    const rates: Partial<Record<SupportedCurrency, number>> = {};
    const logs: string[] = [];
    for (const [c, r] of results) {
      logs.push(r.log);
      if (r.value != null) rates[c] = r.value;
    }
    return { rates, logs };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromAwesomeApi(): Promise<{
  rates: Partial<Record<SupportedCurrency, number>>;
  updatedAt: string | null;
  log: string;
}> {
  const pairs = SUPPORTED_CURRENCIES.map((c) => `${c}-BRL`).join(",");
  try {
    const res = await fetch(`https://economia.awesomeapi.com.br/json/last/${pairs}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      const log = `[awesomeapi] HTTP ${res.status}`;
      console.warn(log);
      return { rates: {}, updatedAt: null, log };
    }
    const json = (await res.json()) as Record<string, { bid: string; create_date: string }>;
    const rates: Partial<Record<SupportedCurrency, number>> = {};
    let updatedAt: string | null = null;
    for (const c of SUPPORTED_CURRENCIES) {
      const entry = json[`${c}BRL`];
      const bid = entry?.bid ? Number(entry.bid) : NaN;
      if (Number.isFinite(bid) && isInRangeSafe(bid, c)) {
        rates[c] = bid;
        if (!updatedAt) updatedAt = entry.create_date;
      }
    }
    return { rates, updatedAt, log: `[awesomeapi] OK ${Object.keys(rates).length} pairs` };
  } catch (e) {
    const log = `[awesomeapi] ERROR ${(e as Error).message}`;
    console.warn(log);
    return { rates: {}, updatedAt: null, log };
  }
}

function isInRangeSafe(value: number, currency: SupportedCurrency): boolean {
  return isInRange(value, currency);
}

// =====================================================================
// AGGREGATOR
// =====================================================================

export async function assembleExchangeRates(): Promise<ExchangeRates> {
  const perPairSources: Partial<Record<SupportedCurrency, "google_finance" | "awesomeapi" | "fallback">> = {};
  const warnings: string[] = [];

  // 1) Google Finance (primário)
  const gf = await fetchFromGoogleFinance();
  const rates: Partial<Record<SupportedCurrency, number>> = {};
  for (const c of SUPPORTED_CURRENCIES) {
    if (gf.rates[c] != null) {
      rates[c] = gf.rates[c];
      perPairSources[c] = "google_finance";
    }
  }

  // 2) AwesomeAPI (para o que faltou)
  const missing = SUPPORTED_CURRENCIES.filter((c) => rates[c] == null);
  let awesomeUpdatedAt: string | null = null;
  if (missing.length > 0) {
    const aa = await fetchFromAwesomeApi();
    awesomeUpdatedAt = aa.updatedAt;
    for (const c of missing) {
      if (aa.rates[c] != null) {
        rates[c] = aa.rates[c];
        perPairSources[c] = "awesomeapi";
      }
    }
  }

  // 3) Fallback estático (para o que ainda faltou)
  for (const c of SUPPORTED_CURRENCIES) {
    if (rates[c] == null) {
      rates[c] = FALLBACK[c];
      perPairSources[c] = "fallback";
      warnings.push(`Cotação de ${c} usando fallback estático — provedores indisponíveis.`);
    }
  }

  const usedSources = new Set(Object.values(perPairSources));
  const stale = usedSources.has("fallback");
  const source: ExchangeRates["source"] =
    usedSources.size === 1
      ? (perPairSources[SUPPORTED_CURRENCIES[0]] as "google_finance" | "awesomeapi" | "fallback")
      : "mixed";

  const now = new Date().toISOString();
  const full = rates as Record<SupportedCurrency, number>;

  return {
    rates: full,
    USD: full.USD, EUR: full.EUR, CNY: full.CNY,
    updatedAt: awesomeUpdatedAt ?? now,
    fetchedAt: now,
    stale,
    source,
    perPairSources,
    warnings,
  };
}

// =====================================================================
// SERVER FN
// =====================================================================

async function getOrFetch(forceRefresh: boolean): Promise<ExchangeRates> {
  const now = Date.now();
  if (!forceRefresh && cache && cache.expiresAt > now) return cache.data;
  const rates = await assembleExchangeRates();
  const ttl = rates.stale ? FALLBACK_TTL_MS : TTL_MS;
  cache = { data: rates, expiresAt: now + ttl };
  return rates;
}

export const getExchangeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExchangeRates> => getOrFetch(false),
);

/** Força buscar do provedor ignorando o cache — usado pelo botão "Atualizar agora". */
export const refreshExchangeRates = createServerFn({ method: "POST" }).handler(
  async (): Promise<ExchangeRates> => getOrFetch(true),
);
