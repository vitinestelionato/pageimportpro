import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Package } from "lucide-react";

type Crumb = { label: string; to?: string };

export function PageLayout({
  eyebrow,
  title,
  description,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[520px] rounded-full bg-brand-glow/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-glow text-primary-foreground shadow-lg shadow-brand/30">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-semibold tracking-tight">ImportPro</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-14 sm:px-6 sm:pt-20">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {c.to ? (
                  <Link to={c.to} className="transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground/80">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span className="text-muted-foreground/50">/</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-brand-glow">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {children}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} ImportPro · Todos os direitos reservados</div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacidade" className="transition-colors hover:text-foreground">Privacidade</Link>
            <Link to="/termos" className="transition-colors hover:text-foreground">Termos</Link>
            <Link to="/reembolso" className="transition-colors hover:text-foreground">Reembolso</Link>
            <Link to="/contato" className="transition-colors hover:text-foreground">Contato</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:text-muted-foreground [&_strong]:text-foreground [&_a]:text-brand-glow [&_a]:underline-offset-2 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-muted-foreground">
      {children}
    </div>
  );
}
