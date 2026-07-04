import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public support request from the blocked-login flow.
 * Sends an email to the support inbox with the buyer's details so the team
 * can look up the Cakto order and unlock the account.
 */
export const submitAccessSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email().max(254),
        name: z.string().trim().max(120).optional().default(""),
        caktoOrderId: z.string().trim().max(120).optional().default(""),
        message: z.string().trim().min(10).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { sendBrevoEmail } = await import("@/lib/email.server");
    const supportInbox =
      process.env.SUPPORT_INBOX_EMAIL ||
      process.env.BREVO_SENDER_EMAIL ||
      "";

    if (!supportInbox) {
      return { ok: false as const, error: "support_inbox_missing" };
    }

    const esc = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
      );

    const subject = `[Suporte de acesso] ${data.email}`;
    const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
      <h2 style="margin:0 0 12px;">Novo pedido de suporte de acesso</h2>
      <p style="margin:0 0 8px;"><strong>E-mail da compra:</strong> ${esc(data.email)}</p>
      <p style="margin:0 0 8px;"><strong>Nome:</strong> ${esc(data.name || "—")}</p>
      <p style="margin:0 0 8px;"><strong>ID do pedido Cakto:</strong> ${esc(data.caktoOrderId || "—")}</p>
      <p style="margin:16px 0 8px;"><strong>Mensagem:</strong></p>
      <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">${esc(data.message)}</pre>
    </body></html>`;
    const text = `Novo pedido de suporte de acesso
E-mail: ${data.email}
Nome: ${data.name || "—"}
Cakto Order ID: ${data.caktoOrderId || "—"}

Mensagem:
${data.message}`;

    const result = await sendBrevoEmail({
      to: supportInbox,
      subject,
      html,
      text,
    });

    if (!result.ok) {
      console.error("[support-request] brevo error", result);
      return { ok: false as const, error: "send_failed" };
    }

    return { ok: true as const };
  });
