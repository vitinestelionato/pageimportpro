/**
 * Parser genérico — usado como fallback e como base para os parsers
 * de plataformas específicas (composição, não herança).
 * Extrai o que existe em qualquer página web moderna: og:*, Product JSON-LD,
 * imagens, texto principal.
 */
import type { ScrapedPage } from "../types";
import type {
  ParsedListing,
  PlatformParser,
  Platform,
} from "./types";
import {
  absolutize,
  extractImages,
  extractJsonLd,
  extractVideos,
  findProductJsonLd,
  pickMeta,
  stripTags,
} from "./helpers";

function priceFromJsonLd(product: Record<string, unknown> | null): {
  value: number | null;
  currency: string | null;
} {
  if (!product) return { value: null, currency: null };
  const offers = product.offers as unknown;
  const pick = (o: Record<string, unknown> | undefined | null) => {
    if (!o) return { value: null, currency: null };
    const raw = o.price ?? o.lowPrice ?? o.highPrice;
    const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : null;
    const currency = typeof o.priceCurrency === "string" ? o.priceCurrency : null;
    return {
      value: value != null && !Number.isNaN(value) ? value : null,
      currency,
    };
  };
  if (Array.isArray(offers)) return pick(offers[0] as Record<string, unknown>);
  return pick(offers as Record<string, unknown> | undefined);
}

export function genericParse(page: ScrapedPage, platform: Platform, label: string): ParsedListing {
  const html = page.html || "";
  const base = page.finalUrl;
  const jsonld = extractJsonLd(html);
  const product = findProductJsonLd(jsonld);

  const ogTitle = pickMeta(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
  ]);
  const htmlTitle = pickMeta(html, [/<title[^>]*>([^<]+)<\/title>/i]);
  const ogImage = absolutize(
    pickMeta(html, [
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ]),
    base,
  );
  const ogDescription = pickMeta(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ]);

  const images = extractImages(html, base);
  const videos = extractVideos(html, base);
  const price = priceFromJsonLd(product);

  const productImage = product?.image;
  const productImageUrl =
    typeof productImage === "string" ? productImage :
    Array.isArray(productImage) && typeof productImage[0] === "string" ? productImage[0] : null;

  const mainImage = absolutize(productImageUrl, base) || ogImage || images[0] || null;

  const brand = (() => {
    const b = product?.brand;
    if (typeof b === "string") return b;
    if (b && typeof b === "object" && typeof (b as Record<string, unknown>).name === "string") {
      return (b as { name: string }).name;
    }
    return null;
  })();

  const description =
    (typeof product?.description === "string" ? product.description : null) ||
    ogDescription ||
    (page.markdown ? page.markdown.slice(0, 1200) : null);

  const text = page.markdown && page.markdown.length > 200
    ? page.markdown
    : stripTags(html).slice(0, 12000);

  return {
    platform,
    platform_label: label,
    url: base,
    title: (typeof product?.name === "string" ? product.name : null) || ogTitle || htmlTitle,
    brand,
    model: typeof product?.model === "string" ? product.model : null,
    category: typeof product?.category === "string" ? product.category : null,
    description,
    specs: [],
    variations: [],
    stock_status: null,
    price: {
      value: price.value,
      currency: price.currency,
      display: price.value != null ? `${price.currency ?? ""} ${price.value}`.trim() : null,
      range: null,
      promotional: null,
      wholesale: null,
      moq: null,
    },
    images: {
      main: mainImage,
      gallery: images.filter((u) => u !== mainImage).slice(0, 24),
      videos,
    },
    seller: {
      name: null, store: null, location: null,
      years_active: null, type: null, certifications: [], reputation: null,
    },
    reviews: {
      total: null, average: null, positive_pct: null,
      highlights: [], complaints: [],
    },
    raw_signals: {
      text,
      html_title: htmlTitle,
      og_image: ogImage,
      jsonld,
    },
  };
}

export class GenericParser implements PlatformParser {
  readonly platform: Platform = "unknown";
  readonly label = "Marketplace genérico";
  readonly hostPatterns: RegExp[] = [];
  parse(page: ScrapedPage): ParsedListing {
    return genericParse(page, this.platform, this.label);
  }
}
