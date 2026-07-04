import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getExchangeRates } from "./exchange.functions";
import { getScraperService } from "./scraper";
import { detectPlatform, parsePage } from "./scraper/parsers/registry";
import type { ParsedListing, Platform } from "./scraper/parsers/types";
import type { ScrapedPage } from "./scraper/types";

/**
 * Módulo de análise de anúncios de marketplaces chineses e internacionais.
 * PIPELINE:
 *   URL → ScraperService → Provider (Firecrawl) → HTML renderizado
 *       → Parser específico da plataforma → JSON estruturado (ParsedListing)
 *       → Conversão de câmbio → IA (recebe SÓ o JSON) → Diagnóstico
 *
 * A IA NUNCA acessa a URL diretamente. NUNCA inventa dados.
 * Campos ausentes retornam exatamente "Informação não encontrada no anúncio".
 */

export const NOT_FOUND = "Informação não encontrada no anúncio";

export type Currency = "CNY" | "USD" | "HKD" | "JPY" | "EUR" | "BRL" | "GBP" | "KRW";

export type ListingAnalysis = {
  source: {
    url: string | null;
    platform: Platform;
    platform_label: string;
    fetched_ok: boolean;
    input_kind: "url" | "text";
    scraper: {
      provider: string | null;
      elapsed_ms: number | null;
      status_code: number | null;
    };
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

// ---------------- Enrichment via AI (grounded by ParsedListing) ----------------

type AiEnrichment = {
  name_translated: string;
  category: string;
  description: string;
  keywords: string[];
  specs: { key: string; value: string }[];
  seller_type: string;
  seller_reputation: string;
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
};

async function aiDiagnose(structured: ParsedListing): Promise<AiEnrichment | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const NF = NOT_FOUND;
  const today = new Date().toISOString().slice(0, 10);
  const system = `Você é um analista sênior de sourcing internacional e compliance de importação, especialista em marketplaces chineses e globais (Taobao, 1688, Tmall, Alibaba, JD, Pinduoduo, Goofish, AliExpress, Weidian, DHGate, Made-in-China, Global Sources).

DATA DE REFERÊNCIA: ${today}. Trate qualquer produto lançado até hoje como existente. NUNCA afirme que um modelo "não existe", "é falso" ou "é protótipo" com base apenas no seu conhecimento — seu conhecimento pode estar desatualizado. Julgue apenas pelos DADOS do JSON.

REGRAS INVIOLÁVEIS:
1. Você recebe um JSON já extraído do anúncio. Analise APENAS o que está nele.
2. NÃO invente fatos externos. NÃO use conhecimento sobre datas de lançamento, existência de modelos, ou histórico de marcas para gerar alertas.
3. Todo item em "risk_alerts", "trust_negatives" e "trust_positives" DEVE citar a evidência textual concreta do JSON que o sustenta (ex.: "vendedor com 0 avaliações", "preço 92% abaixo da média do título", "descrição menciona 'refurbished'", "loja criada há 2 meses").
4. É PROIBIDO gerar alertas do tipo: "modelo não existe", "modelo lançado no futuro", "protótipo", "erro de digitação do vendedor", "produto fictício" — a menos que o PRÓPRIO TEXTO do anúncio diga isso literalmente.
5. Se não houver evidência de risco no JSON, retorne "risk_alerts": []. Alerta sem evidência é pior que nenhum alerta.
6. trust_score (0–100) — RUBRICA OBRIGATÓRIA. Comece em 60 (neutro) e ajuste:
   • Reputação forte do vendedor: +15 se ≥3 anos de plataforma, +10 adicionais se ≥7 anos, +5 se ≥10 anos.
   • Volume de vendas: +10 se >1.000 itens vendidos históricos, +5 adicionais se >10.000, +5 se >30.000.
   • Avaliação positiva: +10 se taxa ≥95%, +5 adicionais se ≥98%.
   • Reviews em quantidade: +5 se >100 reviews, +5 adicionais se >1.000.
   • Certificações oficiais (Tmall, Tmall Global, JD Self-operated, Alibaba Gold Supplier, Verified, Trade Assurance): +10 por certificação (máx +15).
   • Políticas pró-consumidor explícitas (devolução grátis, garantia, "描述不符包邮退", "7天无理由退换"): +5.
   • Dados completos (título, preço, descrição, fotos, specs): +5.
   • Loja nova (<6 meses) ou 0 vendas: −20. Preço absurdo vs categoria (evidência do próprio anúncio): −15. Reviews majoritariamente negativos: −15. Texto do anúncio menciona "refurbished/山寨/仿/A货" sem declarar: −10.
   Trave em 0–100. Dados ausentes NÃO devem penalizar — apenas não somam. Um vendedor com fortes evidências positivas deve ficar 85–100 (Alta Confiabilidade), mesmo sem alguns campos preenchidos. Nunca fique em 60–70 quando há múltiplas evidências fortes a favor e nenhuma contra.
7. Traduza nome/descrição/categoria para pt-BR natural. Preserve números, códigos, SKUs e nomes de marca.
8. Se um campo não puder ser inferido do JSON: strings = "${NF}", arrays = [], números = 0.
9. Retorne EXCLUSIVAMENTE JSON válido no schema. Sem markdown, sem comentários.`;

  const schema = `{
  "name_translated": string,
  "category": string,
  "description": string,
  "keywords": [string],
  "specs": [{"key": string, "value": string}],
  "seller_type": string,
  "seller_reputation": string,
  "reviews_highlights": [string],
  "reviews_complaints": [string],
  "trust_score": number,
  "trust_label": string,
  "trust_positives": [string],
  "trust_negatives": [string],
  "risk_alerts": [string],
  "estimated_weight_kg": string,
  "estimated_volume": string,
  "tax_category": string,
  "tax_risk": string,
  "shipping_estimate": string,
  "viability": string
}`;

  const user = `JSON estruturado extraído do anúncio (plataforma: ${structured.platform_label}):

\`\`\`json
${JSON.stringify(
  {
    title: structured.title,
    brand: structured.brand,
    model: structured.model,
    category: structured.category,
    description: structured.description,
    specs: structured.specs,
    variations: structured.variations,
    price: structured.price,
    seller: structured.seller,
    reviews: structured.reviews,
    text_excerpt: structured.raw_signals.text.slice(0, 6000),
  },
  null,
  2,
)}
\`\`\`

Retorne SOMENTE o JSON no schema:
${schema}

Lembre-se: cada risk_alert precisa citar a evidência exata do JSON. Sem evidência = não emita o alerta.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.warn(`[listing-analysis] AI HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<AiEnrichment>;
    return normalizeEnrichment(parsed);
  } catch (err) {
    console.warn("[listing-analysis] AI enrichment falhou:", (err as Error).message);
    return null;
  }
}

function normalizeEnrichment(p: Partial<AiEnrichment>): AiEnrichment {
  const s = (v: unknown): string => (typeof v === "string" && v.trim() ? v.trim() : NOT_FOUND);
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const specs = Array.isArray(p.specs)
    ? p.specs
        .filter((x): x is { key: string; value: string } => !!x && typeof x === "object")
        .map((x) => ({ key: String(x.key || ""), value: String(x.value || "") }))
        .filter((x) => x.key && x.value)
    : [];
  const trustScore =
    typeof p.trust_score === "number" && Number.isFinite(p.trust_score)
      ? Math.max(0, Math.min(100, Math.round(p.trust_score)))
      : 0;
  return {
    name_translated: s(p.name_translated),
    category: s(p.category),
    description: s(p.description),
    keywords: arr(p.keywords),
    specs,
    seller_type: s(p.seller_type),
    seller_reputation: s(p.seller_reputation),
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
  };
}

// ---------------- Currency conversion ----------------

async function convert(
  value: number,
  currency: string,
): Promise<{ rate: number | null; brl: number | null; source: string }> {
  const cur = currency.toUpperCase();
  if (cur === "BRL") return { rate: 1, brl: value, source: "n/a" };
  const rates = await getExchangeRates();
  const rate = rates.rates[cur as keyof typeof rates.rates];
  if (!rate) return { rate: null, brl: null, source: rates.source };
  return { rate, brl: Number((value * rate).toFixed(2)), source: rates.source };
}

// ---------------- Cache ----------------

type CacheEntry = { data: ListingAnalysis; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(url: string): string {
  return `url:${url}`;
}

// ---------------- Merge: ParsedListing + AiEnrichment → ListingAnalysis ----------------

function orNF(v: string | null | undefined): string {
  return v && v.trim() ? v.trim() : NOT_FOUND;
}

// Marcas conhecidas + regex de modelo. Ordem importa: nomes compostos primeiro.
const KNOWN_BRANDS: { brand: string; patterns: RegExp[] }[] = [
  { brand: "Apple", patterns: [/\bapple\b/i, /\biphone\b/i, /\bipad\b/i, /\bmacbook\b/i, /\bairpods\b/i, /\bapple\s*watch\b/i] },
  { brand: "Samsung", patterns: [/\bsamsung\b/i, /\bgalaxy\b/i] },
  { brand: "Xiaomi", patterns: [/\bxiaomi\b/i, /\bredmi\b/i, /\bpoco\b/i, /\bmi\s?\d/i] },
  { brand: "Huawei", patterns: [/\bhuawei\b/i, /\bmate\s?\d/i, /\bp\d{2}\s?pro\b/i] },
  { brand: "Honor", patterns: [/\bhonor\b/i] },
  { brand: "Oppo", patterns: [/\boppo\b/i] },
  { brand: "Vivo", patterns: [/\bvivo\b/i] },
  { brand: "OnePlus", patterns: [/\boneplus\b/i] },
  { brand: "Realme", patterns: [/\brealme\b/i] },
  { brand: "Motorola", patterns: [/\bmotorola\b/i, /\bmoto\s?[gez]\b/i] },
  { brand: "Google", patterns: [/\bgoogle\s?pixel\b/i, /\bpixel\s?\d/i] },
  { brand: "Sony", patterns: [/\bsony\b/i, /\bxperia\b/i, /\bplaystation\b/i, /\bps[45]\b/i] },
  { brand: "LG", patterns: [/\blg\b/i] },
  { brand: "Nintendo", patterns: [/\bnintendo\b/i, /\bswitch\b/i] },
  { brand: "Microsoft", patterns: [/\bmicrosoft\b/i, /\bxbox\b/i, /\bsurface\b/i] },
  { brand: "Dell", patterns: [/\bdell\b/i] },
  { brand: "HP", patterns: [/\bhp\b/i, /\bhewlett\b/i] },
  { brand: "Lenovo", patterns: [/\blenovo\b/i, /\bthinkpad\b/i] },
  { brand: "Asus", patterns: [/\basus\b/i, /\brog\b/i, /\bzenbook\b/i] },
  { brand: "Acer", patterns: [/\bacer\b/i] },
  { brand: "JBL", patterns: [/\bjbl\b/i] },
  { brand: "Bose", patterns: [/\bbose\b/i] },
  { brand: "DJI", patterns: [/\bdji\b/i, /\bmavic\b/i, /\bosmo\b/i] },
  { brand: "GoPro", patterns: [/\bgopro\b/i, /\bhero\s?\d/i] },
  { brand: "Nike", patterns: [/\bnike\b/i, /\bair\s?jordan\b/i] },
  { brand: "Adidas", patterns: [/\badidas\b/i, /\byeezy\b/i] },
];

const MODEL_PATTERNS: RegExp[] = [
  /\biphone\s?\d{1,2}\s?(?:pro\s?max|pro|plus|mini|air|se)?\b/i,
  /\bipad\s?(?:pro|air|mini)?\s?\d*\b/i,
  /\bmacbook\s?(?:pro|air)?\s?\d*\b/i,
  /\bapple\s?watch\s?(?:series\s?\d+|ultra\s?\d*|se)?\b/i,
  /\bgalaxy\s?[a-z]?\d{1,3}\s?(?:ultra|pro|plus|fe|note)?\b/i,
  /\bredmi\s?(?:note\s?)?\d{1,2}[a-z]?\s?(?:pro|plus|max)?\b/i,
  /\bpoco\s?[a-z]?\d{1,2}\s?(?:pro|plus)?\b/i,
  /\bpixel\s?\d\s?(?:pro|xl|a)?\b/i,
  /\bmate\s?\d{1,2}\s?(?:pro|plus)?\b/i,
  /\bxperia\s?[a-z]?\d[a-z]*\b/i,
  /\bps[45]\s?(?:pro|slim)?\b/i,
  /\bxbox\s?(?:series\s?[xs]|one)?\b/i,
  /\bswitch\s?(?:oled|lite)?\b/i,
];

function inferBrand(text: string): string | null {
  for (const b of KNOWN_BRANDS) {
    if (b.patterns.some((r) => r.test(text))) return b.brand;
  }
  return null;
}

function inferModel(text: string): string | null {
  for (const r of MODEL_PATTERNS) {
    const m = text.match(r);
    if (m) return m[0].replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}


const IMG_FETCH_TIMEOUT_MS = 3000;
// Placeholder branco/corrompido da CDN geralmente tem <1.5KB. Fotos reais
// (mesmo miniaturas webp) costumam ficar acima de 2KB. Ser conservador para
// não esconder fotos legítimas do produto.
const IMG_MIN_BYTES = 1_800;
// Só marca como "placeholder" quando o mesmo binário se repete várias vezes
// entre as URLs candidatas. Isso evita rejeitar pares legítimos duplicados.
const IMG_PLACEHOLDER_MIN_REPEATS = 3;
const IMG_PLACEHOLDER_MAX_BYTES = 12_000;
const IMG_MAX_CANDIDATES = 12;

type ImgCheck = { url: string; size: number; hash: string };

/** Confere assinatura binária de formatos de imagem comuns. */
function hasImageMagicBytes(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 16));
  if (b.length < 4) return false;
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return true;
  // WEBP / RIFF
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return true;
  // BMP
  if (b[0] === 0x42 && b[1] === 0x4d) return true;
  // AVIF / HEIC (ftyp box)
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return true;
  return false;
}

async function checkImage(url: string, referer: string | null): Promise<ImgCheck | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), IMG_FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...(referer ? { Referer: referer } : {}),
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < IMG_MIN_BYTES) return null;
    // Não confia só no content-type (CDNs às vezes mandam octet-stream);
    // exige magic bytes de imagem real para descartar HTML de erro.
    if (!hasImageMagicBytes(buf)) return null;
    const digest = await crypto.subtle.digest("SHA-1", buf);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { url, size: buf.byteLength, hash };
  } catch {
    return null;
  }
}

/**
 * Baixa cada imagem candidata no servidor e mantém apenas as válidas.
 * Estratégia conservadora: só descarta quando há forte evidência de que
 * é lixo (fetch falhou, formato inválido, tamanho ínfimo, ou o mesmo
 * binário se repete várias vezes indicando placeholder da CDN).
 */
async function validateProductImages(
  main: string | null,
  gallery: string[],
  referer: string | null,
): Promise<{ main: string | null; gallery: string[] }> {
  const candidates = Array.from(new Set([main, ...gallery].filter((u): u is string => !!u))).slice(
    0,
    IMG_MAX_CANDIDATES,
  );
  if (candidates.length === 0) return { main: null, gallery: [] };

  const checks = await Promise.all(candidates.map((u) => checkImage(u, referer)));
  const ok = checks.filter((c): c is ImgCheck => c !== null);

  // Conta repetições de conteúdo idêntico para detectar placeholder de CDN.
  const hashCount = new Map<string, number>();
  for (const c of ok) hashCount.set(c.hash, (hashCount.get(c.hash) ?? 0) + 1);

  const seen = new Set<string>();
  const valid: string[] = [];
  for (const c of ok) {
    // Placeholder de CDN: mesmo binário repetido em várias URLs E pequeno.
    if (
      (hashCount.get(c.hash) ?? 0) >= IMG_PLACEHOLDER_MIN_REPEATS &&
      c.size < IMG_PLACEHOLDER_MAX_BYTES
    ) {
      continue;
    }
    // Duplicata exata da mesma foto (mantém apenas a primeira ocorrência).
    if (seen.has(c.hash)) continue;
    seen.add(c.hash);
    valid.push(c.url);
  }

  const newMain = main && valid.includes(main) ? main : valid[0] ?? null;
  const newGallery = valid.filter((u) => u !== newMain);
  return { main: newMain, gallery: newGallery };
}




function mergeToAnalysis(args: {
  parsed: ParsedListing;
  enrichment: AiEnrichment | null;
  page: ScrapedPage | null;
  fetchedOk: boolean;
  warnings: string[];
  conversion: { rate: number | null; brl: number | null; source: string };
}): ListingAnalysis {
  const { parsed, enrichment, page, fetchedOk, warnings, conversion } = args;
  const enr = enrichment;

  const description = enr?.description && enr.description !== NOT_FOUND
    ? enr.description
    : orNF(parsed.description);

  return {
    source: {
      url: parsed.url || null,
      platform: parsed.platform,
      platform_label: parsed.platform_label,
      fetched_ok: fetchedOk,
      input_kind: "url",
      scraper: {
        provider: page?.providerName ?? null,
        elapsed_ms: page?.elapsedMs ?? null,
        status_code: page?.statusCode ?? null,
      },
    },
    product: (() => {
      const finalSpecs = enr && enr.specs.length > 0 ? enr.specs : parsed.specs;
      const specLookup = (patterns: RegExp[]): string | null => {
        for (const s of finalSpecs) {
          if (patterns.some((r) => r.test(s.key))) {
            const v = String(s.value ?? "").trim();
            if (v) return v;
          }
        }
        return null;
      };
      const titleDesc = `${parsed.title ?? ""} ${parsed.description ?? ""}`;
      const brand =
        parsed.brand ||
        specLookup([/marca/i, /brand/i, /品牌/]) ||
        inferBrand(titleDesc);
      const model =
        parsed.model ||
        specLookup([/modelo/i, /model/i, /型号/, /型號/, /reference/i, /ref\.?/i]) ||
        inferModel(titleDesc);
      const stock =
        parsed.stock_status ||
        specLookup([/estoque/i, /stock/i, /库存/, /inventory/i, /disponibilidade/i, /availability/i]);
      const moq =
        parsed.price.moq ||
        specLookup([/moq/i, /pedido\s*m[ií]nimo/i, /minimum\s*order/i, /起订/, /最小起订/]);
      const category =
        (enr?.category && enr.category !== NOT_FOUND ? enr.category : parsed.category) ||
        specLookup([/categoria/i, /category/i, /类目/, /类别/]);

      return {
        name_original: orNF(parsed.title),
        name_translated: enr ? enr.name_translated : NOT_FOUND,
        category: orNF(category),
        brand: orNF(brand),
        model: orNF(model),
        description,
        specs: finalSpecs,
        keywords: enr ? enr.keywords : [],
        variations: parsed.variations,
        stock_status: orNF(stock),
        moq: orNF(moq),
      };
    })(),
    images: {
      main: parsed.images.main,
      gallery: parsed.images.gallery,
      videos: parsed.images.videos,
    },
    price: {
      original_value: parsed.price.value,
      original_currency: parsed.price.currency || NOT_FOUND,
      original_display: orNF(parsed.price.display),
      price_range: orNF(parsed.price.range),
      wholesale: orNF(parsed.price.wholesale),
      promotional: orNF(parsed.price.promotional),
      exchange_rate: conversion.rate,
      exchange_source: conversion.source || NOT_FOUND,
      converted_brl: conversion.brl,
      converted_display:
        conversion.brl != null ? `R$ ${conversion.brl.toFixed(2).replace(".", ",")}` : NOT_FOUND,
      history: NOT_FOUND,
    },
    seller: {
      name: orNF(parsed.seller.name),
      store: orNF(parsed.seller.store),
      location: orNF(parsed.seller.location),
      years_active: orNF(parsed.seller.years_active),
      type: enr ? enr.seller_type : NOT_FOUND,
      certifications: parsed.seller.certifications,
      reputation: enr ? enr.seller_reputation : orNF(parsed.seller.reputation),
    },
    reviews: {
      total: orNF(parsed.reviews.total),
      average: orNF(parsed.reviews.average),
      positive_pct: orNF(parsed.reviews.positive_pct),
      highlights: enr && enr.reviews_highlights.length > 0 ? enr.reviews_highlights : parsed.reviews.highlights,
      complaints: enr && enr.reviews_complaints.length > 0 ? enr.reviews_complaints : parsed.reviews.complaints,
    },
    trust: {
      score: enr ? enr.trust_score : 0,
      label: enr ? enr.trust_label : NOT_FOUND,
      positives: enr ? enr.trust_positives : [],
      negatives: enr ? enr.trust_negatives : [],
      risk_alerts: enr ? enr.risk_alerts : [],
    },
    import: {
      estimated_weight_kg: enr ? enr.estimated_weight_kg : NOT_FOUND,
      estimated_volume: enr ? enr.estimated_volume : NOT_FOUND,
      tax_category: enr ? enr.tax_category : NOT_FOUND,
      tax_risk: enr ? enr.tax_risk : NOT_FOUND,
      shipping_estimate: enr ? enr.shipping_estimate : NOT_FOUND,
      viability: enr ? enr.viability : NOT_FOUND,
    },
    meta: {
      cached: false,
      analyzed_at: new Date().toISOString(),
      warnings,
    },
  };
}

// ---------------- Server function ----------------

const inputSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  refresh: z.boolean().default(false),
});

export const analyzeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ListingAnalysis> => {
    // 1) Validar URL
    let normalizedUrl: string;
    try {
      normalizedUrl = new URL(data.url.trim()).toString();
    } catch {
      throw new Error("URL inválida. Envie o link completo do anúncio.");
    }

    // 2) Cache (revalidando somente preço/câmbio quando quente)
    const key = cacheKey(normalizedUrl);
    if (!data.refresh) {
      const hit = cache.get(key);
      if (hit && hit.expiresAt > Date.now()) {
        if (hit.data.price.original_value && typeof hit.data.price.original_currency === "string") {
          const conv = await convert(
            hit.data.price.original_value,
            String(hit.data.price.original_currency),
          );
          hit.data.price.exchange_rate = conv.rate;
          hit.data.price.exchange_source = conv.source;
          hit.data.price.converted_brl = conv.brl;
          hit.data.price.converted_display =
            conv.brl != null ? `R$ ${conv.brl.toFixed(2).replace(".", ",")}` : NOT_FOUND;
        }
        hit.data.meta.cached = true;
        return hit.data;
      }
    }

    // 3) Detectar plataforma (pré-scrape, para logs/labels)
    const platformInfo = detectPlatform(normalizedUrl);

    // 4) ScraperService → HTML renderizado
    const warnings: string[] = [];
    const scraper = getScraperService();
    if (!scraper.isAvailable()) {
      throw new Error(
        "Serviço de scraping indisponível: nenhum provider configurado. Ative o conector Firecrawl.",
      );
    }

    let page: ScrapedPage | null = null;
    let fetchedOk = false;
    try {
      page = await scraper.scrape(normalizedUrl, {
        country: "CN",
        locale: "zh-CN",
        waitForMs: 1800,
        timeoutMs: 30000,
      });
      fetchedOk = !!page.html && page.statusCode < 400;
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.error("[listing-analysis] scrape falhou:", e);
      warnings.push(e.message ?? "Não foi possível abrir o anúncio.");
    }

    // 5) Parser específico da plataforma → JSON estruturado
    const parsed: ParsedListing = page
      ? parsePage(page)
      : {
          platform: platformInfo.platform,
          platform_label: platformInfo.label,
          url: normalizedUrl,
          title: null, brand: null, model: null, category: null, description: null,
          specs: [], variations: [], stock_status: null,
          price: { value: null, currency: null, display: null, range: null, promotional: null, wholesale: null, moq: null },
          images: { main: null, gallery: [], videos: [] },
          seller: { name: null, store: null, location: null, years_active: null, type: null, certifications: [], reputation: null },
          reviews: { total: null, average: null, positive_pct: null, highlights: [], complaints: [] },
          raw_signals: { text: "", html_title: null, og_image: null, jsonld: [] },
        };

    // 6) Conversão de câmbio (antes da IA, para dar mais contexto na saída)
    let conversion: { rate: number | null; brl: number | null; source: string } = {
      rate: null,
      brl: null,
      source: "",
    };
    if (parsed.price.value && parsed.price.currency) {
      conversion = await convert(parsed.price.value, parsed.price.currency);
    }

    // 7) IA — recebe SOMENTE o JSON estruturado, nunca a URL
    const enrichment = fetchedOk ? await aiDiagnose(parsed) : null;
    if (fetchedOk && !enrichment) {
      warnings.push("Diagnóstico por IA indisponível — dados estruturais preservados.");
    }
    if (!fetchedOk && !parsed.title) {
      warnings.push("Não foi possível ler o anúncio. Verifique o link ou tente novamente.");
    }

    // 8) Validação real das imagens no servidor: baixa cada uma, descarta
    //    quebradas, ícones e placeholders "图片加载失败" (conteúdo idêntico repetido)
    const validated = await validateProductImages(
      parsed.images.main,
      parsed.images.gallery,
      parsed.url || null,
    );
    parsed.images.main = validated.main;
    parsed.images.gallery = validated.gallery;

    // 9) Montar resultado final
    const result = mergeToAnalysis({ parsed, enrichment, page, fetchedOk, warnings, conversion });

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  });
