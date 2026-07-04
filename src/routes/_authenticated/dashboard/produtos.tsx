import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/produtos")({
  head: () => ({
    meta: [
      { title: "Gestão de Produtos · ImportPro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProdutosComingSoon,
});

function ProdutosComingSoon() {
  return (
    <DashboardShell breadcrumb="Gestão de Produtos" title="Gestão de Produtos">
      <section className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-12 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Em desenvolvimento</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          O módulo de Gestão de Produtos está sendo preparado. Enquanto isso, use a
          Análise de Anúncios em Ferramentas para diagnosticar anúncios reais.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-primary/40">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
          </Link>
          <Link to="/dashboard/analise-anuncios" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Ir para Análise de Anúncios
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
