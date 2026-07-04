import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getExchangeRates } from "./exchange.functions";

/**
 * Módulo de análise de anúncios de marketplaces chineses e internacionais.
 * Regra de ouro: NUNCA inventar dados. Qualquer campo ausente no anúncio
 * deve retornar EXATAMENTE "Informação não encontrada no anúncio".
 */

export const NOT_FOUND = "Informação não encontrada no anúncio";

export type Currency = "CNY" | "USD" | "HKD" | "JPY" | "EUR" | "BRL" | "GBP" | "KRW";

export type Platform =
  | "goofish" | "xianyu" | "1688" | "taobao" | "tmall" | "alibaba"
  | "jd" | "pinduoduo" | "weidian" | "aliexpress" | "dhgate"
  | "made_in_china" | "global_sources" | "shopee" | "amazon" | "unknown";

export type ListingAnalysis = {
  source: {
    url: string | null;
    platform: Platform;
    platform_label: string;
    fetched_ok: boolean;
    input_kind: "url" | "text";
  };
  product: {
    name_original: string;
    name_translated: string;
    category: string;
    brand: string;
    model: string;
    description: string;
    specs: { key: string; value: string }[];
    keywords: string[];
    variations: string[];
    stock_status: string;
    moq: string;
  };
  images: {
    main: string | null;
    gallery: string[];
    videos: string[];
  };
  price: {
    original_value: number | null;
    original_currency: Currency | string;
    original_display: string;
    price_range: string;
    wholesale: string;
    promotional: string;
    exchange_rate: number | null;
    exchange_source: string;
    converted_brl: number | null;
    converted_display: string;
    history: string;
  };
  seller: {
    name: string;
    store: string;
    location: string;
    years_active: string;
    type: string;
    certifications: string[];
    reputation: string;
  };
  reviews: {
    total: string;
    average: string;
    positive_pct: string;
    highlights: string[];
    complaints: string[];
  };
  trust: {
    score: number;
    label: string;
    positives: string[];
    negatives: string[];
    risk_alerts: string[];
  };
  import: {
    estimated_weight_kg: string;
    estimated_volume: string;
    tax_category: string;
    tax_risk: string;
    shipping_estimate: string;
    viability: string;
  };
  meta: {
    cached: boolean;
    analyzed_at: string;
    warnings: string[];
  };
};

// ---------------- Platform detection ----------------

const PLATFORM_HOST_MAP: [RegExp, Platform, string][] = [
  [/(?:^|\.)goofish\.com/i, "goofish", "Goofish"],
  [/(?:^|\.)xianyu\.com|2\.taobao\.com/i, "xianyu", "Xianyu (闲鱼)"],
  [/(?:^|\.)1688\.com/i, "1688", "1688"],
  [/(?:^|\.)tmall\.com/i, "tmall", "Tmall"],
  [/(?:^|\.)taobao\.com/i, "taobao", "Taobao"],
  [/(?:^|\.)alibaba\.com/i, "alibaba", "Alibaba"],
  [/(?:^|\.)jd\.com|jd\.hk/i, "jd", "JD.com"],
  [/pinduoduo|yangkeduo|temu\.com/i, "pinduoduo", "Pinduoduo / Temu"],
  [/weidian\.com/i, "weidian", "Weidian"],
  [/aliexpress/i, "aliexpress", "AliExpress"],
  [/dhgate/i, "dhgate", "DHGate"],
  [/made-in-china/i, "made_in_china", "Made-in-China"],
  [/globalsources/i, "global_sources", "Global Sources"],
  [/shopee/i, "shopee", "Shopee"],
  [/amazon\./i, "amazon", "Amazon"],
];

function detectPlatform(url: string | null, text: string): { id: Platform; label: string } {
  if (url) {
    try {
      const host = new URL(url).hostname;
      for (const [re, id, label] of PLATFORM_HOST_MAP) {
        if (re.test(host)) return { id, label };
      }
    } catch { /* ignore */ }
  }
  for (const [re, id, label] of PLATFORM_HOST_MAP) {
    if (re.test(text.slice(0, 4000))) return { id, label };
  }
  return { id: "unknown", label: "Marketplace não identificado" };
}

// ---------------- HTML helpers ----------------

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decode(m[1].trim());
  }
  return null;
}

function absolutize(url: string | null, base: string): string | null {
  if (!url) return null;
  try { return new URL(url, base).toString(); } catch { return null; }
}

function extractImages(html: string, base: string): string[] {
  const urls = new Set<string>();
  const re = /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) && urls.size < 40) {
    const abs = absolutize(m[1], base);
    if (abs && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(abs)) urls.add(abs);
  }
  return Array.from(urls);
}

function extractVideos(html: string, base: string): string[] {
  const urls = new Set<string>();
  const re = /<(?:video|source)[^>]+src=["']([^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const abs = absolutize(m[1], base);
    if (abs) urls.add(abs);
  }
  return Array.from(urls);
}

async function fetchListing(url: string): Promise<{ ok: boolean; html: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,pt-BR;q=0.8,en;q=0.6",
      },
      redirect: "follow",
    });
    const html = await res.text();
    return { ok: res.ok, html, finalUrl: res.url || url };
  } catch {
    return { ok: false, html: "", finalUrl: url };
  }
}

// ---------------- AI grounded extraction ----------------

type AiResult = {
  name_original: string;
  name_translated: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  specs: { key: string; value: string }[];
  keywords: string[];
  variations: string[];
  stock_status: string;
  moq: string;
  price_value: number | null;
  price_currency: string;
  price_display: string;
  price_range: string;
  wholesale: string;
  promotional: string;
  price_history: string;
  seller_name: string;
  seller_store: string;
  seller_location: string;
  seller_years: string;
  seller_type: string;
  seller_certifications: string[];
  seller_reputation: string;
  reviews_total: string;
  reviews_average: string;
  reviews_positive_pct: string;
  reviews_highlights: string[];
  reviews_complaints: string[];
  trust_score: number;
  trust_label: string;
  trust_positives: string[];
  trust_negatives: string[];
  risk_alerts: string[];
  estimated_weight_kg: string;
  estimated_volume: string;
  tax_category: string;
  tax_risk: string;
  shipping_estimate: string;
  viability: string;
  main_image: string | null;
};

const AI_SCHEMA_HINT = `{
  "name_original": string,
  "name_translated": string,
  "category": string,
  "brand": string,
  "model": string,
  "description": string,
  "specs": [{"key": string, "value": string}],
  "keywords": [string],
  "variations": [string],
  "stock_status": string,
  "moq": string,
  "price_value": number | null,
  "price_currency": "CNY"|"USD"|"HKD"|"JPY"|"EUR"|"BRL"|"GBP"|"KRW"|"",
  "price_display": string,
  "price_range": string,
  "wholesale": string,
  "promotional": string,
  "price_history": string,
  "seller_name": string,
  "seller_store": string,
  "seller_location": string,
  "seller_years": string,
  "seller_type": string,
  "seller_certifications": [string],
  "seller_reputation": string,
  "reviews_total": string,
  "reviews_average": string,
  "reviews_positive_pct": string,
  "reviews_highlights": [string],
  "reviews_complaints": [string],
  "trust_score": number (0-100),
  "trust_label": string,
  "trust_positives": [string],
  "trust_negatives": [string],
  "risk_alerts": [string],
  "estimated_weight_kg": string,
  "estimated_volume": string,
  "tax_category": string,
  "tax_risk": string,
  "shipping_estimate": string,
  "viability": string,
  "main_image": string | null
}`;

async function aiAnalyze(input: {
  url: string | null;
  platform: string;
  html_text: string;
  raw_text: string;
  image_hint: string | null;
  image_urls: string[];
}): Promise<AiResult | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const NF = NOT_FOUND;

  const system = `Você é um analista sênior de sourcing internacional especializado em marketplaces chineses (Goofish/Xianyu, 1688, Taobao, Tmall, Alibaba, JD, Pinduoduo, Weidian, AliExpress, DHGate, Made-in-China, Global Sources).

REGRAS INVIOLÁVEIS:
1. NUNCA invente dados. Nunca use produtos similares como referência.
2. Se um campo não estiver EXPLICITAMENTE presente no conteúdo fornecido, use EXATAMENTE a string "${NF}" (para strings) ou array vazio (para arrays) ou null (para números).
3. NUNCA preencha campos com placeholders, exemplos ou dados genéricos.
4. Extraia APENAS o que estiver comprovadamente no anúncio recebido.
5. Ignore anúncios patrocinados, produtos recomendados e preços de outras variantes.
6. Preserve nomes de modelos, siglas e códigos EXATAMENTE como aparecem.
7. Traduza descrições e nome comercial para português brasileiro mantendo termos técnicos.
8. trust_score deve refletir SOMENTE evidências reais extraídas (avaliações, tempo de loja, certificações). Se não houver evidência, use 0 e trust_label = "${NF}".
9. Retorne EXCLUSIVAMENTE um JSON válido, sem markdown, sem comentários, seguindo o schema informado.
10. Para "estimated_weight_kg", "estimated_volume", "tax_category", "tax_risk", "shipping_estimate", "viability": só preencha se o anúncio mencionar. Caso contrário use "${NF}".`;

  const user = `PLATAFORMA DETECTADA: ${input.platform}
URL: ${input.url ?? "(não fornecida)"}
IMAGEM PRINCIPAL DETECTADA (og:image): ${input.image_hint ?? "(nenhuma)"}
IMAGENS DA PÁGINA (primeiras 15): ${input.image_urls.slice(0, 15).join(" | ") || "(nenhuma)"}

===== TEXTO EXTRAÍDO DA PÁGINA (pode estar em chinês/inglês) =====
${input.raw_text.slice(0, 12000)}

===== FIM DO TEXTO =====

Retorne SOMENTE o JSON no seguinte schema (sem chaves extras, sem markdown):
${AI_SCHEMA_HINT}

Lembre-se: qualquer campo ausente na fonte acima → "${NF}" (string), [] (array) ou null (número).`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<AiResult>;
    return normalizeAi(parsed);
  } catch {
    return null;
  }
}

function normalizeAi(p: Partial<AiResult>): AiResult {
  const s = (v: unknown): string => {
    if (typeof v === "string" && v.trim()) return v.trim();
    return NOT_FOUND;
  };
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const specs = Array.isArray(p.specs)
    ? p.specs.filter((x): x is { key: string; value: string } => !!x && typeof x === "object")
        .map((x) => ({ key: String(x.key || ""), value: String(x.value || "") }))
        .filter((x) => x.key && x.value)
    : [];
  const priceValue =
    typeof p.price_value === "number" && Number.isFinite(p.price_value) && p.price_value > 0
      ? p.price_value
      : null;
  const trustScore =
    typeof p.trust_score === "number" && Number.isFinite(p.trust_score)
      ? Math.max(0, Math.min(100, Math.round(p.trust_score)))
      : 0;
  return {
    name_original: s(p.name_original),
    name_translated: s(p.name_translated),
    category: s(p.category),
    brand: s(p.brand),
    model: s(p.model),
    description: s(p.description),
    specs,
    keywords: arr(p.keywords),
    variations: arr(p.variations),
    stock_status: s(p.stock_status),
    moq: s(p.moq),
    price_value: priceValue,
    price_currency: typeof p.price_currency === "string" ? p.price_currency.toUpperCase() : "",
    price_display: s(p.price_display),
    price_range: s(p.price_range),
    wholesale: s(p.wholesale),
    promotional: s(p.promotional),
    price_history: s(p.price_history),
    seller_name: s(p.seller_name),
    seller_store: s(p.seller_store),
    seller_location: s(p.seller_location),
    seller_years: s(p.seller_years),
    seller_type: s(p.seller_type),
    seller_certifications: arr(p.seller_certifications),
    seller_reputation: s(p.seller_reputation),
    reviews_total: s(p.reviews_total),
    reviews_average: s(p.reviews_average),
    reviews_positive_pct: s(p.reviews_positive_pct),
    reviews_highlights: arr(p.reviews_highlights),
    reviews_complaints: arr(p.reviews_complaints),
    trust_score: trustScore,
    trust_label: s(p.trust_label),
    trust_positives: arr(p.trust_positives),
    trust_negatives: arr(p.trust_negatives),
    risk_alerts: arr(p.risk_alerts),
    estimated_weight_kg: s(p.estimated_weight_kg),
    estimated_volume: s(p.estimated_volume),
    tax_category: s(p.tax_category),
    tax_risk: s(p.tax_risk),
    shipping_estimate: s(p.shipping_estimate),
    viability: s(p.viability),
    main_image: typeof p.main_image === "string" && p.main_image.startsWith("http") ? p.main_image : null,
  };
}

// ---------------- Currency conversion ----------------

async function convert(value: number, currency: string): Promise<{ rate: number | null; brl: number | null; source: string }> {
  const cur = currency.toUpperCase();
  if (cur === "BRL") return { rate: 1, brl: value, source: "n/a" };
  const rates = await getExchangeRates();
  const map: Record<string, number | undefined> = {
    USD: rates.USD, EUR: rates.EUR, CNY: rates.CNY,
    // Sub-derivations from USD when direct pair não disponível.
    HKD: rates.USD ? rates.USD * 0.128 : undefined,
    JPY: rates.USD ? rates.USD * 0.0064 : undefined,
    GBP: rates.USD ? rates.USD * 1.27 : undefined,
    KRW: rates.USD ? rates.USD * 0.00072 : undefined,
  };
  const rate = map[cur];
  if (!rate) return { rate: null, brl: null, source: rates.source };
  return { rate, brl: Number((value * rate).toFixed(2)), source: rates.source };
}

// ---------------- Cache ----------------

type CacheEntry = { data: ListingAnalysis; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(url: string | null, text: string): string {
  if (url) return `url:${url}`;
  return `txt:${text.slice(0, 120)}`;
}

// ---------------- Server function ----------------

const inputSchema = z.object({
  url: z.string().trim().max(2000).optional().nullable(),
  raw: z.string().trim().max(200000).optional().nullable(),
  refresh: z.boolean().default(false),
});

export const analyzeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ListingAnalysis> => {
    const rawUrl = data.url?.trim() || null;
    const rawText = data.raw?.trim() || "";

    if (!rawUrl && !rawText) {
      throw new Error("Envie o link do anúncio ou cole o texto/HTML da página.");
    }

    let url: string | null = null;
    if (rawUrl) {
      try {
        url = new URL(rawUrl).toString();
      } catch {
        throw new Error("URL inválida. Envie o link completo do anúncio.");
      }
    }

    const key = cacheKey(url, rawText);
    if (!data.refresh) {
      const hit = cache.get(key);
      if (hit && hit.expiresAt > Date.now()) {
        // Atualiza apenas câmbio.
        if (hit.data.price.original_value && hit.data.price.original_currency && hit.data.price.original_currency !== NOT_FOUND) {
          const conv = await convert(hit.data.price.original_value, String(hit.data.price.original_currency));
          hit.data.price.exchange_rate = conv.rate;
          hit.data.price.exchange_source = conv.source;
          hit.data.price.converted_brl = conv.brl;
          hit.data.price.converted_display = conv.brl != null ? `R$ ${conv.brl.toFixed(2).replace(".", ",")}` : NOT_FOUND;
        }
        hit.data.meta.cached = true;
        return hit.data;
      }
    }

    // 1) Buscar conteúdo
    let html = "";
    let finalUrl = url ?? "";
    let fetchedOk = false;
    if (url) {
      const fetched = await fetchListing(url);
      html = fetched.html;
      finalUrl = fetched.finalUrl;
      fetchedOk = fetched.ok && html.length > 0;
    }
    const combinedText = html
      ? `${stripTags(html)}\n\n${rawText}`.trim()
      : rawText;

    // 2) Plataforma
    const platform = detectPlatform(url, combinedText);

    // 3) Sinais HTML
    const ogImage = html
      ? absolutize(
          pickMeta(html, [
            /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
          ]),
          finalUrl,
        )
      : null;
    const images = html ? extractImages(html, finalUrl) : [];
    const videos = html ? extractVideos(html, finalUrl) : [];

    // 4) IA (grounded)
    const warnings: string[] = [];
    const ai = await aiAnalyze({
      url: finalUrl || null,
      platform: platform.label,
      html_text: html,
      raw_text: combinedText,
      image_hint: ogImage,
      image_urls: images,
    });

    if (!ai) {
      warnings.push("Análise por IA indisponível — dados podem estar incompletos.");
    }

    const base: AiResult = ai ?? normalizeAi({});

    // 5) Validação de consistência mínima
    if (base.name_original === NOT_FOUND && base.name_translated === NOT_FOUND && !fetchedOk && !rawText) {
      warnings.push("Não foi possível ler o anúncio. Cole o texto/HTML ou tente novamente.");
    }

    // 6) Conversão
    let convertedBrl: number | null = null;
    let exchangeRate: number | null = null;
    let exchangeSource = "";
    let convertedDisplay: string = NOT_FOUND;
    if (base.price_value && base.price_currency) {
      const conv = await convert(base.price_value, base.price_currency);
      exchangeRate = conv.rate;
      convertedBrl = conv.brl;
      exchangeSource = conv.source;
      if (convertedBrl != null) {
        convertedDisplay = `R$ ${convertedBrl.toFixed(2).replace(".", ",")}`;
      }
    }

    // 7) Montar resultado
    const mainImage = base.main_image || ogImage || images[0] || null;
    const gallery = Array.from(new Set([mainImage, ...images].filter((x): x is string => !!x))).filter(
      (x) => x !== mainImage,
    );

    const result: ListingAnalysis = {
      source: {
        url: finalUrl || null,
        platform: platform.id,
        platform_label: platform.label,
        fetched_ok: fetchedOk,
        input_kind: url ? "url" : "text",
      },
      product: {
        name_original: base.name_original,
        name_translated: base.name_translated,
        category: base.category,
        brand: base.brand,
        model: base.model,
        description: base.description,
        specs: base.specs,
        keywords: base.keywords,
        variations: base.variations,
        stock_status: base.stock_status,
        moq: base.moq,
      },
      images: {
        main: mainImage,
        gallery: gallery.slice(0, 24),
        videos,
      },
      price: {
        original_value: base.price_value,
        original_currency: base.price_currency || NOT_FOUND,
        original_display: base.price_display,
        price_range: base.price_range,
        wholesale: base.wholesale,
        promotional: base.promotional,
        exchange_rate: exchangeRate,
        exchange_source: exchangeSource || NOT_FOUND,
        converted_brl: convertedBrl,
        converted_display: convertedDisplay,
        history: base.price_history,
      },
      seller: {
        name: base.seller_name,
        store: base.seller_store,
        location: base.seller_location,
        years_active: base.seller_years,
        type: base.seller_type,
        certifications: base.seller_certifications,
        reputation: base.seller_reputation,
      },
      reviews: {
        total: base.reviews_total,
        average: base.reviews_average,
        positive_pct: base.reviews_positive_pct,
        highlights: base.reviews_highlights,
        complaints: base.reviews_complaints,
      },
      trust: {
        score: base.trust_score,
        label: base.trust_label,
        positives: base.trust_positives,
        negatives: base.trust_negatives,
        risk_alerts: base.risk_alerts,
      },
      import: {
        estimated_weight_kg: base.estimated_weight_kg,
        estimated_volume: base.estimated_volume,
        tax_category: base.tax_category,
        tax_risk: base.tax_risk,
        shipping_estimate: base.shipping_estimate,
        viability: base.viability,
      },
      meta: {
        cached: false,
        analyzed_at: new Date().toISOString(),
        warnings,
      },
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  });
