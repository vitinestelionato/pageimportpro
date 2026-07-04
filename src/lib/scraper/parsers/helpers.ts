/**
 * Helpers puros compartilhados entre parsers.
 */

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1].trim());
  }
  return null;
}

export function absolutize(url: string | null, base: string): string | null {
  if (!url) return null;
  try { return new URL(url, base).toString(); } catch { return null; }
}

export function extractImages(html: string, base: string, limit = 40): string[] {
/**
 * Padrões que indicam imagens NÃO-produto: logos do site, banners de UI,
 * avatares, ícones, sprites, spacers, badges, placeholders, propagandas.
 * Aplicado tanto ao path da URL quanto ao alt/aria adjacente.
 */
const NON_PRODUCT_URL_RE =
  /\b(logo|favicon|sprite|icon|avatar|banner|header|footer|nav|menu|badge|spacer|blank|placeholder|default|watermark|share|social|qrcode|qr[-_]?code|download|appstore|googleplay|ads?|advert|promo|coupon|button|arrow|bg[-_]|background)\b/i;

const XIANYU_ASSET_HOSTS = /gw\.alicdn\.com\/(imgextra\/i[0-9]+|tfs\/)/i; // hosts de produto reais
const KNOWN_PRODUCT_CDN_RE = /(alicdn|taobaocdn|xianyu|aliexpress|1688|jdcdn|360buyimg|dhgate|pddpic|weidian|amazon|ssl-images-amazon|mia-img|shopee)/i;

/** Descarta imagens que claramente não são fotos do produto. */
function isLikelyProductImage(url: string): boolean {
  if (/^data:/i.test(url)) return false;
  const lower = url.toLowerCase();
  if (NON_PRODUCT_URL_RE.test(lower)) return false;
  // gif normalmente é sprite/animação de UI — bloqueia salvo se vier de CDN de produto
  if (/\.gif(\?|$)/i.test(lower) && !KNOWN_PRODUCT_CDN_RE.test(lower)) return false;
  // Dimensões declaradas na URL indicando ícones (ex: _40x40, 60x60, 100x100)
  const dimMatch = lower.match(/[_-](\d{2,4})x(\d{2,4})\b/);
  if (dimMatch) {
    const w = Number(dimMatch[1]);
    const h = Number(dimMatch[2]);
    if (w < 200 || h < 200) return false;
  }
  return true;
}

export function extractImages(html: string, base: string, limit = 40): string[] {
  const urls = new Set<string>();
  const re = /<img[^>]+(?:src|data-src|data-lazy-src|data-original|data-ks-lazyload)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) && urls.size < limit) {
    const abs = absolutize(m[1], base);
    if (!abs) continue;
    if (!/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(abs)) continue;
    if (!isLikelyProductImage(abs)) continue;
    urls.add(abs);
  }
  return Array.from(urls);
}

/** Ranqueia imagens: CDNs conhecidas de produto ganham prioridade. */
export function rankProductImages(urls: string[]): string[] {
  return [...urls].sort((a, b) => {
    const aScore = KNOWN_PRODUCT_CDN_RE.test(a) ? 1 : 0;
    const bScore = KNOWN_PRODUCT_CDN_RE.test(b) ? 1 : 0;
    if (aScore !== bScore) return bScore - aScore;
    // prefere imagens maiores (heurística: quanto maior a URL, mais provável ter query de resize/hash)
    return b.length - a.length;
  });
}

// suprimimos aviso de "unused" quando XIANYU_ASSET_HOSTS não for referenciado externamente
void XIANYU_ASSET_HOSTS;

export function extractVideos(html: string, base: string): string[] {
  const urls = new Set<string>();
  const re = /<(?:video|source)[^>]+src=["']([^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const abs = absolutize(m[1], base);
    if (abs) urls.add(abs);
  }
  return Array.from(urls);
}

export function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch { /* ignora blocos inválidos */ }
  }
  return out;
}

/** Procura um schema.org/Product no JSON-LD. */
export function findProductJsonLd(jsonld: unknown[]): Record<string, unknown> | null {
  for (const entry of jsonld) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const type = obj["@type"];
    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
      return obj;
    }
    if (Array.isArray(obj["@graph"])) {
      const inner = findProductJsonLd(obj["@graph"] as unknown[]);
      if (inner) return inner;
    }
  }
  return null;
}
