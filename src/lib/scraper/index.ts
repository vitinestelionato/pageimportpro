import { FirecrawlProvider } from "./providers/firecrawl";
import type { ScrapeOptions, ScrapedPage, ScraperProvider } from "./types";

export type { ScrapeOptions, ScrapedPage, ScraperProvider } from "./types";

/**
 * ScraperService — facade que expõe uma API estável ao restante do sistema.
 *
 * O provider padrão pode ser trocado a qualquer momento (ex.: por uma API
 * própria em Node/Playwright) implementando ScraperProvider e registrando
 * aqui, sem alterar chamadores.
 */
export class ScraperService {
  private readonly providers: ScraperProvider[];

  constructor(providers?: ScraperProvider[]) {
    this.providers = providers && providers.length > 0 ? providers : ScraperService.defaultProviders();
  }

  static defaultProviders(): ScraperProvider[] {
    // Ordem = preferência. Amanhã, para trocar por Playwright próprio,
    // basta adicionar `new PlaywrightProvider()` no topo (ou substituir).
    return [new FirecrawlProvider()];
  }

  /** Provider ativo (primeiro configurado). */
  activeProvider(): ScraperProvider | null {
    return this.providers.find((p) => p.isConfigured()) ?? null;
  }

  isAvailable(): boolean {
    return this.activeProvider() !== null;
  }

  async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedPage> {
    if (!/^https?:\/\//i.test(url)) {
      throw {
        code: "invalid_url" as const,
        message: "URL inválida para scraping.",
        providerName: "scraper-service",
      };
    }

    let lastError: unknown = null;
    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      try {
        return await provider.scrape(url, options);
      } catch (err) {
        lastError = err;
        console.warn(
          `[scraper] provider "${provider.name}" falhou:`,
          (err as { message?: string })?.message ?? err,
        );
      }
    }
    if (lastError) throw lastError;
    throw {
      code: "provider_missing_key" as const,
      message: "Nenhum provider de scraping está configurado.",
      providerName: "scraper-service",
    };
  }
}

let singleton: ScraperService | null = null;
export function getScraperService(): ScraperService {
  if (!singleton) singleton = new ScraperService();
  return singleton;
}
