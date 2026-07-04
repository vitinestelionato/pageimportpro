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

    const buildBody = (proxy: "basic" | "stealth" | "auto"): Record<string, unknown> => {
      const body: Record<string, unknown> = {
        url,
        formats,
        onlyMainContent: false,
        waitFor: options.waitForMs ?? 3500,
        timeout: options.timeoutMs ?? 30000,
        blockAds: true,
        removeBase64Images: true,
        proxy,
        location: {
          country: options.country ?? "CN",
          languages: options.locale ? [options.locale] : ["zh-CN", "zh", "en"],
        },
      };
      if (options.waitForSelector) {
        body.actions = [{ type: "wait", selector: options.waitForSelector, milliseconds: 4000 }];
      }
      return body;
    };

    // Tenta em cascata: auto (rápido) → stealth (contorna proxies bloqueados
    // por marketplaces asiáticos: taobao, 1688, weidian, goofish, jd).
    const attempts: ("auto" | "stealth")[] = ["auto", "stealth"];
    const startedAt = Date.now();
    let lastStatus = 0;
    let lastBody = "";

    for (const proxy of attempts) {
      let res: Response;
      try {
        res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(buildBody(proxy)),
          signal: AbortSignal.timeout((options.timeoutMs ?? 30000) + 15000),
        });
      } catch (err) {
        console.warn(`[scraper:firecrawl] fetch falhou (proxy=${proxy}):`, (err as Error).message);
        lastBody = (err as Error).message;
        continue;
      }

      if (res.ok) {
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

        if (json.success && json.data) {
          const meta = json.data.metadata ?? {};
          const elapsedMs = Date.now() - startedAt;
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
        lastStatus = 200;
        lastBody = json.error || "payload vazio";
        console.warn(`[scraper:firecrawl] payload sem sucesso (proxy=${proxy}): ${lastBody}`);
        continue;
      }

      lastStatus = res.status;
      lastBody = await res.text().catch(() => "");
      console.warn(`[scraper:firecrawl] HTTP ${res.status} (proxy=${proxy}): ${lastBody.slice(0, 250)}`);

      // 402 = créditos esgotados; não adianta tentar outro proxy.
      if (res.status === 402) break;
    }

    // Todas as tentativas falharam — mapeia para código amigável.
    const code =
      lastStatus === 402 ? "provider_error" :
      lastStatus === 429 ? "blocked" :
      lastStatus === 0 ? "timeout" :
      "blocked";

    const friendly =
      lastStatus === 402
        ? "Créditos do Firecrawl esgotados. Renove seu plano para retomar as leituras."
        : /TUNNEL|proxy|403|blocked|403 Forbidden/i.test(lastBody)
          ? "O marketplace bloqueou a leitura (proxy). Tente novamente em alguns segundos ou use outro anúncio da mesma loja."
          : lastStatus === 429
            ? "Muitas leituras em sequência. Aguarde alguns segundos e tente de novo."
            : "Não foi possível abrir esta página. O site pode estar exigindo login ou bloqueando bots.";

    console.error(`[scraper:firecrawl] falha final status=${lastStatus} body=${lastBody.slice(0, 300)}`);
    throw {
      code,
      message: friendly,
      status: lastStatus || undefined,
      providerName: this.name,
    };
  }
}
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
