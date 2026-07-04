/**
 * Contrato dos parsers por plataforma.
 * Cada plataforma implementa PlatformParser e é registrada em ./registry.ts.
 * O parser recebe a página já renderizada (ScrapedPage) e devolve JSON
 * estruturado. NUNCA inventa dados — campos ausentes ficam em null/[].
 */
import type { ScrapedPage } from "../types";

export type Platform =
  | "goofish" | "xianyu" | "1688" | "taobao" | "tmall" | "alibaba"
  | "jd" | "pinduoduo" | "weidian" | "aliexpress" | "dhgate"
  | "made_in_china" | "global_sources" | "shopee" | "amazon" | "unknown";

export type PriceInfo = {
  value: number | null;
  currency: string | null;
  display: string | null;
  range: string | null;
  promotional: string | null;
  wholesale: string | null;
  moq: string | null;
};

export type SellerInfo = {
  name: string | null;
  store: string | null;
  location: string | null;
  years_active: string | null;
  type: string | null;
  certifications: string[];
  reputation: string | null;
};

export type ReviewsInfo = {
  total: string | null;
  average: string | null;
  positive_pct: string | null;
  highlights: string[];
  complaints: string[];
};

export type ParsedListing = {
  platform: Platform;
  platform_label: string;
  url: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  description: string | null;
  specs: { key: string; value: string }[];
  variations: string[];
  stock_status: string | null;
  price: PriceInfo;
  images: {
    main: string | null;
    gallery: string[];
    videos: string[];
  };
  seller: SellerInfo;
  reviews: ReviewsInfo;
  raw_signals: {
    /** Texto limpo (markdown) para uso pela IA. */
    text: string;
    /** Título HTML. */
    html_title: string | null;
    /** og:image. */
    og_image: string | null;
    /** JSON-LD encontrado (Product schema). */
    jsonld: unknown[];
  };
};

export interface PlatformParser {
  readonly platform: Platform;
  readonly label: string;
  /** Regex nos hostnames que essa plataforma cobre. */
  readonly hostPatterns: RegExp[];
  parse(page: ScrapedPage): ParsedListing;
}
