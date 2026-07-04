/**
 * Registro central de parsers de plataforma.
 * Adicionar nova plataforma = instanciar aqui.
 */
import type { ScrapedPage } from "../types";
import { GenericParser } from "./generic";
import {
  Alibaba1688Parser,
  AlibabaParser,
  AliExpressParser,
  AmazonParser,
  DHGateParser,
  GlobalSourcesParser,
  GoofishParser,
  JDParser,
  MadeInChinaParser,
  PinduoduoParser,
  ShopeeParser,
  TaobaoParser,
  TmallParser,
  WeidianParser,
} from "./platforms";
import type { ParsedListing, Platform, PlatformParser } from "./types";

// Ordem importa: parsers mais específicos primeiro (Xianyu antes de Taobao).
const REGISTRY: PlatformParser[] = [
  new GoofishParser(),
  new Alibaba1688Parser(),
  new TmallParser(),
  new TaobaoParser(),
  new AlibabaParser(),
  new JDParser(),
  new PinduoduoParser(),
  new WeidianParser(),
  new AliExpressParser(),
  new DHGateParser(),
  new MadeInChinaParser(),
  new GlobalSourcesParser(),
  new ShopeeParser(),
  new AmazonParser(),
];

const FALLBACK = new GenericParser();

export function detectPlatform(url: string | null): { parser: PlatformParser; platform: Platform; label: string } {
  if (url) {
    try {
      const host = new URL(url).hostname;
      for (const parser of REGISTRY) {
        if (parser.hostPatterns.some((re) => re.test(host))) {
          return { parser, platform: parser.platform, label: parser.label };
        }
      }
    } catch { /* URL inválida — cai no fallback */ }
  }
  return { parser: FALLBACK, platform: FALLBACK.platform, label: FALLBACK.label };
}

export function parsePage(page: ScrapedPage): ParsedListing {
  const { parser } = detectPlatform(page.finalUrl);
  return parser.parse(page);
}

export function listSupportedPlatforms(): { platform: Platform; label: string }[] {
  return REGISTRY.map((p) => ({ platform: p.platform, label: p.label }));
}
