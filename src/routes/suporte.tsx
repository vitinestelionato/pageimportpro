import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { LifeBuoy, MessageCircle, Bot, BookOpen, Mail } from "lucide-react";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte · ImportPro" },
      { name: "description", content: "Central de suporte da ImportPro: dúvidas frequentes, atendimento humano, IA especialista 24/7 e canais de contato." },
      { property: "og:title", content: "Suporte · ImportPro" },
      { property: "og:description", content: "Suporte humano em horário comercial e IA especialista 24/7 para clientes ativos." },
    ],
  }),
  component: SuportePage,
});

const CARDS = [
  {
    icon: Bot,
    title: "IA especialista 24/7",
    desc: "Dentro da plataforma, tire dúvidas sobre fornecedor, cálculo, alfândega e negociação a qualquer hora.",
    action: "Disponível no painel após login",
  },
  {
    icon: MessageCircle,
    title: "Chat humano",
    desc: "Nosso time responde no chat do painel em horário comercial, de segunda a sexta, das 9h às 18h.",
    action: "Direto do seu painel",
  },
  {
    icon: Mail,
    title: "E-mail de suporte",
    desc: "Para questões financeiras, acesso, nota fiscal ou solicitação de reembolso dentro do prazo.",
    action: "suporte@importpro.com.br",
    href: "mailto:suporte@importpro.com.br",
  },
  {
    icon: BookOpen,
    title: "Central de ajuda",
    desc: "Guias passo a passo sobre calculadora, gestão de pedidos, radar de produtos e integrações.",
    action: "Em breve",
  },
];

const FAQ = [
  { q: "Perdi acesso ao meu e-mail, como recupero a conta?", a: "Envie um e-mail para suporte@importpro.com.br informando nome completo e CPF usados na compra. Validamos e devolvemos o acesso em até 1 dia útil." },
  { q: "Onde encontro minha nota fiscal?", a: "A nota é emitida automaticamente após a confirmação do pagamento e enviada para o e-mail cadastrado. Se não recebeu, escreva para o suporte." },
  { q: "Como solicito reembolso?", a: "Você tem 7 dias de garantia incondicional a partir da compra. Basta pedir por e-mail dentro do prazo — devolvemos 100% do valor." },
  { q: "Existe app mobile?", a: "A plataforma é totalmente responsiva e funciona bem no navegador do celular. Um app nativo está no roadmap para 2026." },
];

function SuportePage() {
  return (
    <PageLayout
      eyebrow="Central de suporte"
      title="Estamos aqui para ajudar"
      description="Escolha o canal certo para o seu caso. Clientes ativos têm IA especialista disponível 24/7 direto no painel."
      crumbs={[{ label: "Início", to: "/" }, { label: "Suporte" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => {
          const inner = (
            <>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-primary-foreground shadow-lg shadow-brand/30">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="font-display text-base font-semibold text-foreground">{c.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-4 text-sm font-medium text-brand-glow">{c.action}</div>
            </>
          );
          return c.href ? (
            <a
              key={c.title}
              href={c.href}
              className="group flex flex-col rounded-2xl border border-border/60 bg-background/40 p-6 transition-all hover:-translate-y-0.5 hover:border-brand/50"
            >
              {inner}
            </a>
          ) : (
            <div
              key={c.title}
              className="flex flex-col rounded-2xl border border-border/60 bg-background/40 p-6"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-14">
        <div className="mb-5 flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-brand-glow" />
          <h2 className="font-display text-xl font-semibold text-foreground">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <div className="font-medium text-foreground">{f.q}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Não encontrou o que precisava?{" "}
          <Link to="/contato" className="text-brand-glow underline-offset-2 hover:underline">
            Fale com a gente
          </Link>
          .
        </p>
      </div>
    </PageLayout>
  );
}
