// Server-only helper to send emails via Brevo through the Lovable connector gateway.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

export type SendEmailInput = {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text?: string;
};

export async function sendBrevoEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  messageId?: string;
  status: number;
  error?: string;
}> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "ImportPro";

  if (!lovableKey) return { ok: false, status: 500, error: "LOVABLE_API_KEY missing" };
  if (!brevoKey) return { ok: false, status: 500, error: "BREVO_API_KEY missing" };
  if (!senderEmail) return { ok: false, status: 500, error: "BREVO_SENDER_EMAIL missing" };

  const resp = await fetch(`${GATEWAY_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": brevoKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: input.to, name: input.toName ?? undefined }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
  });

  const body = await resp.text();
  if (!resp.ok) {
    return { ok: false, status: resp.status, error: body.slice(0, 500) };
  }
  try {
    const parsed = JSON.parse(body) as { messageId?: string };
    return { ok: true, status: resp.status, messageId: parsed.messageId };
  } catch {
    return { ok: true, status: resp.status };
  }
}

export function renderActivationEmail(params: {
  name?: string | null;
  activationUrl: string;
  plan?: string | null;
}): { subject: string; html: string; text: string } {
  const firstName = (params.name ?? "").split(" ")[0] || "cliente";
  const subject = "Ative sua conta ImportPro 🚀";
  const plan = params.plan ? `<p style="margin:0 0 16px;color:#475569;font-size:14px;">Plano adquirido: <strong>${escapeHtml(params.plan)}</strong></p>` : "";
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ative sua conta</title></head>
<body style="margin:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.06);overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">Import<span style="color:#2563eb;">Pro</span></div>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#0f172a;">Olá, ${escapeHtml(firstName)}! Sua compra foi aprovada 🎉</h1>
          <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">
            Bem-vindo(a) à ImportPro. Para acessar sua conta, defina sua senha clicando no botão abaixo.
          </p>
          ${plan}
        </td></tr>
        <tr><td style="padding:8px 32px 24px;" align="left">
          <a href="${params.activationUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px;font-size:15px;">Ativar minha conta</a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style="margin:0 0 8px;word-break:break-all;"><a href="${params.activationUrl}" style="color:#2563eb;font-size:13px;">${params.activationUrl}</a></p>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Este link expira em 48 horas. Se você não fez esta compra, ignore este e-mail.</p>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} ImportPro. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `Olá, ${firstName}!\n\nSua compra na ImportPro foi aprovada.\nAtive sua conta definindo sua senha: ${params.activationUrl}\n\nEste link expira em 48 horas.`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
