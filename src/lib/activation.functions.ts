import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(16) });
const completeSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
});

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const validateActivationToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token_hash = hash(data.token);
    const { data: row } = await supabaseAdmin
      .from("activation_tokens")
      .select("id,user_id,expires_at,used_at")
      .eq("token_hash", token_hash)
      .maybeSingle();

    if (!row) return { status: "invalid" as const };
    if (row.used_at) return { status: "used" as const };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { status: "expired" as const };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email,full_name,first_access")
      .eq("id", row.user_id)
      .maybeSingle();

    if (!profile) return { status: "invalid" as const };
    if (!profile.first_access) return { status: "already_activated" as const };

    return {
      status: "valid" as const,
      email: profile.email,
      full_name: profile.full_name,
    };
  });

export const completeActivation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => completeSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token_hash = hash(data.token);

    const { data: row } = await supabaseAdmin
      .from("activation_tokens")
      .select("id,user_id,expires_at,used_at")
      .eq("token_hash", token_hash)
      .maybeSingle();

    if (!row) throw new Error("Token inválido");
    if (row.used_at) throw new Error("Token já utilizado");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("Token expirado");

    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      password: data.password,
    });
    if (pwErr) throw new Error(pwErr.message);

    await supabaseAdmin
      .from("activation_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    await supabaseAdmin
      .from("profiles")
      .update({ first_access: false })
      .eq("id", row.user_id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", row.user_id)
      .maybeSingle();

    return { email: profile?.email ?? "" };
  });

export const resendActivation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { randomBytes } = await import("crypto");
    const token_hash = hash(data.token);

    const { data: row } = await supabaseAdmin
      .from("activation_tokens")
      .select("user_id")
      .eq("token_hash", token_hash)
      .maybeSingle();

    if (!row) throw new Error("Token inválido");

    await supabaseAdmin
      .from("activation_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", row.user_id)
      .is("used_at", null);

    const newToken = randomBytes(32).toString("hex");
    const newHash = createHash("sha256").update(newToken).digest("hex");
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from("activation_tokens").insert({
      user_id: row.user_id,
      token_hash: newHash,
      expires_at: expires,
    });

    await supabaseAdmin.from("webhook_logs").insert({
      provider: "cakto",
      event_type: "resend_activation",
      status: "processed",
      message: `Novo link: /ativar?token=${newToken}`,
    });

    return { ok: true };
  });
