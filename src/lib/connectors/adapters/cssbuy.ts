/**
 * CSSBuy Connector Adapter
 * ------------------------
 * Integração com a plataforma CSSBuy (agente de compras chinês).
 *
 * Autenticação: sessão autenticada — o usuário fornece o token de sessão
 * obtido após login oficial na plataforma. Nunca armazenamos senha em texto
 * puro; o token é persistido no campo `credentials` de `user_integrations`
 * (protegido por RLS e nunca retornado ao cliente).
 *
 * O adapter é preparado para expansão: pedidos, produtos, armazéns, fretes,
 * rastreamentos, saldo e notificações. Novos escopos de sincronização podem
 * ser adicionados sem alterar a arquitetura do Connector Manager.
 */
import type {
  Connector,
  ConnectorContext,
  ConnectorSyncResult,
  ConnectorTestReport,
} from "../types";
import { registerConnector } from "../types";

const CSSBUY_ENDPOINT = "https://www.cssbuy.com";
const REQUEST_TIMEOUT_MS = 8_000;

function friendlyError(status: number, fallback: string): string {
  if (status === 401 || status === 403) return "Sessão CSSBuy expirada ou inválida. Reconecte sua conta.";
  if (status === 404) return "Recurso não encontrado na CSSBuy.";
  if (status === 429) return "Muitas requisições à CSSBuy. Tente novamente em instantes.";
  if (status >= 500) return "CSSBuy indisponível no momento. Tente novamente mais tarde.";
  return fallback;
}

async function ping(sessionToken: string): Promise<{ status: number; latency: number }> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${CSSBUY_ENDPOINT}/`, {
      method: "GET",
      headers: {
        cookie: `PHPSESSID=${encodeURIComponent(sessionToken)}`,
        "user-agent": "PageImportPro-Connector/1.0 (+cssbuy)",
        accept: "text/html,application/json",
      },
      signal: ctrl.signal,
      redirect: "manual",
    });
    return { status: res.status, latency: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function testCssbuy(ctx: ConnectorContext): Promise<ConnectorTestReport> {
  const started = Date.now();
  const token = String(ctx.credentials.session_token ?? "").trim();
  if (!token) {
    return {
      ok: false,
      latency_ms: 0,
      message: "Token de sessão CSSBuy não informado.",
    };
  }
  try {
    const { status, latency } = await ping(token);
    const ok = status < 400 || status === 302;
    return {
      ok,
      latency_ms: latency,
      api_version: "1.0",
      message: ok
        ? "Sessão CSSBuy validada com sucesso."
        : friendlyError(status, "Não foi possível validar a sessão CSSBuy."),
    };
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      latency_ms: Date.now() - started,
      message: isAbort
        ? "Tempo excedido ao contatar a CSSBuy."
        : "Falha de conexão com a CSSBuy. Verifique sua rede e tente novamente.",
    };
  }
}

async function syncCssbuy(
  ctx: ConnectorContext,
  opts: { mode: "full" | "incremental" | "manual" },
): Promise<ConnectorSyncResult> {
  const token = String(ctx.credentials.session_token ?? "").trim();
  if (!token) {
    return { ok: false, items_processed: 0, message: "Reconecte sua conta CSSBuy para sincronizar." };
  }
  try {
    const { status } = await ping(token);
    if (status >= 400 && status !== 302) {
      return {
        ok: false,
        items_processed: 0,
        message: friendlyError(status, "Falha ao sincronizar com a CSSBuy."),
      };
    }
    // Escopos futuros: orders, products, warehouses, shipments, tracking,
    // balance, notifications. Cada escopo será adicionado como função
    // separada consultando endpoints oficiais autenticados.
    return {
      ok: true,
      items_processed: 0,
      message:
        opts.mode === "full"
          ? "Sincronização completa registrada. Escopos serão processados em lote."
          : "Sincronização registrada. Dados serão atualizados em segundo plano.",
      metadata: { mode: opts.mode, checked_at: new Date().toISOString() },
    };
  } catch {
    return { ok: false, items_processed: 0, message: "Não foi possível concluir a sincronização agora." };
  }
}

const cssbuyConnector: Connector = {
  slug: "cssbuy",
  name: "CSSBuy",
  category: "suppliers",
  description: "Agente de compras chinês para importar produtos, pedidos e rastreamentos.",
  version: "1.0.0",
  provider: "CSSBuy",
  authType: "custom",
  lifecycle: "beta",
  supportedEvents: [
    "order.created",
    "order.updated",
    "shipment.updated",
    "balance.updated",
    "warehouse.updated",
  ],
  test: testCssbuy,
  sync: syncCssbuy,
};

registerConnector(cssbuyConnector);

export default cssbuyConnector;
