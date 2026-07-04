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

export const BUYING_AGENTS: BuyingAgent[] = [
  {
    id: "cssbuy",
    name: "CSSBUY",
    logo: "🟢",
    domain: "cssbuy.com",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    buildProductUrl: (u) => `https://www.cssbuy.com/index.php?a=jump&url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.cssbuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "acbuy",
    name: "ACBUY",
    logo: "🔵",
    domain: "acbuy.com",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    buildProductUrl: (u) => `https://www.acbuy.com/product?source=&url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.acbuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "sugargoo",
    name: "Sugargoo",
    logo: "🍬",
    domain: "sugargoo.com",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    buildProductUrl: (u) => `https://www.sugargoo.com/index/item/index.html?tp=taobao&url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.sugargoo.com/#/home/productList?searchtext=${enc(q)}`,
  },
  {
    id: "superbuy",
    name: "Superbuy",
    logo: "🟠",
    domain: "superbuy.com",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    buildProductUrl: (u) => `https://www.superbuy.com/en/page/buynow/?url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.superbuy.com/en/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "hoobuy",
    name: "Hoobuy",
    logo: "🐼",
    domain: "hoobuy.com",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    buildProductUrl: (u) => `https://hoobuy.com/product/import?url=${enc(u)}`,
    buildSearchUrl: (q) => `https://hoobuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "kakobuy",
    name: "Kakobuy",
    logo: "🥥",
    domain: "kakobuy.com",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    buildProductUrl: (u) => `https://kakobuy.com/item/details?url=${enc(u)}`,
    buildSearchUrl: (q) => `https://kakobuy.com/search?keyword=${enc(q)}`,
  },
  {
    id: "ootdbuy",
    name: "Ootdbuy",
    logo: "👕",
    domain: "ootdbuy.com",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    buildProductUrl: (u) => `https://www.ootdbuy.com/goods/details?url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.ootdbuy.com/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "allchinabuy",
    name: "AllChinaBuy",
    logo: "🐉",
    domain: "allchinabuy.com",
    color: "bg-red-500/20 text-red-300 border-red-500/40",
    buildProductUrl: (u) => `https://www.allchinabuy.com/en/page/buynow/?url=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.allchinabuy.com/en/goods/search?keyword=${enc(q)}`,
  },
  {
    id: "basetao",
    name: "Basetao",
    logo: "🅱️",
    domain: "basetao.com",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    buildProductUrl: (u) => `https://www.basetao.com/best-taobao-agent-service/search?keyword=${enc(u)}`,
    buildSearchUrl: (q) => `https://www.basetao.com/best-taobao-agent-service/search?keyword=${enc(q)}`,
  },
];

export const DEFAULT_AGENT_ID = "cssbuy";

export function getAgent(id: string | null | undefined): BuyingAgent {
  return BUYING_AGENTS.find((a) => a.id === id) ?? BUYING_AGENTS[0];
}
