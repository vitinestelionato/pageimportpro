import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual, randomBytes, createHash } from "crypto";

type CaktoPayload = {
  event?: string;
  status?: string;
  data?: {
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      document?: string;
    };
    product?: { id?: string; name?: string; short_id?: string };
    offer?: { id?: string; name?: string };
    id?: string;
    ref?: string;
    amount?: number;
    status?: string;
  };
  customer?: { name?: string; email?: string; phone?: string };
  product?: { id?: string; name?: string };
  [k: string]: unknown;
};

const APPROVED_EVENTS = new Set([
  "purchase_approved",
  "purchase_completed",
  "payment_approved",
  "order_paid",
  "paid",
  "approved",
]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const provided = header.replace(/^sha256=/i, "").trim();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/cakto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature =
          request.headers.get("x-cakto-signature") ??
          request.headers.get("x-signature") ??
          request.headers.get("x-webhook-signature");

        const secret = process.env.CAKTO_WEBHOOK_SECRET;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Optional signature verification (skipped if secret not configured yet, to allow setup)
        if (secret && !verifySignature(rawBody, signature, secret)) {
          await supabaseAdmin.from("webhook_logs").insert({
            provider: "cakto",
            status: "invalid_signature",
            message: "Assinatura inválida",
            payload: safeParse(rawBody),
          });
          return json(401, { error: "invalid signature" });
        }

        const payload = safeParse(rawBody) as CaktoPayload;
        const event = String(payload.event ?? payload.status ?? "").toLowerCase();
        const paymentStatus = String(
          payload.status ?? payload.data?.status ?? "",
        ).toLowerCase();
        const isApproved =
          APPROVED_EVENTS.has(event) ||
          APPROVED_EVENTS.has(paymentStatus) ||
          paymentStatus === "paid" ||
          paymentStatus === "approved";

        const customer =
          payload.data?.customer ?? payload.customer ?? ({} as NonNullable<CaktoPayload["customer"]>);
        const email = (customer.email ?? "").trim().toLowerCase();
        const name = customer.name ?? null;
        const phone = customer.phone ?? null;
        const productName =
          payload.data?.product?.name ?? payload.product?.name ?? payload.data?.offer?.name ?? null;
        const externalId =
          payload.data?.id ?? payload.data?.ref ?? (payload as { id?: string }).id ?? null;

        if (!isApproved) {
          await supabaseAdmin.from("webhook_logs").insert({
            provider: "cakto",
            event_type: event || paymentStatus || "unknown",
            external_id: externalId,
            status: "ignored",
            message: "Evento não é de pagamento aprovado",
            payload,
          });
          return json(200, { ok: true, ignored: true });
        }

        if (!email) {
          await supabaseAdmin.from("webhook_logs").insert({
            provider: "cakto",
            event_type: event,
            external_id: externalId,
            status: "error",
            message: "E-mail do cliente ausente",
            payload,
          });
          return json(400, { error: "missing customer email" });
        }

        // Deduplicate by external_id
        if (externalId) {
          const { data: existingLog } = await supabaseAdmin
            .from("webhook_logs")
            .select("id")
            .eq("provider", "cakto")
            .eq("external_id", externalId)
            .eq("status", "processed")
            .maybeSingle();
          if (existingLog) {
            return json(200, { ok: true, duplicate: true });
          }
        }

        // Try to find existing user via profiles by email
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        const purchaseDate = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        let userId: string;
        let activationUrl: string | null = null;

        if (existingProfile) {
          userId = existingProfile.id;
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: productName,
              purchase_date: purchaseDate,
              subscription_expires_at: expiresAt,
              status: "active",
              full_name: name ?? undefined,
              phone: phone ?? undefined,
            })
            .eq("id", userId);
        } else {
          const created = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              phone,
              plan: productName,
              purchase_date: purchaseDate,
              provider: "cakto",
              first_access: true,
            },
          });
          if (created.error || !created.data.user) {
            await supabaseAdmin.from("webhook_logs").insert({
              provider: "cakto",
              event_type: event,
              external_id: externalId,
              status: "error",
              message: `Falha ao criar usuário: ${created.error?.message ?? "unknown"}`,
              payload,
            });
            return json(500, { error: "create user failed" });
          }
          userId = created.data.user.id;
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: productName,
              subscription_expires_at: expiresAt,
              purchase_date: purchaseDate,
            })
            .eq("id", userId);
        }

        // Generate activation token
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        // Invalidate previous unused tokens for this user
        await supabaseAdmin
          .from("activation_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("used_at", null);

        await supabaseAdmin.from("activation_tokens").insert({
          user_id: userId,
          token_hash: tokenHash,
          expires_at: tokenExpires,
        });

        const origin =
          request.headers.get("origin") ??
          `https://${request.headers.get("host") ?? "importpro.com.br"}`;
        activationUrl = `${origin}/ativar?token=${rawToken}`;

        await supabaseAdmin.from("webhook_logs").insert({
          provider: "cakto",
          event_type: event || "approved",
          external_id: externalId,
          status: "processed",
          message: `Ativação: ${activationUrl}`,
          payload,
        });

        return json(200, {
          ok: true,
          user_id: userId,
          activation_url: activationUrl,
        });
      },
    },
  },
});

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { _raw: raw };
  }
}
