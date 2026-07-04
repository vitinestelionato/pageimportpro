// Buying agents registry — links source URL / keywords to the user's chosen agent.
export type BuyingAgent = {
  id: string;
  name: string;
  logo: string; // emoji or short label
  domain: string;
  color: string; // tailwind class fragment
  buildProductUrl: (sourceUrl: string) => string;
  buildSearchUrl: (keyword: string) => string;
};

const enc = (v: string) => encodeURIComponent(v);

// ---------- Source URL parser ----------
export type SourcePlatform =
  | "taobao"
  | "tmall"
  | "1688"
  | "weidian"
  | "xianyu"
  | "jd"
  | "pdd"
  | "unknown";

export type ParsedSource = {
  platform: SourcePlatform;
  itemId: string | null;
  raw: string;
};

/**
 * Extract platform + item id from a Chinese marketplace URL.
 * Supports taobao, tmall, 1688, weidian, xianyu/goofish, jd, pinduoduo.
 */
export function parseSourceUrl(rawInput: string): ParsedSource {
  const raw = (rawInput || "").trim();
  let host = "";
  let pathname = "";
  let search = "";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    host = u.hostname.toLowerCase();
    pathname = u.pathname;
    search = u.search;
  } catch {
    return { platform: "unknown", itemId: null, raw };
  }

  const params = new URLSearchParams(search);
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = params.get(k);
      if (v && /^\d{5,}$/.test(v)) return v;
    }
    return null;
  };
  const digits = (re: RegExp): string | null => {
    const m = pathname.match(re);
    return m?.[1] ?? null;
  };

  // Taobao / Tmall
  if (host.includes("taobao.com") || host.includes("tmall.com") || host.includes("tmall.hk")) {
    const id = pick("id", "itemId");
    const platform: SourcePlatform = host.includes("tmall") ? "tmall" : "taobao";
    return { platform, itemId: id, raw };
  }

  // 1688
  if (host.includes("1688.com")) {
    const id = digits(/\/offer\/(\d{5,})/) || pick("id", "offerId");
    return { platform: "1688", itemId: id, raw };
  }

  // Weidian
  if (host.includes("weidian.com") || host.includes("koudai.com")) {
    const id = pick("itemID", "itemId", "id") || digits(/\/item\/(\d{5,})/);
    return { platform: "weidian", itemId: id, raw };
  }

  // Xianyu / Goofish
  if (host.includes("goofish.com") || host.includes("xianyu.com") || host.includes("2.taobao.com")) {
    const id =
      pick("id", "itemId") ||
      digits(/\/item[\/\?].*?(\d{8,})/) ||
      digits(/(\d{10,})/);
    return { platform: "xianyu", itemId: id, raw };
  }

  // JD
  if (host.includes("jd.com") || host.includes("jd.hk")) {
    const id = digits(/\/(\d{5,})\.html/) || pick("sku", "id");
    return { platform: "jd", itemId: id, raw };
  }

  // Pinduoduo
  if (host.includes("pinduoduo.com") || host.includes("yangkeduo.com")) {
    const id = pick("goods_id", "id") || digits(/\/goods\/(\d{5,})/);
    return { platform: "pdd", itemId: id, raw };
  }

  return { platform: "unknown", itemId: null, raw };
}

// ---------- Per-agent builders ----------

// CSSBUY: item-{platformKey}-{id}.html
// Confirmed keys: micro (taobao), tmall, 1688, weidian, xianyu
const cssbuyKey: Record<SourcePlatform, string | null> = {
  taobao: "micro",
  tmall: "tmall",
  "1688": "1688",
  weidian: "weidian",
  xianyu: "xianyu",
  jd: null,
  pdd: null,
  unknown: null,
};

function cssbuyProductUrl(sourceUrl: string): string {
  const p = parseSourceUrl(sourceUrl);
  const key = cssbuyKey[p.platform];
  if (key && p.itemId) {
    return `https://www.cssbuy.com/item-${key}-${p.itemId}.html`;
  }
  return `https://www.cssbuy.com/index.php?a=jump&url=${enc(sourceUrl)}`;
}

// ACBUY: acbuy uses ?id={id}&source={TB|WD|1688|XY}
const acbuySource: Record<SourcePlatform, string | null> = {
  taobao: "TB",
  tmall: "TB",
  "1688": "AL",
  weidian: "WD",
  xianyu: "XY",
  jd: null,
  pdd: null,
  unknown: null,
};

function acbuyProductUrl(sourceUrl: string): string {
  const p = parseSourceUrl(sourceUrl);
  const src = acbuySource[p.platform];
  if (src && p.itemId) {
    return `https://www.acbuy.com/product?id=${p.itemId}&source=${src}`;
  }
  return `https://www.acbuy.com/product?source=&url=${enc(sourceUrl)}`;
}

// Ootdbuy: /goods/details?id={id}&channel={taobao|weidian|1688|xianyu}
const ootdChannel: Record<SourcePlatform, string | null> = {
  taobao: "taobao",
  tmall: "taobao",
  "1688": "1688",
  weidian: "weidian",
  xianyu: "xianyu",
  jd: null,
  pdd: null,
  unknown: null,
};

function ootdbuyProductUrl(sourceUrl: string): string {
  const p = parseSourceUrl(sourceUrl);
  const ch = ootdChannel[p.platform];
  if (ch && p.itemId) {
    return `https://www.ootdbuy.com/goods/details?id=${p.itemId}&channel=${ch}`;
  }
  return `https://www.ootdbuy.com/goods/details?url=${enc(sourceUrl)}`;
}

// Kakobuy: same item-{platform}-{id}.html pattern as cssbuy
function kakobuyProductUrl(sourceUrl: string): string {
  const p = parseSourceUrl(sourceUrl);
  const key = cssbuyKey[p.platform];
  if (key && p.itemId) {
    return `https://ikako.vip/item-${key}-${p.itemId}.html`;
  }
  return `https://kakobuy.com/item/details?url=${enc(sourceUrl)}`;
}

// Hoobuy: /product/{shopType}/{id}  — shopType: 1=weidian, 2=taobao/tmall, 0=1688
const hoobuyShop: Record<SourcePlatform, string | null> = {
  taobao: "2",
  tmall: "2",
  "1688": "0",
  weidian: "1",
  xianyu: null,
  jd: null,
  pdd: null,
  unknown: null,
};

function hoobuyProductUrl(sourceUrl: string): string {
  const p = parseSourceUrl(sourceUrl);
  const shop = hoobuyShop[p.platform];
  if (shop && p.itemId) {
    return `https://hoobuy.com/product/${shop}/${p.itemId}`;
  }
  return `https://hoobuy.com/product/import?url=${enc(sourceUrl)}`;
}

// Sugargoo: item detail page uses productLink param
function sugargooProductUrl(sourceUrl: string): string {
  return `https://www.sugargoo.com/#/home/productDetail?productLink=${enc(sourceUrl)}`;
}

// Superbuy / AllChinaBuy: /page/buynow/?url=
function superbuyProductUrl(sourceUrl: string): string {
  return `https://www.superbuy.com/en/page/buynow/?url=${enc(sourceUrl)}`;
}
function allchinabuyProductUrl(sourceUrl: string): string {
  return `https://www.allchinabuy.com/en/page/buynow/?url=${enc(sourceUrl)}`;
}

// Basetao: search with url as keyword
function basetaoProductUrl(sourceUrl: string): string {
  return `https://www.basetao.com/best-taobao-agent-service/search?keyword=${enc(sourceUrl)}`;
}

export const BUYING_AGENTS: BuyingAgent[] = [
  {
    id: "cssbuy",
    name: "CSSBUY",
    logo: "🟢",
    domain: "cssbuy.com",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    buildProductUrl: cssbuyProductUrl,
    buildSearchUrl: (q) => `https://www.cssbuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "acbuy",
    name: "ACBUY",
    logo: "🔵",
    domain: "acbuy.com",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    buildProductUrl: acbuyProductUrl,
    buildSearchUrl: (q) => `https://www.acbuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "sugargoo",
    name: "Sugargoo",
    logo: "🍬",
    domain: "sugargoo.com",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    buildProductUrl: sugargooProductUrl,
    buildSearchUrl: (q) => `https://www.sugargoo.com/#/home/productList?searchtext=${enc(q)}`,
  },
  {
    id: "superbuy",
    name: "Superbuy",
    logo: "🟠",
    domain: "superbuy.com",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    buildProductUrl: superbuyProductUrl,
    buildSearchUrl: (q) => `https://www.superbuy.com/en/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "hoobuy",
    name: "Hoobuy",
    logo: "🐼",
    domain: "hoobuy.com",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    buildProductUrl: hoobuyProductUrl,
    buildSearchUrl: (q) => `https://hoobuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "kakobuy",
    name: "Kakobuy",
    logo: "🥥",
    domain: "kakobuy.com",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    buildProductUrl: kakobuyProductUrl,
    buildSearchUrl: (q) => `https://kakobuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "ootdbuy",
    name: "Ootdbuy",
    logo: "👕",
    domain: "ootdbuy.com",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    buildProductUrl: ootdbuyProductUrl,
    buildSearchUrl: (q) => `https://www.ootdbuy.com/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "allchinabuy",
    name: "AllChinaBuy",
    logo: "🐉",
    domain: "allchinabuy.com",
    color: "bg-red-500/20 text-red-300 border-red-500/40",
    buildProductUrl: allchinabuyProductUrl,
    buildSearchUrl: (q) => `https://www.allchinabuy.com/en/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "basetao",
    name: "Basetao",
    logo: "🅱️",
    domain: "basetao.com",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    buildProductUrl: basetaoProductUrl,
    buildSearchUrl: (q) => `https://www.basetao.com/best-taobao-agent-service/search?keyword=${enc(q)}`,
  },
];

export const DEFAULT_AGENT_ID = "cssbuy";

export function getAgent(id: string | null | undefined): BuyingAgent {
  return BUYING_AGENTS.find((a) => a.id === id) ?? BUYING_AGENTS[0];
}
