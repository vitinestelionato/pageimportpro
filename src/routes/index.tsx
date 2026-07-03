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
  Search,
  Flame,
  Filter,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityChat } from "@/components/CommunityChat";
import { useMemo } from "react";

function DashParticles({ count = 60 }: { count?: number }) {
  const dashes = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        len: 6 + Math.random() * 14,
        rot: -20 + Math.random() * 60,
        dx: -60 + Math.random() * 120,
        dy: -180 + Math.random() * 120,
        dur: 5 + Math.random() * 6,
        delay: -Math.random() * 8,
        opacity: 0.35 + Math.random() * 0.55,
        glow: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dashes.map((d, i) => (
        <span
          key={i}
          className="absolute block animate-dash rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.len}px`,
            height: "2px",
            background: d.glow ? "oklch(0.78 0.18 235)" : "oklch(0.65 0.2 255)",
            boxShadow: d.glow ? "0 0 12px oklch(0.75 0.2 235 / 0.9)" : "none",
            opacity: d.opacity,
            ["--r" as string]: `${d.rot}deg`,
            ["--dx" as string]: `${d.dx}px`,
            ["--dy" as string]: `${d.dy}px`,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

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
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_20%_10%,oklch(0.35_0.18_255/0.35),transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_20%,oklch(0.55_0.2_235/0.25),transparent_70%)]" />
        <DashParticles count={80} />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Left content */}
          <div className="relative">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand-glow backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-glow shadow-[0_0_10px_oklch(0.75_0.18_235)]" />
              O 1º sistema completo para importadores
            </div>

            <h1
              className="animate-rise mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[68px]"
              style={{ animationDelay: "80ms" }}
            >
              A plataforma completa
              <br />
              para <span className="text-gradient">importar da China</span>
            </h1>

            <p
              className="animate-rise mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Encontre fornecedores verificados, calcule impostos automaticamente, descubra produtos em alta e conte com uma IA que te acompanha em cada pedido — tudo em um só lugar.
            </p>

            <div
              className="animate-rise mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "240ms" }}
            >
              <a href="#precos">
                <Button
                  size="lg"
                  className="group h-12 rounded-full bg-gradient-to-r from-brand to-brand-glow px-7 text-base font-semibold text-primary-foreground shadow-xl shadow-brand/40 transition-all hover:-translate-y-0.5 hover:shadow-brand/60"
                >
                  Ativar ImportPro
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
              <a href="#recursos">
                <Button
                  size="lg"
                  variant="outline"
                  className="group h-12 rounded-full border-border bg-transparent px-7 text-base font-medium hover:bg-accent"
                >
                  Testar IA de importação
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            </div>

            <p
              className="animate-rise mt-10 font-mono text-xs text-muted-foreground/80"
              style={{ animationDelay: "320ms" }}
            >
              &gt; Criado por importadores que já movimentaram +R$ 180M em pedidos.
            </p>
          </div>

          {/* Right: tilted dashboard mockup */}
          <div
            className="animate-rise relative mx-auto w-full max-w-[680px] lg:mr-[-6rem]"
            style={{ animationDelay: "400ms" }}
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/30 via-brand-glow/20 to-transparent blur-3xl" />

            <div className="animate-tilt-float will-change-transform">
              <div className="overflow-hidden rounded-2xl glass glow-border p-2 shadow-[0_40px_80px_-20px_oklch(0.2_0.15_260/0.6)]">
                <div className="rounded-xl bg-background/70 p-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Radar className="h-4 w-4 text-brand-glow" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">Radar de Produtos</div>
                        <div className="text-[10px] text-muted-foreground">3.240 produtos · atualizado agora</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-[10px] font-medium text-brand-glow">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-glow" />
                      Analisando ao vivo
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { flag: "🇨🇳", name: "Mini Projetor 4K", margin: "182%", trend: "+312%" },
                      { flag: "🇧🇷", name: "Fone TWS Pro", margin: "148%", trend: "+96%" },
                      { flag: "🇺🇸", name: "Smartwatch S9", margin: "215%", trend: "+240%" },
                      { flag: "🇰🇷", name: "Luminária LED", margin: "168%", trend: "+128%" },
                      { flag: "🇯🇵", name: "Umidificador", margin: "134%", trend: "+72%" },
                      { flag: "🇫🇷", name: "Câmera Mini HD", margin: "192%", trend: "+156%" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="rounded-lg border border-border bg-card/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base leading-none">{p.flag}</span>
                          <span className="text-[9px] font-medium text-brand-glow">{p.trend}</span>
                        </div>
                        <div className="mt-2 h-12 rounded-md bg-gradient-to-br from-brand/20 to-brand-glow/10 ring-1 ring-brand/20" />
                        <div className="mt-2 truncate text-[10px] font-medium text-foreground">{p.name}</div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-[9px] text-muted-foreground">margem</span>
                          <span className="text-[10px] font-semibold text-foreground">{p.margin}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex h-16 items-end gap-1.5 rounded-lg border border-border bg-card/30 p-2">
                    {[35, 52, 44, 68, 58, 78, 62, 88, 72, 96, 82, 112, 90, 128].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-brand/40 to-brand-glow"
                        style={{ height: `${(h / 128) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating pills */}
            <div className="absolute -left-4 top-1/3 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 shadow-xl backdrop-blur animate-float">
              <TrendingUp className="h-4 w-4 text-brand-glow" />
              <div>
                <div className="text-xs font-semibold text-foreground">+312% em alta</div>
                <div className="text-[10px] text-muted-foreground">últimos 7 dias</div>
              </div>
            </div>

            <div
              className="absolute -bottom-2 left-6 flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-2 shadow-xl backdrop-blur animate-float"
              style={{ animationDelay: "1.2s" }}
            >
              <Sparkles className="h-4 w-4 text-brand-glow" />
              <div>
                <div className="text-xs font-semibold text-brand-glow">Oportunidade detectada</div>
                <div className="text-[10px] text-muted-foreground">baixo volume, alta demanda</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-16 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-glow" /> 7 dias de garantia</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-glow" /> Sem fidelidade</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-glow" /> Suporte humano</span>
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

      {/* Stop guessing – Dashboards */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="flex items-center justify-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-glow shadow-lg shadow-brand/30">
                <Radar className="h-5 w-5 text-primary-foreground" />
              </span>
              Pare de importar no escuro.
            </h2>
            <p className="mt-4 text-muted-foreground">
              O ImportPro mostra fornecedores verificados, produtos com demanda ativa e oportunidades reais para escalar sua loja com segurança.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: Supplier Finder */}
            <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand-glow ring-1 ring-brand/30">
                    <Search className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-display text-base font-semibold">Buscador de Fornecedores</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-glow" />
                      Mapa de Oportunidades
                    </div>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                  <span className="font-semibold text-foreground">3.240</span>
                  fornecedores
                  <span className="text-brand-glow">+128 esta semana</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { v: "3.240", l: "fornecedores verificados", icon: null },
                  { v: "820", l: "categorias mapeadas", icon: null },
                  { v: "+42%", l: "novos esta semana", icon: TrendingUp, up: true },
                  { v: "12%", l: "baixa concorrência", icon: TrendingUp, up: false },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-1.5 font-display text-xl font-bold text-foreground">
                      {s.icon && (
                        <s.icon
                          className={`h-4 w-4 ${s.up === false ? "rotate-180 text-destructive/80" : "text-brand-glow"}`}
                        />
                      )}
                      {s.v}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive-foreground">
                  <Flame className="h-3 w-3 text-destructive" /> Explodindo
                  <span className="rounded-full bg-destructive/30 px-1.5 py-0.5 text-[10px] text-destructive-foreground">342</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> Subindo rápido
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">521</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" /> Alta tração
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">188</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Potencial forte
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">274</span>
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { flag: "🇨🇳", name: "Mini Projetor 4K", cat: "Eletrônicos", sub: "12.4K", views: "2.8M", vids: "18", face: "96%", days: "12d listado", vol: "940K/mês" },
                  { flag: "🇨🇳", name: "Fone TWS Pro", cat: "Áudio", sub: "8.1K", views: "1.9M", vids: "11", face: "92%", days: "9d listado", vol: "1.2M/mês" },
                  { flag: "🇰🇷", name: "Smartwatch S9", cat: "Wearables", sub: "23.7K", views: "4.1M", vids: "27", face: "88%", days: "14d listado", vol: "1.6M/mês" },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.flag} {p.cat}</div>
                      </div>
                      <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive">Explodindo</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="relative aspect-video overflow-hidden rounded-md bg-gradient-to-br from-brand/30 to-brand-glow/10 ring-1 ring-brand/20">
                          <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-[9px] text-foreground">
                            {["1.2M", "840K", "2.1M"][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                      {[
                        { v: p.sub, l: "vendas" },
                        { v: p.views, l: "views" },
                        { v: p.vids, l: "reviews" },
                        { v: p.face, l: "margem" },
                      ].map((k) => (
                        <div key={k.l}>
                          <div className="text-[11px] font-semibold text-foreground">{k.v}</div>
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{p.days}</span>
                      <span>{p.vol}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Trending Products */}
            <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand-glow ring-1 ring-brand/30">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-display text-base font-semibold">Produtos em Alta</div>
                  <div className="text-xs text-muted-foreground">Descubra o que está vendendo agora.</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1.5 text-xs font-medium text-brand-glow ring-1 ring-brand/40">
                  <Radar className="h-3 w-3" /> Últimos 7 dias
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> +100K vendas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <Globe2 className="h-3 w-3" /> Multi-nicho
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <Filter className="h-3 w-3" /> Todos
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 p-1.5">
                <Search className="ml-2 h-4 w-4 text-muted-foreground" />
                <input
                  readOnly
                  value="eletrônicos"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button className="rounded-lg bg-gradient-to-r from-brand to-brand-glow px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                  Buscar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { name: "Luminária LED RGB", cat: "Casa", vol: "1.4M", margin: "+210%", score: 96 },
                  { name: "Câmera Mini Wi-Fi", cat: "Segurança", vol: "1.1M", margin: "+176%", score: 93 },
                  { name: "Umidificador Aroma", cat: "Bem-estar", vol: "870K", margin: "+150%", score: 90 },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-2.5">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand/30 to-brand-glow/10 ring-1 ring-brand/20">
                      <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-background/80 px-1 py-0.5 text-[9px] font-medium text-brand-glow">
                        <Flame className="h-2.5 w-2.5" /> {p.score}
                      </div>
                      <Play className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-foreground/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{p.cat}</span>
                        <span className="text-muted-foreground">👁 {p.vol}</span>
                        <span className="text-brand-glow">📈 {p.margin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
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

          {/* Process steps */}
          <div className="mt-16 hidden md:block">
            <div className="relative mx-auto grid max-w-5xl grid-cols-4 gap-4">
              {/* Connector lines */}
              <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 flex items-center justify-between px-[12.5%]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative mx-6 h-px flex-1 bg-border">
                    <div
                      className="absolute inset-0 animate-line-fill bg-gradient-to-r from-brand to-brand-glow shadow-[0_0_10px_oklch(0.65_0.2_255)]"
                      style={{ animationDelay: `${i * 1.2}s` }}
                    />
                  </div>
                ))}
              </div>

              {[
                { n: "01", icon: Radar, title: "Descubra", sub: "Radar de produtos" },
                { n: "02", icon: Calculator, title: "Valide", sub: "Impostos + margem" },
                { n: "03", icon: Package, title: "Importe", sub: "Fornecedores verificados" },
                { n: "04", icon: TrendingUp, title: "Lucre", sub: "Precifique e escale" },
              ].map((s, i) => (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className="grid h-20 w-20 animate-step-glow place-items-center rounded-full border-2 transition-colors"
                      style={{ animationDelay: `${i * 1.2}s` }}
                    >
                      <s.icon className="h-7 w-7" />
                    </div>
                    <div className="absolute -top-1 right-0 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground ring-1 ring-border">
                      {s.n}
                    </div>
                  </div>
                  <div className="mt-3 font-display text-sm font-semibold text-foreground">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/0 to-brand/0 opacity-0 transition-opacity duration-500 group-hover:from-brand/10 group-hover:to-transparent group-hover:opacity-100" />
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-primary-foreground shadow-lg shadow-brand/30 transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-3xl text-center text-xs italic text-muted-foreground">
            Importante: para operar com segurança, o ImportPro conecta você apenas a fornecedores auditados e respeita as regras alfandegárias brasileiras, mantendo cada etapa da sua importação dentro da lei.
          </p>
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
