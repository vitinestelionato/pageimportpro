import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Currency = "USD" | "EUR" | "CNY" | "BRL";

type Enriched = {
  name: string | null;
  image_url: string | null;
  supplier_url: string;
  origin_price: number | null;
  origin_currency: Currency | null;
  converted_price_brl: number | null;
  exchange_rate: number | null;
  weight_kg: number | null;
  category: string | null;
  notes: string | null;
};

const CURRENCY_MAP: Record<string, Currency> = {
  USD: "USD", "US$": "USD", $: "USD",
  EUR: "EUR", "€": "EUR",
  CNY: "CNY", RMB: "CNY", "¥": "CNY", "￥": "CNY",
  BRL: "BRL", "R$": "BRL",
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
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

function parsePrice(text: string): number | null {
  const m = text.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  let raw = m[1].replace(/\s/g, "");
  if (raw.includes(",") && raw.includes(".")) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    if (lastComma > lastDot) raw = raw.replace(/\./g, "").replace(",", ".");
    else raw = raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    const parts = raw.split(",");
    if (parts[parts.length - 1].length <= 2) raw = raw.replace(/\./g, "").replace(",", ".");
    else raw = raw.replace(/,/g, "");
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) results.push(...parsed); else results.push(parsed);
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

function currencyFromHost(host: string): Currency | null {
  if (/goofish|xianyu|taobao|tmall|1688|alibaba|jd\.com|pinduoduo|xiaohongshu|weidian|aliexpress\.cn/i.test(host)) return "CNY";
  if (/mercadolivre|magazineluiza|amazon\.com\.br|americanas|shopee\.com\.br|shein\.com\.br|\.com\.br$/i.test(host)) return "BRL";
  if (/aliexpress|amazon\.(com|co\.uk|de|fr|it|es|nl)|ebay|temu|shein\.com$/i.test(host)) return "USD";
  if (/\.(fr|de|it|es|nl|pt|eu)$/i.test(host)) return "EUR";
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchBrlRate(from: Currency): Promise<number | null> {
  if (from === "BRL") return 1;
  try {
    const res = await fetch(`https://economia.awesomeapi.com.br/last/${from}-BRL`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json() as Record<string, { bid?: string }>;
    const key = `${from}BRL`;
    const bid = json[key]?.bid;
    const n = bid ? Number(bid) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

async function aiEnrich(payload: {
  url: string;
  title: string | null;
  description: string | null;
  price: number | null;
  currency: Currency | null;
  image: string | null;
  pageText: string;
}): Promise<{
  name: string | null;
  description_pt: string | null;
  category: string | null;
  weight_kg: number | null;
  price: number | null;
  currency: Currency | null;
} | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `Você é um especialista em importação de produtos da China e outros países.
Sua tarefa: analisar dados brutos de páginas de e-commerce (Goofish/Xianyu, Taobao, 1688, AliExpress, Shopee, Amazon, etc.) e retornar SEMPRE em PORTUGUÊS BRASILEIRO, mesmo que o anúncio original esteja em chinês, inglês ou outro idioma.
Traduza títulos e descrições para PT-BR de forma natural, curta e comercial.
Se não houver categoria explícita, deduza uma categoria simples (ex: "Eletrônicos", "Moda Feminina", "Casa e Cozinha", "Acessórios").
Se não houver peso, estime silenciosamente um peso realista em kg baseado no tipo de produto (ex: fone bluetooth ~0.2kg, camiseta ~0.25kg, tênis ~0.9kg, smartphone ~0.3kg). NUNCA mencione que é estimativa nem no name, nem na description_pt.
Retorne SOMENTE JSON válido no formato exato solicitado, sem markdown, sem comentários.`;

  const userPrompt = `URL: ${payload.url}
Título bruto: ${payload.title ?? "(vazio)"}
Descrição bruta: ${payload.description ?? "(vazio)"}
Preço detectado: ${payload.price ?? "(não detectado)"} ${payload.currency ?? ""}
Trecho da página (pode estar em chinês): ${payload.pageText.slice(0, 2500)}

Retorne JSON:
{
  "name": "Nome curto e comercial do produto em português (máx 90 caracteres)",
  "description_pt": "Descrição em português com principais características, 1 a 3 frases",
  "category": "Categoria em português",
  "weight_kg": número em kg (estime se não houver),
  "price": número (preço na moeda de origem, use o detectado ou extraia do texto),
  "currency": "USD" | "EUR" | "CNY" | "BRL"
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const currencyRaw = String(parsed.currency ?? "").toUpperCase();
    const currency = (["USD","EUR","CNY","BRL"].includes(currencyRaw) ? currencyRaw : null) as Currency | null;
    const priceNum = typeof parsed.price === "number" ? parsed.price : Number(parsed.price);
    const weightNum = typeof parsed.weight_kg === "number" ? parsed.weight_kg : Number(parsed.weight_kg);
    return {
      name: (parsed.name ? String(parsed.name) : null),
      description_pt: (parsed.description_pt ? String(parsed.description_pt) : null),
      category: (parsed.category ? String(parsed.category) : null),
      weight_kg: Number.isFinite(weightNum) && weightNum > 0 ? weightNum : null,
      price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null,
      currency,
    };
  } catch { return null; }
}

export const enrichProductFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ url: z.string().url().max(1000) }).parse(data))
  .handler(async ({ data }): Promise<Enriched> => {
    const url = data.url;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,pt-BR;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    }).catch((e: Error) => { throw new Error(`Falha ao acessar o link: ${e.message}`); });

    // Some Chinese sites return 200 with a challenge page; still try to parse.
    const html = res.ok ? await res.text() : "";
    const base = res.url || url;
    const host = (() => { try { return new URL(base).hostname; } catch { return ""; } })();

    // ---------- Raw extraction ----------
    let rawTitle = pickMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);

    let image_url = absolutize(pickMeta(html, [
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]), base);

    const description = pickMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    let price: number | null = null;
    let currency: Currency | null = null;
    let weight_kg: number | null = null;
    let category: string | null = null;

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
    if (metaPrice) price = parsePrice(metaPrice);
    if (metaCurrency) currency = CURRENCY_MAP[metaCurrency.toUpperCase()] ?? null;

    // JSON-LD
    const jsonld = findProductJsonLd(extractJsonLd(html));
    if (jsonld) {
      if (!rawTitle && jsonld.name) rawTitle = String(jsonld.name);
      if (!image_url) {
        const img = jsonld.image as string | string[] | undefined;
        image_url = absolutize(Array.isArray(img) ? img[0] : img ?? null, base);
      }
      const offers = jsonld.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      if (offer) {
        const op = offer as { price?: string | number; priceCurrency?: string };
        if (op.price != null && price == null) price = parsePrice(String(op.price));
        if (op.priceCurrency && !currency) currency = CURRENCY_MAP[String(op.priceCurrency).toUpperCase()] ?? null;
      }
      const cat = jsonld.category as string | undefined;
      if (cat) category = String(cat);
      const weight = jsonld.weight as { value?: number | string; unitCode?: string } | undefined;
      if (weight?.value) {
        const w = Number(weight.value);
        if (Number.isFinite(w)) {
          const unit = String(weight.unitCode || "").toUpperCase();
          weight_kg = unit === "GRM" || unit === "G" ? w / 1000 : w;
        }
      }
    }

    if (!currency) currency = currencyFromHost(host);

    // ---------- AI enrichment (translate + estimate) ----------
    const pageText = stripTags(html);
    const ai = await aiEnrich({
      url: base, title: rawTitle, description, price, currency, image: image_url, pageText,
    });

    let name = rawTitle;
    let notes = description;
    if (ai) {
      if (ai.name) name = ai.name;
      if (ai.description_pt) notes = ai.description_pt;
      if (ai.category && !category) category = ai.category;
      if (ai.weight_kg && !weight_kg) weight_kg = ai.weight_kg;
      if (ai.price && !price) price = ai.price;
      if (ai.currency && !currency) currency = ai.currency;
    }

    // ---------- Currency conversion ----------
    let converted_price_brl: number | null = null;
    let exchange_rate: number | null = null;
    if (price && currency) {
      exchange_rate = await fetchBrlRate(currency);
      if (exchange_rate) converted_price_brl = Number((price * exchange_rate).toFixed(2));
    }

    return {
      name: name ?? null,
      image_url,
      supplier_url: base,
      origin_price: price,
      origin_currency: currency,
      converted_price_brl,
      exchange_rate,
      weight_kg,
      category,
      notes: notes ?? null,
    };
  });
