/**
 * Parsers específicos por plataforma. Cada parser compõe o genericParse
 * (que resolve JSON-LD, og:*, imagens) e sobrescreve/estende com sinais
 * específicos da plataforma (seletores próprios, campos de vendedor,
 * moeda padrão etc).
 *
 * NOVA PLATAFORMA: implemente PlatformParser e registre em ./registry.ts.
 */
import type { ScrapedPage } from "../types";
import { genericParse } from "./generic";
import { pickMeta, stripTags } from "./helpers";
import type { ParsedListing, PlatformParser, Platform } from "./types";

/** Deduz preço a partir de padrões textuais quando o JSON-LD não trouxe. */
function inferPrice(
  base: ParsedListing,
  text: string,
  defaultCurrency: string,
): ParsedListing {
  if (base.price.value != null) return base;
  // Padrões: ¥123.45   RMB 45   CN¥ 89   US $12.50   $12.50
  const patterns: [RegExp, string][] = [
    [/(?:¥|￥|CN¥|RMB)\s*([\d]+(?:[.,]\d+)?)/i, "CNY"],
    [/US\s*\$\s*([\d]+(?:[.,]\d+)?)/i, "USD"],
    [/\$\s*([\d]+(?:[.,]\d+)?)/, defaultCurrency === "USD" ? "USD" : defaultCurrency],
    [/HK\$\s*([\d]+(?:[.,]\d+)?)/i, "HKD"],
    [/€\s*([\d]+(?:[.,]\d+)?)/, "EUR"],
    [/£\s*([\d]+(?:[.,]\d+)?)/, "GBP"],
    [/₩\s*([\d]+(?:[.,]\d+)?)/, "KRW"],
  ];
  for (const [re, currency] of patterns) {
    const m = text.match(re);
    if (m) {
      const value = Number(m[1].replace(",", "."));
      if (!Number.isNaN(value) && value > 0) {
        base.price.value = value;
        base.price.currency = currency;
        base.price.display = `${currency} ${value}`;
        return base;
      }
    }
  }
  return base;
}

/** Extrai MOQ (Minimum Order Quantity) — comum em 1688/Alibaba. */
function inferMOQ(text: string): string | null {
  const m =
    text.match(/(?:MOQ|Minimum Order|起订|起批)\s*[:：]?\s*([0-9]+\s*(?:pieces?|pcs|件|units?)?)/i) ||
    text.match(/([0-9]+)\s*(?:pieces?|pcs|units?)\s*\(min\.?\s*order\)/i);
  return m ? m[1].trim() : null;
}

/** Base compositor: genericParse + inferências + moeda default + platform id. */
function build(
  page: ScrapedPage,
  platform: Platform,
  label: string,
  opts: { defaultCurrency: string; enrich?: (p: ParsedListing, page: ScrapedPage) => void } = { defaultCurrency: "CNY" },
): ParsedListing {
  const parsed = genericParse(page, platform, label);
  const text = parsed.raw_signals.text;
  inferPrice(parsed, text, opts.defaultCurrency);
  parsed.price.moq = parsed.price.moq || inferMOQ(text);
  opts.enrich?.(parsed, page);
  return parsed;
}

export class GoofishParser implements PlatformParser {
  platform: Platform = "goofish";
  label = "Goofish (闲鱼)";
  hostPatterns = [/(?:^|\.)goofish\.com/i, /(?:^|\.)xianyu\.com/i, /2\.taobao\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class TaobaoParser implements PlatformParser {
  platform: Platform = "taobao";
  label = "Taobao";
  hostPatterns = [/(?:^|\.)taobao\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class TmallParser implements PlatformParser {
  platform: Platform = "tmall";
  label = "Tmall";
  hostPatterns = [/(?:^|\.)tmall\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class Alibaba1688Parser implements PlatformParser {
  platform: Platform = "1688";
  label = "1688";
  hostPatterns = [/(?:^|\.)1688\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, {
      defaultCurrency: "CNY",
      enrich: (p, page) => {
        const text = stripTags(page.html);
        const seller =
          pickMeta(page.html, [
            /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i,
          ]) || null;
        p.seller.store = p.seller.store || seller;
        const yearsM = text.match(/(\d+)\s*(?:年|years?)\s*(?:老店|老铺|on 1688)/i);
        if (yearsM) p.seller.years_active = `${yearsM[1]} anos`;
      },
    });
  }
}

export class AlibabaParser implements PlatformParser {
  platform: Platform = "alibaba";
  label = "Alibaba";
  hostPatterns = [/(?:^|\.)alibaba\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, {
      defaultCurrency: "USD",
      enrich: (p, page) => {
        const text = stripTags(page.html);
        // Gold Supplier / Verified Supplier
        const badges: string[] = [];
        if (/Gold Supplier/i.test(text)) badges.push("Gold Supplier");
        if (/Verified Supplier/i.test(text)) badges.push("Verified Supplier");
        if (/Trade Assurance/i.test(text)) badges.push("Trade Assurance");
        p.seller.certifications = badges;
        const yearsM = text.match(/(\d+)\s*(?:yrs?|years?)\s*(?:on Alibaba|Gold)/i);
        if (yearsM) p.seller.years_active = `${yearsM[1]} anos`;
      },
    });
  }
}

export class JDParser implements PlatformParser {
  platform: Platform = "jd";
  label = "JD.com";
  hostPatterns = [/(?:^|\.)jd\.com/i, /(?:^|\.)jd\.hk/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class PinduoduoParser implements PlatformParser {
  platform: Platform = "pinduoduo";
  label = "Pinduoduo / Temu";
  hostPatterns = [/pinduoduo|yangkeduo/i, /temu\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class WeidianParser implements PlatformParser {
  platform: Platform = "weidian";
  label = "Weidian";
  hostPatterns = [/weidian\.com/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "CNY" });
  }
}

export class AliExpressParser implements PlatformParser {
  platform: Platform = "aliexpress";
  label = "AliExpress";
  hostPatterns = [/aliexpress/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "USD" });
  }
}

export class DHGateParser implements PlatformParser {
  platform: Platform = "dhgate";
  label = "DHGate";
  hostPatterns = [/dhgate/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "USD" });
  }
}

export class MadeInChinaParser implements PlatformParser {
  platform: Platform = "made_in_china";
  label = "Made-in-China";
  hostPatterns = [/made-in-china/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "USD" });
  }
}

export class GlobalSourcesParser implements PlatformParser {
  platform: Platform = "global_sources";
  label = "Global Sources";
  hostPatterns = [/globalsources/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "USD" });
  }
}

export class ShopeeParser implements PlatformParser {
  platform: Platform = "shopee";
  label = "Shopee";
  hostPatterns = [/shopee/i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "BRL" });
  }
}

export class AmazonParser implements PlatformParser {
  platform: Platform = "amazon";
  label = "Amazon";
  hostPatterns = [/amazon\./i];
  parse(page: ScrapedPage) {
    return build(page, this.platform, this.label, { defaultCurrency: "USD" });
  }
}
