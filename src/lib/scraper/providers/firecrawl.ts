import type { ScrapeOptions, ScrapedPage, ScraperProvider } from "../types";

/**
 * Provider Firecrawl — usa a API REST v2 diretamente via fetch
 * para permanecer compatível com o runtime Worker (sem dependências Node).
 * https://docs.firecrawl.dev/api-reference/v2-introduction
 */
export class FirecrawlProvider implements ScraperProvider {
  readonly name = "firecrawl";
  private readonly endpoint = "https://api.firecrawl.dev/v2/scrape";

  isConfigured(): boolean {
    return !!process.env.FIRECRAWL_API_KEY;
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedPage> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw {
        code: "provider_missing_key",
        message: "FIRECRAWL_API_KEY não configurada.",
        providerName: this.name,
      };
    }

    const formats: unknown[] = ["html", "markdown", "links"];
    if (options.screenshot) formats.push("screenshot");

    const body: Record<string, unknown> = {
      url,
      formats,
      onlyMainContent: false,
      waitFor: options.waitForMs ?? 3500,
      timeout: options.timeoutMs ?? 30000,
      blockAds: true,
      removeBase64Images: true,
      location: {
        country: options.country ?? "CN",
        languages: options.locale ? [options.locale] : ["zh-CN", "zh", "en"],
      },
    };
    if (options.waitForSelector) {
      body.actions = [{ type: "wait", selector: options.waitForSelector, milliseconds: 4000 }];
    }

    const startedAt = Date.now();
    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout((options.timeoutMs ?? 30000) + 5000),
      });
    } catch (err) {
      throw {
        code: "timeout",
        message: `Firecrawl não respondeu: ${(err as Error).message}`,
        providerName: this.name,
      };
    }

    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const code = res.status === 402 ? "provider_error" : res.status === 429 ? "blocked" : "provider_error";
      console.error(`[scraper:firecrawl] HTTP ${res.status}: ${text.slice(0, 300)}`);
      throw {
        code,
        message: `Firecrawl HTTP ${res.status}: ${text.slice(0, 200)}`,
        status: res.status,
        providerName: this.name,
      };
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        html?: string;
        markdown?: string;
        screenshot?: string;
        metadata?: {
          statusCode?: number;
          sourceURL?: string;
          url?: string;
          title?: string;
          description?: string;
          [k: string]: unknown;
        };
      };
      error?: string;
    };

    if (!json.success || !json.data) {
      throw {
        code: "provider_error",
        message: json.error || "Firecrawl retornou payload vazio.",
        providerName: this.name,
      };
    }

    const meta = json.data.metadata ?? {};
    return {
      finalUrl: (meta.url as string) || (meta.sourceURL as string) || url,
      statusCode: (meta.statusCode as number) || 200,
      html: json.data.html ?? "",
      markdown: json.data.markdown ?? "",
      screenshot: json.data.screenshot ?? null,
      meta,
      providerName: this.name,
      elapsedMs,
    };
  }
}
