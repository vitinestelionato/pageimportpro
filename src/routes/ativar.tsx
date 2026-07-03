import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  validateActivationToken,
  completeActivation,
  resendActivation,
} from "@/lib/activation.functions";
import { ImportProLogo, ImportProWordmark } from "@/components/ImportProLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ativar")({
  head: () => ({
    meta: [
      { title: "Ativar conta · ImportPro" },
      { name: "description", content: "Defina sua senha e ative sua conta ImportPro." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AtivarPage,
  errorComponent: ({ error }) => (
    <ErrorShell title="Erro ao carregar" message={(error as Error).message} />
  ),
  notFoundComponent: () => <ErrorShell title="Não encontrado" message="Página inexistente." />,
});

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function AtivarPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const token = new URLSearchParams(search).get("token") ?? "";
  const navigate = useNavigate();
  const validate = useServerFn(validateActivationToken);
  const complete = useServerFn(completeActivation);
  const resend = useServerFn(resendActivation);

  const query = useQuery({
    queryKey: ["activation", token],
    queryFn: () => validate({ data: { token } }),
    enabled: !!token,
    retry: false,
  });

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const strength = useMemo(() => passwordStrength(pw), [pw]);

  if (!token) return <ErrorShell title="Link inválido" message="Nenhum token fornecido." />;

  if (query.isLoading) return <LoadingShell />;

  const status = query.data?.status;

  if (status === "expired" || status === "used" || status === "invalid") {
    return (
      <ExpiredShell
        onResend={async () => {
          try {
            await resend({ data: { token } });
            toast.success("Novo link gerado. Verifique seu e-mail.");
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    );
  }

  if (status === "already_activated") {
    navigate({ to: "/login", replace: true });
    return null;
  }

  const canSubmit =
    strength >= 4 && pw === pw2 && pw.length >= 8 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { email } = await complete({ data: { token, password: pw } });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      if (error) throw error;
      toast.success("Conta ativada!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Falha ao ativar");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BgGlow />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-8 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <ImportProLogo className="h-14 w-14" />
            <div className="mt-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h1 className="text-xl font-semibold">Bem-vindo à ImportPro</h1>
            </div>
            <p className="text-center text-sm text-primary/90">
              Sua conta foi criada com sucesso após a compra.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-primary" />
              Crie sua senha de acesso
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Esta senha será utilizada para acessar sua conta sempre que desejar.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-background/60 px-4 py-3 pr-16 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary"
                >
                  {showPw ? "ocultar" : "mostrar"}
                </button>
              </div>

              <StrengthMeter score={strength} />

              <input
                type={showPw ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Confirmar senha"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
              {pw2 && pw !== pw2 && (
                <p className="text-xs text-destructive">As senhas não conferem.</p>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 h-12 w-full bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.6)] hover:opacity-95"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Criar senha e ativar o sistema"
                )}
              </Button>

              <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                A senha é obrigatória para continuar e serve para fazer login depois.
              </p>
            </form>
          </div>

          <div className="mt-6 flex justify-center opacity-70">
            <ImportProWordmark />
          </div>
        </div>
      </div>
    </div>
  );
}

function StrengthMeter({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const color =
    score >= 4
      ? "bg-emerald-500"
      : score >= 3
      ? "bg-primary"
      : score >= 2
      ? "bg-amber-500"
      : "bg-destructive";
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`${color} h-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>mín. 8, maiúscula, minúscula, número</span>
        <span>
          {score < 3 ? "Fraca" : score < 4 ? "Boa" : score < 5 ? "Forte" : "Excelente"}
        </span>
      </div>
    </div>
  );
}

function BgGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[oklch(0.55_0.22_255)]/20 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ExpiredShell({ onResend }: { onResend: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BgGlow />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Link expirado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu link de ativação expirou ou já foi utilizado.
          </p>
          <Button onClick={onResend} className="mt-6 w-full">
            Enviar novo link
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorShell({ title, message }: { title: string; message: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BgGlow />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-8 text-center backdrop-blur-xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
