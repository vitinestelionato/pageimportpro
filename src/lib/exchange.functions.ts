import { createServerFn } from "@tanstack/react-start";

export type ExchangeRates = {
  USD: number;
  EUR: number;
  CNY: number;
  updatedAt: string;
  stale: boolean;
  source: "google_finance" | "awesomeapi" | "fallback";
};

type CacheEntry = { data: ExchangeRates; expiresAt: number };
let cache: CacheEntry | null = null;
const TTL_MS = 5 * 60 * 1000;

const FALLBACK = { USD: 5.4, EUR: 5.9, CNY: 0.75 } as const;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrapes the current spot price from Google Finance for a currency pair.
 * Reads the number from the `AF_initDataCallback({key:'ds:3', ..., data:[...]})`
 * block embedded in the initial HTML — this is the same data that hydrates
 * the visible quote on https://www.google.com/finance/quote/<PAIR>.
 */
async function fetchGoogleFinancePair(pair: string, signal: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch(`https://www.google.com/finance/quote/${pair}`, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal,
    });
    if (!res.ok) return null;
    const html = await res.text();

    // The first numeric field in ds:3 data is the current spot price.
    const block = html.match(/key:\s*'ds:3'[\s\S]*?data:\s*(\[[\s\S]*?\]),\s*sideChannel/);
    if (!block) return null;
    const head = block[1].slice(0, 1200);
    const nums = head.match(/-?\d+\.\d+/g);
    if (!nums || nums.length === 0) return null;
    const value = Number(nums[0]);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  } catch {
    return null;
  }
}

async function fetchFromGoogleFinance(): Promise<ExchangeRates | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const [usd, eur, cny] = await Promise.all([
      fetchGoogleFinancePair("USD-BRL", controller.signal),
      fetchGoogleFinancePair("EUR-BRL", controller.signal),
      fetchGoogleFinancePair("CNY-BRL", controller.signal),
    ]);
    if (usd == null || eur == null || cny == null) return null;
    return {
      USD: usd, EUR: eur, CNY: cny,
      updatedAt: new Date().toISOString(),
      stale: false,
      source: "google_finance",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromAwesomeApi(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,CNY-BRL",
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, { bid: string; create_date: string }>;
    return {
      USD: Number(json.USDBRL?.bid ?? FALLBACK.USD),
      EUR: Number(json.EURBRL?.bid ?? FALLBACK.EUR),
      CNY: Number(json.CNYBRL?.bid ?? FALLBACK.CNY),
      updatedAt: json.USDBRL?.create_date ?? new Date().toISOString(),
      stale: false,
      source: "awesomeapi",
    };
  } catch {
    return null;
  }
}

export const getExchangeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExchangeRates> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.data;

    // Primary source: Google Finance (as requested — most accurate for BRL pairs).
    let rates = await fetchFromGoogleFinance();

    // Fallback #1: awesomeapi (fast public JSON, no key needed).
    if (!rates) rates = await fetchFromAwesomeApi();

    // Fallback #2: last known static values.
    if (!rates) {
      rates = {
        ...FALLBACK,
        updatedAt: new Date().toISOString(),
        stale: true,
        source: "fallback",
      };
      cache = { data: rates, expiresAt: now + 60_000 };
      return rates;
    }

    cache = { data: rates, expiresAt: now + TTL_MS };
    return rates;
  },
);
