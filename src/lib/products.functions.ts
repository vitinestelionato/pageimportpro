import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CURRENCIES = ["USD", "EUR", "CNY", "BRL"] as const;
const STATUSES = ["analise", "importado", "arquivado"] as const;

const productInput = z.object({
  name: z.string().min(1).max(200),
  supplier_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  origin_price: z.number().nonnegative().default(0),
  origin_currency: z.enum(CURRENCIES).default("USD"),
  weight_kg: z.number().nonnegative().default(0),
  category: z.string().max(80).optional().nullable().or(z.literal("")),
  image_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  status: z.enum(STATUSES).default("analise"),
  notes: z.string().max(2000).optional().nullable().or(z.literal("")),
});

const normalize = (p: z.infer<typeof productInput>) => ({
  ...p,
  supplier_url: p.supplier_url || null,
  category: p.category || null,
  image_url: p.image_url || null,
  notes: p.notes || null,
});

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const productStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("status")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      total: rows.length,
      analise: rows.filter((r) => r.status === "analise").length,
      importado: rows.filter((r) => r.status === "importado").length,
      arquivado: rows.filter((r) => r.status === "arquivado").length,
    };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("products")
      .insert({ ...normalize(data), user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), patch: productInput.partial() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch = { ...data.patch };
    // Normalize empty strings to nulls where relevant
    for (const k of ["supplier_url", "category", "image_url", "notes"] as const) {
      if (patch[k] === "") (patch as Record<string, unknown>)[k] = null;
    }
    const { data: row, error } = await context.supabase
      .from("products")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
