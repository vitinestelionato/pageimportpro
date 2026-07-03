import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { ArrowRight, Clock } from "lucide-react";

export const POSTS = [
  {
    slug: "como-importar-da-china-2026",
    title: "Como importar da China em 2026: guia atualizado para iniciantes",
    excerpt: "Passo a passo real do que mudou nas regras da Receita, como escolher fornecedor e evitar as armadilhas mais comuns dos primeiros pedidos.",
    date: "12 de junho, 2026",
    read: "9 min",
    category: "Guia",
  },
  {
    slug: "calculo-impostos-importacao",
    title: "Cálculo de impostos na importação: II, ICMS e IPI descomplicados",
    excerpt: "Entenda de forma direta como cada imposto é aplicado, quando incide e como calcular o custo real desembarcado do seu produto.",
    date: "28 de maio, 2026",
    read: "7 min",
    category: "Tributário",
  },
  {
    slug: "produtos-lucrativos-china",
    title: "10 categorias de produtos mais lucrativos para importar em 2026",
    excerpt: "Baseado em dados reais de venda no Shopee, Mercado Livre e Shopify, os nichos com maior margem e menor concorrência agora.",
    date: "14 de maio, 2026",
    read: "6 min",
    category: "Radar",
  },
  {
    slug: "negociacao-fornecedor-1688",
    title: "Como negociar com fornecedor da 1688 sem falar mandarim",
    excerpt: "Scripts prontos, boas práticas, o que pedir de amostra, como validar fábrica e quando desconfiar de preços bons demais.",
    date: "02 de maio, 2026",
    read: "8 min",
    category: "Fornecedores",
  },
  {
    slug: "frete-china-brasil",
    title: "Frete China–Brasil: qual modal escolher para cada tipo de pedido",
    excerpt: "Comparativo entre Correios, Packet, DHL, FedEx e frete marítimo consolidado. Custo, prazo, risco e quando cada um faz sentido.",
    date: "18 de abril, 2026",
    read: "10 min",
    category: "Logística",
  },
  {
    slug: "alfandega-taxada-o-que-fazer",
    title: "Encomenda taxada na alfândega? O que fazer passo a passo",
    excerpt: "Como consultar, quando contestar, prazos oficiais e o que faz a Receita liberar mais rápido ou reter por mais tempo.",
    date: "05 de abril, 2026",
    read: "5 min",
    category: "Alfândega",
  },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog · ImportPro" },
      { name: "description", content: "Conteúdo prático sobre importação da China: fornecedores, impostos, logística, produtos lucrativos e alfândega." },
      { property: "og:title", content: "Blog · ImportPro" },
      { property: "og:description", content: "Guias, análises e boas práticas para importar da China com previsibilidade." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageLayout
      eyebrow="Blog"
      title="Aprenda a importar do jeito certo"
      description="Guias práticos, análises de mercado e atualizações regulatórias escritas por quem realmente importa da China."
      crumbs={[{ label: "Início", to: "/" }, { label: "Blog" }]}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {POSTS.map((p) => (
          <Link
            key={p.slug}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group flex flex-col rounded-2xl border border-border/60 bg-background/40 p-6 transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:bg-background/60"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-glow">
                {p.category}
              </span>
              <span>{p.date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {p.read}
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold text-foreground group-hover:text-brand-glow">
              {p.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-glow">
              Ler artigo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
