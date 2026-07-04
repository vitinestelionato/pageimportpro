import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Central de Conexões — camada única para gerenciar integrações externas.
 * Todo acesso é autenticado e passa pela RLS do usuário.
 */

const SlugSchema = z.string().min(1).max(64);

// ---------------------------------------------------------------------------
// Listar catálogo + status do usuário
// ---------------------------------------------------------------------------
export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [catalog, connections] = await Promise.all([
      supabase
        .from("integrations")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("user_integrations")
        .select("id, integration_slug, status, account_label, last_sync_at, last_error, expires_at, updated_at")
        .eq("user_id", userId),
    ]);

    if (catalog.error) throw new Error("Não foi possível carregar as integrações.");
    if (connections.error) throw new Error("Não foi possível carregar suas conexões.");

    const bySlug = new Map(
      (connections.data ?? []).map((c) => [c.integration_slug, c]),
    );

    return (catalog.data ?? []).map((item) => ({
      ...item,
      connection: bySlug.get(item.slug) ?? null,
    }));
  });

// ---------------------------------------------------------------------------
// Conectar
// ---------------------------------------------------------------------------
const ConnectSchema = z.object({
  slug: SlugSchema,
  account_label: z.string().max(120).optional().nullable(),
  credentials: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const connectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConnectSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    // Valida se a integração existe e não é "coming soon"
    const { data: integration, error: intErr } = await supabase
      .from("integrations")
      .select("slug, name, is_coming_soon, auth_type")
      .eq("slug", data.slug)
      .maybeSingle();

    if (intErr || !integration) throw new Error("Integração não encontrada.");
    if (integration.is_coming_soon) {
      throw new Error(`${integration.name} ainda não está disponível.`);
    }

    // Upsert da conexão
    const { data: upserted, error: upErr } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: userId,
          integration_slug: data.slug,
          account_label: data.account_label ?? null,
          credentials: data.credentials,
          config: data.config as Record<string, never>,
          status: "connected",
          last_error: null,
        },
        { onConflict: "user_id,integration_slug,account_label" },
      )
      .select("id")
      .maybeSingle();

    if (upErr) throw new Error("Não foi possível salvar a conexão.");

    await supabase.from("integration_events").insert({
      user_id: userId,
      integration_slug: data.slug,
      action: "connect",
      status: "success",
      message: `Conectado a ${integration.name}.`,
      duration_ms: Date.now() - started,
    });

    return { ok: true, id: upserted?.id };
  });

// ---------------------------------------------------------------------------
// Desconectar
// ---------------------------------------------------------------------------
export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: SlugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("user_integrations")
      .update({ status: "disconnected", credentials: {} })
      .eq("user_id", userId)
      .eq("integration_slug", data.slug);

    if (error) throw new Error("Não foi possível desconectar.");

    await supabase.from("integration_events").insert({
      user_id: userId,
      integration_slug: data.slug,
      action: "disconnect",
      status: "info",
      message: "Conexão desativada pelo usuário.",
    });

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Sincronizar (stub — cada integração terá seu handler específico)
// ---------------------------------------------------------------------------
export const syncIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: SlugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    const { data: conn, error } = await supabase
      .from("user_integrations")
      .select("id, status")
      .eq("user_id", userId)
      .eq("integration_slug", data.slug)
      .maybeSingle();

    if (error || !conn) throw new Error("Conexão não encontrada.");
    if (conn.status !== "connected") throw new Error("Conexão não está ativa.");

    // Ponto de extensão: aqui entra o handler específico por slug.
    // Por enquanto, apenas registra a sincronização.
    await supabase
      .from("user_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_error: null })
      .eq("id", conn.id);

    await supabase.from("integration_events").insert({
      user_id: userId,
      integration_slug: data.slug,
      action: "sync",
      status: "success",
      message: "Sincronização concluída.",
      duration_ms: Date.now() - started,
    });

    return { ok: true, synced_at: new Date().toISOString() };
  });

// ---------------------------------------------------------------------------
// Logs do usuário
// ---------------------------------------------------------------------------
export const listIntegrationEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: SlugSchema.optional(),
        status: z.enum(["success", "error", "info", "warning"]).optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let q = supabase
      .from("integration_events")
      .select("id, integration_slug, action, status, message, duration_ms, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.slug) q = q.eq("integration_slug", data.slug);
    if (data.status) q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error("Não foi possível carregar os logs.");
    return rows ?? [];
  });

// ---------------------------------------------------------------------------
// Connector Manager — testar conexão
// ---------------------------------------------------------------------------
export const testConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: SlugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    const { data: conn } = await supabase
      .from("user_integrations")
      .select("id, credentials, config, avg_response_ms, error_count")
      .eq("user_id", userId)
      .eq("integration_slug", data.slug)
      .maybeSingle();

    if (!conn) throw new Error("Conexão não encontrada.");

    const { getConnector } = await import("@/lib/connectors/types");
    const { makeGenericAdapter } = await import("@/lib/connectors/generic-adapter");

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    const adapter =
      getConnector(data.slug) ??
      makeGenericAdapter({
        slug: data.slug,
        name: integration?.name ?? data.slug,
        category: (integration?.category as never) ?? "other",
        description: integration?.description ?? "",
        version: integration?.version ?? "1.0.0",
        provider: integration?.provider ?? integration?.name ?? data.slug,
        authType: (integration?.auth_type as never) ?? "api_key",
        lifecycle: (integration?.lifecycle_status as never) ?? "stable",
        supportedEvents: integration?.supported_events ?? [],
      });

    let report;
    try {
      report = await adapter.test!({
        credentials: (conn.credentials ?? {}) as Record<string, string>,
        config: (conn.config ?? {}) as Record<string, unknown>,
        connectionId: conn.id,
        userId,
      });
    } catch (e) {
      report = {
        ok: false,
        latency_ms: Date.now() - started,
        message: e instanceof Error ? e.message : "Falha ao testar conexão.",
      };
    }

    const priorAvg = conn.avg_response_ms ?? report.latency_ms;
    const newAvg = Math.round((priorAvg * 3 + report.latency_ms) / 4);

    await supabase
      .from("user_integrations")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_result: report as unknown as Record<string, never>,
        health_status: report.ok ? "healthy" : "unhealthy",
        avg_response_ms: newAvg,
        error_count: report.ok ? conn.error_count : (conn.error_count ?? 0) + 1,
      })
      .eq("id", conn.id);

    await supabase.from("integration_events").insert({
      user_id: userId,
      integration_slug: data.slug,
      action: "test",
      status: report.ok ? "success" : "error",
      message: report.message,
      duration_ms: report.latency_ms,
    });

    return report;
  });

// ---------------------------------------------------------------------------
// Connector Manager — disparar sincronização (cria sync_job)
// ---------------------------------------------------------------------------
export const triggerSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      slug: SlugSchema,
      mode: z.enum(["manual", "incremental", "full"]).default("manual"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conn } = await supabase
      .from("user_integrations")
      .select("id, status")
      .eq("user_id", userId)
      .eq("integration_slug", data.slug)
      .maybeSingle();
    if (!conn) throw new Error("Conexão não encontrada.");
    if (conn.status !== "connected") throw new Error("Conexão não está ativa.");

    const started = Date.now();
    const { data: job, error: jobErr } = await supabase
      .from("sync_jobs")
      .insert({
        user_id: userId,
        connection_id: conn.id,
        integration_slug: data.slug,
        job_type: data.mode,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (jobErr || !job) throw new Error("Não foi possível enfileirar a sincronização.");

    const { getConnector } = await import("@/lib/connectors/types");
    const adapter = getConnector(data.slug);
    let result = { ok: true, items_processed: 0, message: "Sincronização registrada." };
    try {
      if (adapter?.sync) {
        result = await adapter.sync(
          { credentials: {}, config: {}, connectionId: conn.id, userId },
          { mode: data.mode === "manual" ? "manual" : (data.mode as "full" | "incremental") },
        );
      }
    } catch (e) {
      result = { ok: false, items_processed: 0, message: e instanceof Error ? e.message : "Falha na sincronização." };
    }

    const finishedAt = new Date().toISOString();
    const duration = Date.now() - started;

    await supabase
      .from("sync_jobs")
      .update({
        status: result.ok ? "completed" : "failed",
        finished_at: finishedAt,
        duration_ms: duration,
        items_processed: result.items_processed,
        error_message: result.ok ? null : result.message,
      })
      .eq("id", job.id);

    if (result.ok) {
      await supabase
        .from("user_integrations")
        .update({ last_sync_at: finishedAt, last_error: null })
        .eq("id", conn.id);
    } else {
      await supabase
        .from("user_integrations")
        .update({ last_error: result.message })
        .eq("id", conn.id);
    }

    await supabase.from("integration_events").insert({
      user_id: userId,
      integration_slug: data.slug,
      action: "sync",
      status: result.ok ? "success" : "error",
      message: result.message,
      duration_ms: duration,
    });

    return { job_id: job.id, ok: result.ok, items_processed: result.items_processed, message: result.message };
  });

// ---------------------------------------------------------------------------
// Connector Manager — listar sync jobs
// ---------------------------------------------------------------------------
export const listSyncJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      slug: SlugSchema.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("sync_jobs")
      .select("id, integration_slug, job_type, status, duration_ms, items_processed, error_message, created_at, finished_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.slug) q = q.eq("integration_slug", data.slug);
    const { data: rows, error } = await q;
    if (error) throw new Error("Não foi possível carregar as sincronizações.");
    return rows ?? [];
  });

