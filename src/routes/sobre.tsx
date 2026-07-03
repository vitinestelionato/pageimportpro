import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, Prose } from "@/components/PageLayout";
import { Target, Users, Rocket, Shield } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre · ImportPro" },
      { name: "description", content: "Conheça a ImportPro, a plataforma completa para quem importa da China. Nossa missão, valores e o time por trás do produto." },
      { property: "og:title", content: "Sobre · ImportPro" },
      { property: "og:description", content: "A plataforma completa para importar da China com segurança, previsibilidade e lucro real." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <PageLayout
      eyebrow="Sobre nós"
      title="Descomplicamos a importação da China"
      description="Nascemos para tirar do papel o sonho de importadores iniciantes e profissionais que perdem dinheiro por falta de estrutura, dados confiáveis e ferramentas integradas."
      crumbs={[{ label: "Início", to: "/" }, { label: "Sobre" }]}
    >
      <Prose>
        <p>
          A <strong>ImportPro</strong> é uma plataforma brasileira criada por importadores para
          importadores. Reunimos em um único lugar tudo o que costuma estar espalhado em planilhas,
          grupos de WhatsApp, fóruns e vídeos soltos: fornecedores verificados, calculadora de
          impostos, precificação inteligente, gestão de pedidos, IA especialista e radar de produtos
          em alta.
        </p>
        <p>
          Acreditamos que importar da China não deveria ser uma aventura arriscada. Deveria ser um
          processo previsível, mensurável e lucrativo — e é isso que entregamos.
        </p>

        <h2>Nossa missão</h2>
        <p>
          Dar ao pequeno e médio empreendedor brasileiro as mesmas ferramentas que grandes
          importadores usam, por uma fração do custo, com uma experiência simples o suficiente para
          quem está começando hoje.
        </p>
      </Prose>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Target, title: "Foco em resultado", desc: "Cada ferramenta é medida por quanto reduz risco ou aumenta margem do usuário." },
          { icon: Users, title: "Comunidade real", desc: "Mais de 12 mil importadores compartilhando fornecedores, produtos e negociações." },
          { icon: Rocket, title: "Atualização contínua", desc: "Novos fornecedores, produtos em alta e regras alfandegárias atualizados semanalmente." },
          { icon: Shield, title: "Transparência total", desc: "Sem letra miúda. Pagamento único, garantia de 7 dias e suporte humano." },
        ].map((v) => (
          <div key={v.title} className="rounded-2xl border border-border/60 bg-background/40 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-primary-foreground shadow-lg shadow-brand/30">
              <v.icon className="h-5 w-5" />
            </div>
            <div className="font-display text-base font-semibold text-foreground">{v.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
