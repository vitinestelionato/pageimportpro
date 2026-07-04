import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [items, favs] = await Promise.all([
      context.supabase
        .from("catalog_items")
        .select("*")
        .order("featured", { ascending: false })
        .order("rating", { ascending: false }),
      context.supabase
        .from("catalog_favorites")
        .select("item_id")
        .eq("user_id", context.userId),
    ]);
    if (items.error) throw new Error(items.error.message);
    if (favs.error) throw new Error(favs.error.message);
    const favSet = new Set((favs.data ?? []).map((f) => f.item_id));
    return (items.data ?? []).map((it) => ({ ...it, is_favorite: favSet.has(it.id) }));
  });

export const toggleCatalogFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ itemId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("catalog_favorites")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_id", data.itemId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("catalog_favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }
    const { error } = await context.supabase
      .from("catalog_favorites")
      .insert({ user_id: context.userId, item_id: data.itemId });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });

export const importCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ itemId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: item, error } = await context.supabase
      .from("catalog_items")
      .select("*")
      .eq("id", data.itemId)
      .single();
    if (error) throw new Error(error.message);

    const { data: row, error: insErr } = await context.supabase
      .from("products")
      .insert({
        user_id: context.userId,
        name: item.name,
        supplier_url: item.supplier_url,
        origin_price: item.origin_price,
        origin_currency: item.origin_currency,
        weight_kg: 0,
        category: item.category,
        image_url: item.image_url,
        status: "analise",
        notes: item.description,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return row;
  });
