/**
 * Connector SDK — interface padrão que todos os conectores do sistema
 * devem implementar. Serve como contrato único para autenticação,
 * configuração, sincronização, testes e webhooks.
 *
 * Novo conector = novo módulo em src/lib/connectors/adapters/<slug>.ts
 * exportando um objeto que satisfaz `Connector` e registrando no registry.
 */

export type ConnectorCategory =
  | "marketplaces"
  | "suppliers"
  | "payments"
  | "banks"
  | "shipping"
  | "postal"
  | "fx"
  | "ai"
  | "erp"
  | "crm"
  | "automation"
  | "storage"
  | "communication"
  | "analytics"
  | "other";

export type ConnectorAuthType =
  | "oauth2"
  | "api_key"
  | "bearer"
  | "webhook"
  | "custom"
  | "builtin";

export type ConnectorLifecycle = "beta" | "stable" | "deprecated";

export type ConnectorTestReport = {
  ok: boolean;
  latency_ms: number;
  api_version?: string | null;
  scopes?: string[];
  rate_limit_remaining?: number | null;
  message: string;
};

export type ConnectorSyncResult = {
  ok: boolean;
  items_processed: number;
  message: string;
  metadata?: Record<string, unknown>;
};

export type ConnectorContext = {
  credentials: Record<string, string | number | boolean>;
  config: Record<string, unknown>;
  connectionId: string;
  userId: string;
};

export interface Connector {
  slug: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  version: string;
  provider: string;
  authType: ConnectorAuthType;
  lifecycle: ConnectorLifecycle;
  supportedEvents: string[];
  /** Testa a conexão. Deve ser rápido e não destrutivo. */
  test?: (ctx: ConnectorContext) => Promise<ConnectorTestReport>;
  /** Executa sincronização (completa ou incremental). */
  sync?: (
    ctx: ConnectorContext,
    opts: { mode: "full" | "incremental" | "manual" },
  ) => Promise<ConnectorSyncResult>;
  /** Processa payload de webhook. */
  handleWebhook?: (
    ctx: ConnectorContext,
    payload: unknown,
  ) => Promise<{ ok: boolean; message?: string }>;
}

// ---------------------------------------------------------------------------
// Registry — singleton em memória; adapters são registrados por import.
// ---------------------------------------------------------------------------
const registry = new Map<string, Connector>();

export function registerConnector(c: Connector) {
  registry.set(c.slug, c);
}

export function getConnector(slug: string): Connector | undefined {
  return registry.get(slug);
}

export function listConnectors(): Connector[] {
  return Array.from(registry.values());
}
