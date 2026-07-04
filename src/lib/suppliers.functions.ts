import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  platform: z.string().max(60).nullish(),
  country: z.string().max(60).nullish(),
  url: z.string().url().max(500).nullish().or(z.literal("")),
  contact_name: z.string().max(120).nullish(),
  whatsapp: z.string().max(40).nullish(),
  email: z.string().email().max(160).nullish().or(z.literal("")),
  wechat: z.string().max(60).nullish(),
  category: z.string().max(80).nullish(),
  min_order: z.number().nonnegative().nullish(),
  lead_time_days: z.number().int().nonnegative().nullish(),
  rating: z.number().int().min(0).max(5).default(0),
  favorite: z.boolean().default(false),
  status: z.enum(["ativo", "avaliando", "pausado"]).default("ativo"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  notes: z.string().max(4000).nullish(),
});

function clean<T extends Record<string, unknown>>(v: T) {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) out[k] = val === "" ? null : val;
  return out;
}

export const listSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("suppliers")
      .select("*")
      .order("favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const payload = { ...clean(data), user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase
        .from("suppliers")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("suppliers")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("suppliers")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleSupplierFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), favorite: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("suppliers")
      .update({ favorite: data.favorite })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
