import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, TrendingUp, ArrowRight, Globe, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportProLogo, ImportProWordmark } from "@/components/ImportProLogo";
import { Button } from "@/components/ui/button";
import { checkLoginEligibility } from "@/lib/login-eligibility.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · ImportPro" },
      { name: "description", content: "Acesse sua conta ImportPro." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

type BlockReason = "not_purchased" | "inactive" | "unknown";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [blocked, setBlocked] = useState<BlockReason | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlocked(null);
    setLoading(true);
    try {
      // 1) Pre-check: block anyone without a Cakto-created profile.
      const check = await checkLoginEligibility({ data: { email: email.trim() } });
      if (!check.eligible) {
        setBlocked(check.reason ?? "unknown");
        return;
      }

      // 2) Regular sign in.
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (error) throw error;
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[560px] w-[560px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[oklch(0.55_0.22_255)]/15 blur-[140px]" />
      </div>

      <div className="absolute right-6 top-6 z-20">
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-xs backdrop-blur-md">
          <Globe className="h-3.5 w-3.5" /> BR PT
        </button>
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT — brand storytelling */}
        <div className="hidden flex-col justify-center px-12 lg:flex">
          <ImportProWordmark className="mb-10" />
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight">
            A plataforma completa para{" "}
            <span className="bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] bg-clip-text text-transparent">
              importadores no Brasil
            </span>
          </h1>

          <div className="mt-10 space-y-4">
            <FeatureRow
              icon={<TrendingUp className="h-4 w-4" />}
              title="Produtos em alta"
              subtitle="Descubra o que está bombando no mercado agora"
            />
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </div>

          <div className="mt-10 inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
            ⚡ Usado por milhares de importadores brasileiros
          </div>
        </div>

        {/* RIGHT — auth form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <ImportProLogo className="h-14 w-14" />
              <h2 className="mt-4 font-display text-3xl font-bold">Entre na sua conta</h2>
              <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta.</p>
            </div>

            <div className="mt-8">
              {blocked && (
                <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-200">
                        {blocked === "not_purchased" && "Não encontramos uma conta com esse e-mail."}
                        {blocked === "inactive" && "Sua conta está inativa."}
                        {blocked === "unknown" && "Não foi possível validar seu acesso agora."}
                      </p>
                      <p className="text-xs text-amber-100/80">
                        {blocked === "not_purchased" && (
                          <>
                            O acesso à ImportPro é liberado automaticamente após a compra na Cakto.
                            Verifique se você usou o mesmo e-mail da compra ou{" "}
                            <Link to="/" className="underline">garanta seu acesso</Link>.
                          </>
                        )}
                        {blocked === "inactive" && (
                          <>Fale com o suporte para reativar sua assinatura.</>
                        )}
                        {blocked === "unknown" && (
                          <>Tente novamente em instantes. Se persistir, contate o suporte.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-12 w-full rounded-xl border border-white/10 bg-background/60 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-white/10 bg-background/60 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-background"
                    />
                    Lembrar meu acesso
                  </label>
                  <button type="button" className="font-medium text-primary hover:underline">
                    Esqueci minha senha
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.6)] hover:opacity-95"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Entrar <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link to="/" className="font-medium text-primary hover:underline">
                  Garantir acesso
                </Link>
              </p>

              <p className="mt-6 text-center text-[11px] text-muted-foreground">
                Ao continuar você concorda com nossos{" "}
                <Link to="/termos" className="underline">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link to="/privacidade" className="underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-10 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} ImportPro. Todos os direitos reservados.
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.44-1.7 4.22-5.5 4.22-3.31 0-6-2.74-6-6.12s2.69-6.12 6-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.55 14.66 2.55 12 2.55 6.98 2.55 2.9 6.62 2.9 12s4.08 9.45 9.1 9.45c5.26 0 8.75-3.7 8.75-8.9 0-.6-.07-1.06-.16-1.5H12z"
      />
    </svg>
  );
}
