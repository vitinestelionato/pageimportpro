import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "importpro:cookie-consent:v1";

type Choice = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (choice: Choice) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:right-5 md:right-auto md:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/85 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-glow/10"
        />
        <div className="relative flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-glow text-primary-foreground shadow-lg shadow-brand/30">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                A gente usa cookies
              </h2>
              <button
                type="button"
                onClick={() => persist("essential")}
                aria-label="Fechar aviso de cookies"
                className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência, medir desempenho
              e personalizar conteúdo. Você controla o que aceita, conforme a{" "}
              <span className="text-foreground/90">LGPD</span>. Veja nossa{" "}
              <a
                href="/privacidade"
                className="font-medium text-brand-glow underline-offset-2 hover:underline"
              >
                Política de Privacidade
              </a>
              .
            </p>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => persist("essential")}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border/70 bg-background/60 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Apenas essenciais
              </button>
              <button
                type="button"
                onClick={() => persist("accepted")}
                className="group inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-glow px-4 text-xs font-semibold text-primary-foreground shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 hover:-translate-y-0.5 sm:flex-none"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
