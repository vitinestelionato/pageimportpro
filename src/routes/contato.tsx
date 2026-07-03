import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { Mail, MessageCircle, Instagram, Clock } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato · ImportPro" },
      { name: "description", content: "Fale com o time da ImportPro. Suporte por e-mail, WhatsApp e redes sociais em horário comercial." },
      { property: "og:title", content: "Contato · ImportPro" },
      { property: "og:description", content: "Estamos aqui para ajudar. Contato humano por e-mail e WhatsApp." },
    ],
  }),
  component: ContatoPage,
});

const CHANNELS = [
  {
    icon: Mail,
    title: "E-mail",
    desc: "Para dúvidas comerciais, parcerias e imprensa. Respondemos em até 1 dia útil.",
    value: "contato@importpro.com.br",
    href: "mailto:contato@importpro.com.br",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Atendimento comercial e suporte a clientes ativos em horário comercial.",
    value: "+55 (11) 4200-0000",
    href: "https://wa.me/551142000000",
  },
  {
    icon: Instagram,
    title: "Instagram",
    desc: "Novidades, cases de importadores e dicas rápidas no dia a dia.",
    value: "@importpro.oficial",
    href: "https://instagram.com/importpro.oficial",
  },
];

function ContatoPage() {
  return (
    <PageLayout
      eyebrow="Fale com a gente"
      title="Contato"
      description="Escolha o canal que preferir. Nosso time é humano e responde de verdade."
      crumbs={[{ label: "Início", to: "/" }, { label: "Contato" }]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group flex flex-col rounded-2xl border border-border/60 bg-background/40 p-6 transition-all hover:-translate-y-0.5 hover:border-brand/50"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-primary-foreground shadow-lg shadow-brand/30">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="font-display text-base font-semibold text-foreground">{c.title}</div>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.desc}</p>
            <div className="mt-4 text-sm font-medium text-brand-glow group-hover:underline">
              {c.value}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-background/40 p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-glow">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-semibold text-foreground">
              Horário de atendimento humano
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Segunda a sexta, das 9h às 18h (horário de Brasília). Fora desse horário, a IA
              especialista da plataforma continua disponível 24/7 para clientes ativos.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
        <div className="font-display text-base font-semibold text-foreground">Dados da empresa</div>
        <p className="mt-2">
          ImportPro Tecnologia Ltda. · CNPJ 00.000.000/0001-00<br />
          Av. Paulista, 1000 · Sala 1010 · São Paulo/SP · CEP 01310-100
        </p>
      </div>
    </PageLayout>
  );
}
