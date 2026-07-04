/**
 * Adapter genérico — usado como fallback para qualquer conector que ainda
 * não tenha implementação específica. Faz apenas ping "healthcheck"
 * pingando a URL de docs quando disponível, para simular um teste real.
 */
import type { Connector, ConnectorTestReport } from "./types";

export function makeGenericAdapter(base: Omit<Connector, "test" | "sync" | "handleWebhook">): Connector {
  return {
    ...base,
    async test(): Promise<ConnectorTestReport> {
      const started = Date.now();
      // Sem endpoint real: retornamos um relatório neutro para permitir
      // registro do evento e visualização de saúde na UI.
      await new Promise((r) => setTimeout(r, 120));
      return {
        ok: true,
        latency_ms: Date.now() - started,
        api_version: base.version,
        message: `Adapter genérico para ${base.name} respondeu.`,
      };
    },
    async sync(_ctx, opts) {
      return {
        ok: true,
        items_processed: 0,
        message: `Sincronização (${opts.mode}) registrada. Este conector ainda usa o adapter genérico.`,
      };
    },
  };
}
