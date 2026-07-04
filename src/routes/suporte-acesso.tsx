import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Loader2, LifeBuoy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImportProLogo } from "@/components/ImportProLogo";
import { submitAccessSupportRequest } from "@/lib/support-request.functions";

const CAKTO_PURCHASE_URL = "https://pay.cakto.com.br/himftma";

export const Route = createFileRoute("/suporte-acesso")({
  head: () => ({
    meta: [
      { title: "Suporte de acesso · ImportPro" },
      {
        name: "description",
        content:
          "Não consegue acessar sua conta ImportPro? Envie os dados da sua compra Cakto para nosso time liberar seu acesso.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const submit = useServerFn(submitAccessSupportRequest);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [caktoOrderId, setCaktoOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast.error("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await submit({
        data: {
          email: email.trim(),
          name: name.trim(),
          caktoOrderId: caktoOrderId.trim(),
          message: message.trim(),
        },
      });
      if (!res.ok) {
        toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
        return;
      }
      setSent(true);
      toast.success("Recebemos seu pedido — respondemos em até 1 dia útil.");
    } catch (err) {
      toast.error((err as Error).message ?? "Falha ao enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-[oklch(0.55_0.22_255)]/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ImportProLogo className="h-8 w-8" />
            <span className="font-display text-lg font-bold">ImportPro</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Suporte de acesso</h1>
            <p className="text-sm text-muted-foreground">
              Não conseguiu entrar? Envie os dados da compra e nosso time libera sua conta.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur">
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h2 className="mt-4 font-display text-xl font-semibold">Pedido enviado!</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Recebemos seus dados e respondemos no e-mail informado em até{" "}
                <span className="font-semibold text-foreground">1 dia útil</span>.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="E-mail usado na compra *">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field label="Seu nome">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como devemos te chamar"
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field
                label="ID do pedido Cakto"
                hint="Está no e-mail de confirmação da Cakto (opcional, mas acelera muito)."
              >
                <input
                  type="text"
                  value={caktoOrderId}
                  onChange={(e) => setCaktoOrderId(e.target.value)}
                  placeholder="Ex.: cak_abc123..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field label="Descreva o problema *">
                <textarea
                  required
                  minLength={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Ex.: comprei ontem, recebi o e-mail da Cakto, mas ao tentar entrar aparece 'conta não encontrada'."
                  className="w-full rounded-xl border border-white/10 bg-background/60 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-base font-semibold text-white hover:opacity-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar para o suporte"}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                Ainda não comprou?{" "}
                <a
                  href={CAKTO_PURCHASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Garantir acesso na Cakto <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
