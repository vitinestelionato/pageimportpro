import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageLayout, Prose } from "@/components/PageLayout";
import { POSTS } from "./blog";
import { ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = POSTS.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Artigo não encontrado · ImportPro" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.post.title} · Blog ImportPro` },
        { name: "description", content: loaderData.post.excerpt },
        { property: "og:title", content: loaderData.post.title },
        { property: "og:description", content: loaderData.post.excerpt },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: PostPage,
});

function PostNotFound() {
  return (
    <PageLayout title="Artigo não encontrado" description="Esse post pode ter sido movido ou removido.">
      <Link to="/blog" className="text-brand-glow hover:underline">
        Voltar para o blog
      </Link>
    </PageLayout>
  );
}

function PostPage() {
  const { post } = Route.useLoaderData();
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <PageLayout
      eyebrow={post.category}
      title={post.title}
      description={post.excerpt}
      crumbs={[{ label: "Início", to: "/" }, { label: "Blog", to: "/blog" }, { label: post.title }]}
    >
      <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{post.date}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {post.read} de leitura
        </span>
      </div>

      <Prose>
        <p>
          Este é um conteúdo introdutório sobre <strong>{post.title.toLowerCase()}</strong>. Nos
          próximos parágrafos, entramos no detalhe prático — do zero ao primeiro resultado — usando
          exemplos reais de importadores da nossa comunidade.
        </p>

        <h2>Por que isso importa</h2>
        <p>
          A maioria dos importadores brasileiros perde dinheiro nos primeiros pedidos por três
          motivos: escolha errada de fornecedor, cálculo incompleto de custo desembarcado e falta de
          previsibilidade de prazo. Neste artigo, atacamos cada um desses pontos.
        </p>

        <h2>Passo a passo</h2>
        <ul>
          <li>Valide a demanda do produto no seu canal de venda antes de comprar.</li>
          <li>Simule custo desembarcado com II, ICMS, IPI, frete e taxa alfandegária.</li>
          <li>Peça amostra e valide fornecedor com histórico, tempo de mercado e avaliações.</li>
          <li>Negocie MOQ e prazo por escrito, sempre em inglês ou pela plataforma oficial.</li>
          <li>Acompanhe o pedido em tempo real e reserve capital para a taxação eventual.</li>
        </ul>

        <h2>Como a ImportPro ajuda</h2>
        <p>
          Todas as etapas acima já estão integradas dentro da plataforma: fornecedores verificados,
          calculadora automática, gestão de pedidos com rastreio e uma IA especialista disponível 24
          horas para tirar dúvidas específicas do seu caso.
        </p>
        <p>
          <Link to="/">Conheça a plataforma completa →</Link>
        </p>
      </Prose>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold text-foreground">Continue lendo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group rounded-xl border border-border/60 bg-background/40 p-4 transition-all hover:border-brand/50"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-glow">
                  {p.category}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-foreground group-hover:text-brand-glow">
                  {p.title}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-brand-glow">
                  Ler <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
