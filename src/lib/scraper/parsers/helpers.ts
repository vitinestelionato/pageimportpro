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
  const urls = new Set<string>();
  const re = /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) && urls.size < limit) {
    const abs = absolutize(m[1], base);
    if (abs && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(abs)) urls.add(abs);
  }
  return Array.from(urls);
}

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
