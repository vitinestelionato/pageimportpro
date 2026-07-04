import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Enriched = {
  name: string | null;
  image_url: string | null;
  supplier_url: string;
  origin_price: number | null;
  origin_currency: "USD" | "EUR" | "CNY" | "BRL" | null;
  weight_kg: number | null;
  category: string | null;
  notes: string | null;
};

const CURRENCY_MAP: Record<string, "USD" | "EUR" | "CNY" | "BRL"> = {
  USD: "USD", US$: "USD", $: "USD",
  EUR: "EUR", "€": "EUR",
  CNY: "CNY", RMB: "CNY", "¥": "CNY", "￥": "CNY",
  BRL: "BRL", "R$": "BRL",
};

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decode(m[1].trim());
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function absolutize(url: string | null, base: string): string | null {
  if (!url) return null;
  try { return new URL(url, base).toString(); } catch { return null; }
}

function detectCurrency(text: string): "USD" | "EUR" | "CNY" | "BRL" | null {
  const upper = text.toUpperCase();
  for (const [k, v] of Object.entries(CURRENCY_MAP)) {
    if (upper.includes(k.toUpperCase())) return v;
  }
  return null;
}

function parsePrice(text: string): { price: number | null; currency: ReturnType<typeof detectCurrency> } {
  const currency = detectCurrency(text);
  // find first number pattern like 1.234,56 or 1,234.56 or 12.34
  const m = text.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return { price: null, currency };
  let raw = m[1].replace(/\s/g, "");
  // If both . and , present, the last one is decimal
  if (raw.includes(",") && raw.includes(".")) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    if (lastComma > lastDot) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (raw.includes(",")) {
    // treat comma as decimal if 1-2 digits after
    const parts = raw.split(",");
    if (parts[parts.length - 1].length <= 2) raw = raw.replace(/\./g, "").replace(",", ".");
    else raw = raw.replace(/,/g, "");
  }
  const n = Number(raw);
  return { price: Number.isFinite(n) ? n : null, currency };
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch { /* ignore */ }
  }
  return results;
}

function findProductJsonLd(items: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const it of items) {
    const type = (it as { "@type"?: string | string[] })["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => typeof t === "string" && t.toLowerCase().includes("product"))) return it;
    const graph = (it as { "@graph"?: Record<string, unknown>[] })["@graph"];
    if (Array.isArray(graph)) {
      const found = findProductJsonLd(graph);
      if (found) return found;
    }
  }
  return null;
}

export const enrichProductFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ url: z.string().url().max(1000) }).parse(data))
  .handler(async ({ data }): Promise<Enriched> => {
    const url = data.url;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    }).catch((e: Error) => { throw new Error(`Falha ao acessar o link: ${e.message}`); });

    if (!res.ok) throw new Error(`Servidor respondeu ${res.status}. O site pode estar bloqueando o acesso.`);
    const html = await res.text();
    const base = res.url || url;

    // Title
    const name = pickMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);

    // Image
    let image_url = pickMeta(html, [
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]);
    image_url = absolutize(image_url, base);

    // Description
    const description = pickMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    // Price from meta
    let price: number | null = null;
    let currency: ReturnType<typeof detectCurrency> = null;

    const metaPrice = pickMeta(html, [
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
    ]);
    const metaCurrency = pickMeta(html, [
      /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:price:currency["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+itemprop=["']priceCurrency["'][^>]+content=["']([^"']+)["']/i,
    ]);
    if (metaPrice) {
      const p = parsePrice(metaPrice);
      price = p.price;
    }
    if (metaCurrency) currency = CURRENCY_MAP[metaCurrency.toUpperCase()] ?? currency;

    // JSON-LD fallback
    let category: string | null = null;
    let weight_kg: number | null = null;
    if (!price || !currency || !image_url || !name) {
      const items = extractJsonLd(html);
      const prod = findProductJsonLd(items) as Record<string, unknown> | null;
      if (prod) {
        const offers = (prod.offers ?? null) as Record<string, unknown> | Record<string, unknown>[] | null;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        if (offer) {
          const op = (offer as { price?: string | number; priceCurrency?: string; priceSpecification?: { price?: string | number; priceCurrency?: string } });
          const rawPrice = op.price ?? op.priceSpecification?.price;
          const rawCurr = op.priceCurrency ?? op.priceSpecification?.priceCurrency;
          if (rawPrice != null && price == null) {
            const p = parsePrice(String(rawPrice));
            price = p.price;
          }
          if (rawCurr && !currency) currency = CURRENCY_MAP[String(rawCurr).toUpperCase()] ?? null;
        }
        if (!image_url) {
          const img = prod.image as string | string[] | undefined;
          image_url = absolutize(Array.isArray(img) ? img[0] : img ?? null, base);
        }
        const cat = prod.category as string | undefined;
        if (cat) category = String(cat);
        const weight = prod.weight as { value?: number | string; unitCode?: string } | undefined;
        if (weight?.value) {
          const w = Number(weight.value);
          if (Number.isFinite(w)) {
            const unit = String(weight.unitCode || "").toUpperCase();
            weight_kg = unit === "GRM" || unit === "G" ? w / 1000 : w;
          }
        }
      }
    }

    // Try to detect currency by hostname or price text
    if (!currency) {
      const host = new URL(base).hostname;
      if (/\.com\.br|mercadolivre|magazineluiza|amazon\.com\.br|americanas|shopee\.com\.br/i.test(host)) currency = "BRL";
      else if (/aliexpress|amazon\.com|ebay/i.test(host)) currency = "USD";
      else if (/1688|taobao|tmall|alibaba/i.test(host)) currency = "CNY";
    }

    return {
      name: name ?? null,
      image_url,
      supplier_url: base,
      origin_price: price,
      origin_currency: currency,
      weight_kg,
      category,
      notes: description ?? null,
    };
  });
