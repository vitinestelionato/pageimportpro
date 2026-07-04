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
