import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const LABELS: Record<string, { title: string; desc: string }> = {
  catalogo: { title: "Catálogo", desc: "Biblioteca curada de produtos vencedores para importação." },
  favoritos: { title: "Favoritos", desc: "Seus produtos salvos e ideias marcadas para depois." },
  fornecedores: { title: "Fornecedores", desc: "Diretório verificado de fábricas e trading companies." },
  rastreio: { title: "Rastreio de Encomenda", desc: "Acompanhamento ao vivo integrado com Correios e transportadoras." },
  documentos: { title: "Documentos", desc: "DI, invoice, packing list e contratos organizados." },
  tendencias: { title: "Produtos em Alta", desc: "Radar de itens em ascensão nos principais marketplaces." },
  nichos: { title: "Nichos Quentes", desc: "Segmentos com maior crescimento e menor concorrência." },
  concorrentes: { title: "Concorrentes", desc: "Monitoramento de preços, catálogo e anúncios da concorrência." },
  alertas: { title: "Alertas", desc: "Notificações de câmbio, promoções e mudanças em fornecedores." },
};

function ComingSoon({ slug }: { slug: string }) {
  const meta = LABELS[slug] ?? { title: "Em breve", desc: "Este módulo está em desenvolvimento." };
  return (
    <DashboardShell breadcrumb={meta.title} title={meta.title}>
      <section className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-12 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Em desenvolvimento</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{meta.desc}</p>
        <p className="mt-4 text-xs text-muted-foreground">Este módulo será liberado numa próxima atualização. Enquanto isso, use os módulos já ativos no menu ao lado.</p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-primary/40">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
        </Link>
      </section>
    </DashboardShell>
  );
}

// Factory to reduce duplication across placeholder routes.
function makeRoute(path: `/_authenticated/dashboard/${string}`, slug: string) {
  return createFileRoute(path)({
    head: () => ({ meta: [{ title: `${LABELS[slug]?.title ?? "Em breve"} · ImportPro` }, { name: "robots", content: "noindex,nofollow" }] }),
    component: () => <ComingSoon slug={slug} />,
  });
}

export const Route = createFileRoute("/_authenticated/dashboard/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="catalogo" />,
});
