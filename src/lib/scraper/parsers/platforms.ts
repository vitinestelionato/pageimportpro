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

/** Extrai sinais genéricos de vendedor a partir do texto/HTML.
 *  Sobrescreve apenas campos ainda vazios em `parsed.seller`. */
function inferSeller(parsed: ParsedListing, page: ScrapedPage): void {
  const html = page.html || "";
  const text = parsed.raw_signals.text || stripTags(html);
  const s = parsed.seller;

  // Nome da loja / vendedor
  if (!s.store) {
    const m =
      html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
      text.match(/(?:店铺|店铺名称|Shop(?:\s*Name)?|Store(?:\s*Name)?|Sold by|Vendido por)\s*[:：]\s*([^\n\r|·•]{2,60})/i);
    if (m) s.store = m[1].trim();
  }
  if (!s.name) {
    const m =
      text.match(/(?:卖家|个人卖家|Seller|Vendedor)\s*[:：]\s*([^\n\r|·•]{2,60})/i) ||
      text.match(/(?:by|By)\s+([A-Z][\w\s&.'-]{1,40})\s*(?:Store|Shop|Official)/);
    if (m) s.name = m[1].trim();
  }

  // Localização
  if (!s.location) {
    const m =
      text.match(/(?:发货地|所在地|宝贝所在地|Ships from|Location|Localização)\s*[:：]?\s*([^\n\r|·•]{2,60})/i) ||
      text.match(/(?:Province|省|市)\s*[:：]?\s*([\u4e00-\u9fa5A-Za-z\s]{2,40})/);
    if (m) s.location = m[1].trim();
  }

  // Tempo de atuação
  if (!s.years_active) {
    const m =
      text.match(/(\d+)\s*(?:年|years?)\s*(?:老店|老铺|on\s+\w+|Store|selling)/i) ||
      text.match(/(?:Established|Since|开店时间|注册于)\s*[:：]?\s*(\d{4})/i) ||
      text.match(/(\d+)\s*(?:年|years?)\s*(?:of experience|经营)/i);
    if (m) {
      if (/^\d{4}$/.test(m[1])) {
        const years = new Date().getFullYear() - Number(m[1]);
        if (years >= 0 && years < 60) s.years_active = `${years} anos (desde ${m[1]})`;
      } else {
        s.years_active = `${m[1]} anos`;
      }
    }
  }

  // Reputação (score/avaliações do vendedor)
  if (!s.reputation) {
    const m =
      text.match(/(?:卖家信用|信用等级|Seller Rating|Feedback|Positive)\s*[:：]?\s*([0-9.]+%?\s*(?:\/\s*5)?)/i) ||
      text.match(/([0-9]{2,3}(?:\.[0-9]+)?%)\s*(?:positive|好评|好評)/i);
    if (m) s.reputation = m[1].trim();
  }

  // Certificações / selos comuns
  const badges = new Set(s.certifications);
  const badgeChecks: [RegExp, string][] = [
    [/Gold Supplier/i, "Gold Supplier"],
    [/Verified Supplier/i, "Verified Supplier"],
    [/Trade Assurance/i, "Trade Assurance"],
    [/Official\s+Store/i, "Official Store"],
    [/Power\s+Merchant|Preferred/i, "Preferred Seller"],
    [/天猫|Tmall/i, "Tmall"],
    [/实名认证|Verified/i, "Verified Account"],
    [/超级卖家|Super Seller/i, "Super Seller"],
  ];
  for (const [re, label] of badgeChecks) if (re.test(text)) badges.add(label);
  s.certifications = Array.from(badges);
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
  inferSeller(parsed, page);
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
