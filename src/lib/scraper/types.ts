/**
 * ScraperService — Camada de abstração para obtenção do HTML renderizado
 * de páginas de anúncios. Independente do provedor (Firecrawl, Playwright
 * próprio, Browserless, ScrapingBee, etc.).
 *
 * Princípio SOLID: qualquer implementação de ScraperProvider deve ser
 * substituível sem impactar o restante do pipeline (parser, câmbio, IA).
 */

export type ScrapeOptions = {
  /** Locale do navegador simulado. */
  locale?: string;
  /** País para geolocalização. */
  country?: string;
  /** Timeout total em ms. */
  timeoutMs?: number;
  /** Aguardar N ms extras após o load (para JS pesado). */
  waitForMs?: number;
  /** Seletor CSS que deve estar presente antes de considerar pronto. */
  waitForSelector?: string;
  /** Se o provider aceitar screenshot, capturar. */
  screenshot?: boolean;
  /** Reutilizar cache do provider (quando aplicável). */
  useProviderCache?: boolean;
};

export type ScrapedPage = {
  /** URL final (após redirects). */
  finalUrl: string;
  /** Status HTTP. */
  statusCode: number;
  /** HTML já renderizado (pós-JS). */
  html: string;
  /** Versão markdown limpa (quando o provider oferece). */
  markdown: string;
  /** Screenshot em URL/base64 quando disponível. */
  screenshot: string | null;
  /** Metadados fornecidos pelo provider (og:*, title, etc.). */
  meta: Record<string, unknown>;
  /** Nome do provider usado (útil para logs/debug). */
  providerName: string;
  /** Tempo de execução do provider em ms. */
  elapsedMs: number;
};

export type ScraperError = {
  code: "provider_missing_key" | "provider_error" | "invalid_url" | "timeout" | "blocked" | "unknown";
  message: string;
  status?: number;
  providerName: string;
};

export interface ScraperProvider {
  readonly name: string;
  /** Retorna true se o provider está configurado (ex.: env var da API key presente). */
  isConfigured(): boolean;
  /** Executa o scraping e devolve a página renderizada. Lança ScraperError em falha. */
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapedPage>;
}
