import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Package,
  Calculator,
  TrendingUp,
  Truck,
  Bot,
  Radar,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe2,
  Star,
  Users,
  MessagesSquare,
  Lightbulb,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityChat } from "@/components/CommunityChat";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  { icon: Package, title: "Fornecedores da China", desc: "Rede curada de fornecedores verificados, com histórico, avaliações e catálogo pronto para importar." },
  { icon: Calculator, title: "Calculadora de Impostos", desc: "Cálculo automático de II, ICMS, IPI e taxas alfandegárias. Sem planilha, sem erro." },
  { icon: TrendingUp, title: "Precificação Inteligente", desc: "Defina margem ideal em segundos e descubra o preço perfeito para revender com lucro real." },
  { icon: Truck, title: "Gestão de Pedidos", desc: "Acompanhe cada pedido internacional em tempo real, com rastreio integrado ponta a ponta." },
  { icon: Bot, title: "IA Especialista", desc: "Tire dúvidas de importação 24/7 com uma IA treinada em regulamentação, logística e negociação." },
  { icon: Radar, title: "Radar de Produtos em Alta", desc: "Descubra o que está bombando antes da concorrência com nosso radar de tendências." },
  { icon: Sparkles, title: "Viabilidade Inteligente", desc: "Calculadora que valida se o produto vale a pena antes de você investir um centavo." },
  { icon: ShieldCheck, title: "Segurança Total", desc: "Fornecedores auditados e critérios rigorosos para reduzir risco em toda operação." },
];

const testimonials = [
  { name: "Rafael M.", role: "Revendedor Shopee", text: "Em 3 meses tripliquei meu faturamento. A calculadora sozinha já paga a assinatura." },
  { name: "Camila S.", role: "E-commerce próprio", text: "Encontrei fornecedores que eu jamais acharia sozinha. O radar de tendências é ouro." },
  { name: "Bruno L.", role: "Dropshipper", text: "A IA de importação me economiza horas por dia. Parece ter um consultor 24/7." },
];

const stats = [
  { v: "12.4k+", l: "importadores ativos" },
  { v: "R$ 180M", l: "movimentados/ano" },
  { v: "3.200+", l: "fornecedores verificados" },
  { v: "4.9/5", l: "avaliação média" },
];

function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-glow shadow-lg shadow-brand/30">
              <Globe2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">ImportPro</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="transition-colors hover:text-foreground">Recursos</a>
            <a href="#como-funciona" className="transition-colors hover:text-foreground">Como funciona</a>
            <a href="#depoimentos" className="transition-colors hover:text-foreground">Depoimentos</a>
            <a href="#precos" className="transition-colors hover:text-foreground">Planos</a>
          </nav>
          <a href="#precos">
            <Button size="sm" className="rounded-full bg-gradient-to-r from-brand to-brand-glow text-primary-foreground shadow-lg shadow-brand/30 hover:opacity-90">
              Começar agora
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-24">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-[700px] bg-radial-glow" />
        <div className="absolute left-1/2 top-24 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl animate-pulse-glow" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Novo · IA especialista em importação disponível
          </div>

          <h1 className="animate-rise mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-gradient sm:text-6xl md:text-7xl" style={{ animationDelay: "80ms" }}>
            Importe da China<br />como um profissional.
          </h1>

          <p className="animate-rise mx-auto mt-6 max-w-2xl text-lg text-muted-foreground" style={{ animationDelay: "160ms" }}>
            A plataforma completa para revendedores: fornecedores verificados, cálculo automático de impostos, radar de tendências e uma IA que te acompanha em cada pedido.
          </p>

          <div className="animate-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <a href="#precos">
              <Button size="lg" className="group h-12 rounded-full bg-gradient-to-r from-brand to-brand-glow px-7 text-base font-semibold text-primary-foreground shadow-xl shadow-brand/30 transition-all hover:shadow-brand/50 hover:-translate-y-0.5">
                Quero acesso agora
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="#recursos">
              <Button size="lg" variant="outline" className="h-12 rounded-full border-border bg-transparent px-7 text-base font-medium hover:bg-accent">
                Ver recursos
              </Button>
            </a>
          </div>

          <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground" style={{ animationDelay: "320ms" }}>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> 7 dias de garantia</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> Sem fidelidade</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> Suporte humano</span>
          </div>

          {/* Dashboard mockup */}
          <div className="animate-rise mt-16" style={{ animationDelay: "400ms" }}>
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-brand/20 via-brand-glow/20 to-brand/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl glass glow-border p-2 shadow-2xl">
                <div className="rounded-xl bg-background/60 p-6">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-3 text-xs text-muted-foreground">app.importpro.com/dashboard</span>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { l: "Pedidos em trânsito", v: "24", d: "+12% esta semana" },
                      { l: "Margem média", v: "148%", d: "acima da meta" },
                      { l: "Tendências novas", v: "37", d: "nas últimas 24h" },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl border border-border bg-card/50 p-4 text-left transition-all hover:-translate-y-1 hover:border-brand/50">
                        <div className="text-xs text-muted-foreground">{s.l}</div>
                        <div className="mt-1 font-display text-2xl font-bold text-foreground">{s.v}</div>
                        <div className="mt-1 text-xs text-brand-glow">{s.d}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex h-32 items-end gap-2 rounded-xl border border-border bg-card/30 p-4">
                    {[40, 62, 55, 78, 65, 88, 72, 95, 82, 100, 90, 110].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-brand/40 to-brand-glow transition-all hover:from-brand hover:to-brand-glow"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-border/60 bg-card/30 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl font-bold text-gradient sm:text-4xl">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="relative py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-brand-glow">
              <Zap className="h-3 w-3" /> Tudo em um só lugar
            </div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              A operação completa <span className="text-gradient">de importação.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Chega de dez ferramentas soltas. Da descoberta do produto ao lucro na sua loja — em uma única plataforma.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/0 to-brand/0 opacity-0 transition-opacity duration-500 group-hover:from-brand/10 group-hover:to-transparent group-hover:opacity-100" />
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-glow/10 text-brand-glow ring-1 ring-brand/30 transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="relative py-28">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Como <span className="text-gradient">funciona</span>
            </h2>
            <p className="mt-4 text-muted-foreground">Três passos para começar a lucrar importando com inteligência.</p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Descubra", d: "Use o radar para achar produtos em alta e valide viabilidade em segundos." },
              { n: "02", t: "Importe", d: "Escolha o fornecedor verificado e a plataforma calcula tudo — impostos, frete, margem." },
              { n: "03", t: "Lucre", d: "Precificação inteligente e rastreio ponta a ponta. Foco no que importa: vender mais." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl glass p-8 transition-all hover:-translate-y-1">
                <div className="font-display text-6xl font-bold text-brand/30">{s.n}</div>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="comunidade" className="relative py-28">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand-glow">
              <span className="tracking-widest">•••</span>
              Comunidade
            </div>
            <h2 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Você não importa <span className="text-gradient">sozinho.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base text-muted-foreground">
              Networking de verdade com quem leva importação a sério. Troque fornecedores, acompanhe o que está bombando agora e evolua muito mais rápido.
            </p>
            <ul className="mt-10 space-y-6">
              {[
                { icon: Users, t: "Networking real", d: "Conecte-se com importadores que já faturam alto e troque estratégias que dão resultado." },
                { icon: MessagesSquare, t: "Troca de ideias ativa", d: "Tire dúvidas, compartilhe testes e aprenda com quem está na operação todos os dias." },
                { icon: Lightbulb, t: "Suas sugestões viram features", d: "A gente ouve a comunidade: ideias de melhoria entram no roadmap e são implementadas." },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-glow ring-1 ring-brand/30">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-foreground">{f.t}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a href="#precos" className="mt-10 inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 px-5 py-2.5 text-sm font-medium text-brand-glow transition-all hover:bg-brand/20 hover:-translate-y-0.5">
              <Lock className="h-4 w-4" />
              Acesso exclusivo para assinantes
            </a>
          </div>
          <div className="flex justify-center">
            <CommunityChat />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="relative py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Quem usa, <span className="text-gradient">recomenda.</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card/50 p-6 transition-all hover:-translate-y-1 hover:border-brand/50">
                <div className="flex gap-0.5 text-brand-glow">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-glow font-semibold text-primary-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="relative py-28">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Comece <span className="text-gradient">hoje mesmo.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Um único plano, tudo incluído. Sem letras miúdas.</p>

          <div className="relative mx-auto mt-12 max-w-md">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand via-brand-glow to-brand opacity-60 blur-xl animate-pulse-glow" />
            <div className="relative rounded-3xl glass glow-border p-8 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-brand-glow">Plano Pro</div>
                  <div className="mt-1 text-xs text-muted-foreground">Acesso completo à plataforma</div>
                </div>
                <div className="rounded-full bg-brand/20 px-3 py-1 text-xs font-medium text-brand-glow ring-1 ring-brand/30">
                  -50% hoje
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-gradient">R$ 97</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground line-through">de R$ 197/mês</div>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Fornecedores da China verificados",
                  "Calculadora de impostos completa",
                  "Precificação inteligente",
                  "Gestão de pedidos + rastreamento",
                  "IA especialista 24/7",
                  "Radar de produtos em alta",
                  "Calculadora de viabilidade",
                  "Suporte prioritário",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-brand/20 text-brand-glow">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" className="group mt-8 h-12 w-full rounded-xl bg-gradient-to-r from-brand to-brand-glow text-base font-semibold text-primary-foreground shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 hover:-translate-y-0.5">
                Garantir minha vaga
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                7 dias de garantia incondicional · cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-glow">
              <Globe2 className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">ImportPro</span>
          </div>
          <div>© {new Date().getFullYear()} ImportPro. Todos os direitos reservados.</div>
        </div>
      </footer>
    </main>
  );
}
