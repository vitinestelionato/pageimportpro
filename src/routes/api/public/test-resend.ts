import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes } from "crypto";

export const Route = createFileRoute("/api/public/test-resend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const expected = `Bearer ${process.env.LOVABLE_API_KEY ?? ""}`;
        if (!process.env.LOVABLE_API_KEY || auth !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        const { email: rawEmail } = (await request.json().catch(() => ({}))) as { email?: string };
        const email = (rawEmail ?? "").trim().toLowerCase();
        if (!email) return new Response("email required", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, plan")
          .eq("email", email)
          .maybeSingle();
        if (!profile) return new Response("profile not found", { status: 404 });

        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from("activation_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("user_id", profile.id)
          .is("used_at", null);

        await supabaseAdmin.from("activation_tokens").insert({
          user_id: profile.id,
          token_hash: tokenHash,
          expires_at: tokenExpires,
        });

        const hostHeader = request.headers.get("host") ?? "";
        const isLocalHost = /^(localhost|127\.0\.0\.1)/i.test(hostHeader);
        const origin =
          process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ??
          (!isLocalHost && hostHeader ? `https://${hostHeader}` : "https://importpro.com.br");
        const activationUrl = `${origin}/ativar?token=${rawToken}`;

        const { sendBrevoEmail, renderActivationEmail } = await import("@/lib/email.server");
        const { subject, html, text } = renderActivationEmail({
          name: profile.full_name,
          activationUrl,
          plan: profile.plan,
        });
        const result = await sendBrevoEmail({
          to: email,
          toName: profile.full_name,
          subject,
          html,
          text,
        });

        await supabaseAdmin.from("webhook_logs").insert({
          provider: "cakto",
          event_type: "resend",
          status: result.ok ? "processed" : "error",
          message: `Reenvio manual (${result.ok ? "sent" : `failed:${result.status}`})${result.error ? ` | ${result.error}` : ""} | ${activationUrl}`,
          payload: { email, resend: true } as any,
        });

        return new Response(
          JSON.stringify({ ok: result.ok, status: result.status, activationUrl, error: result.error }),
          { status: result.ok ? 200 : 500, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
