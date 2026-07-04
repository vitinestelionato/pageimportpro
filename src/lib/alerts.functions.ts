import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALERT_TYPES = ["price_target", "price_drop", "exchange_rate", "stock_low", "shipment_update", "custom_reminder"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["active", "paused", "triggered"] as const;
const COMPARISONS = ["lt", "gt", "eq", "lte", "gte"] as const;

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(ALERT_TYPES),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullish(),
  target_value: z.number().nullish(),
  current_value: z.number().nullish(),
  comparison: z.enum(COMPARISONS).nullish(),
  reference_url: z.string().url().max(500).nullish().or(z.literal("")),
  reference_label: z.string().max(160).nullish(),
  priority: z.enum(PRIORITIES).default("medium"),
  notify_email: z.boolean().default(false),
  notify_in_app: z.boolean().default(true),
  due_at: z.string().datetime().nullish().or(z.literal("")),
});

function clean<T extends Record<string, unknown>>(v: T) {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) out[k] = val === "" ? null : val;
  return out;
}

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("*")
      .order("status", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = { ...clean(rest), user_id: context.userId } as never;
    if (id) {
      const { error } = await context.supabase
        .from("alerts").update(payload).eq("id", id).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("alerts").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alerts").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAlertStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alerts").update({ status: data.status }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), current_value: z.number().nullish() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: alert, error: e1 } = await context.supabase
      .from("alerts").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (e1 || !alert) throw new Error(e1?.message ?? "Alerta não encontrado");

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { last_checked_at: now };
    if (data.current_value != null) patch.current_value = data.current_value;

    // Simple trigger evaluation
    const cv = data.current_value ?? alert.current_value;
    if (alert.target_value != null && cv != null && alert.comparison) {
      const t = alert.target_value; const c = alert.comparison;
      const hit =
        (c === "lt" && cv < t) || (c === "lte" && cv <= t) ||
        (c === "gt" && cv > t) || (c === "gte" && cv >= t) ||
        (c === "eq" && cv === t);
      if (hit) {
        patch.status = "triggered";
        patch.last_triggered_at = now;
        patch.trigger_count = (alert.trigger_count ?? 0) + 1;
      }
    }
    if (alert.type === "custom_reminder" && alert.due_at && new Date(alert.due_at) <= new Date()) {
      patch.status = "triggered";
      patch.last_triggered_at = now;
      patch.trigger_count = (alert.trigger_count ?? 0) + 1;
    }

    const { error: e2 } = await context.supabase
      .from("alerts").update(patch as never).eq("id", data.id).eq("user_id", context.userId);
    if (e2) throw new Error(e2.message);
    return { ok: true, triggered: patch.status === "triggered" };
  });
