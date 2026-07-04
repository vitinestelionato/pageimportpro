import { createFileRoute, Link, useServerFn } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import {
  Package,
  BarChart3,
  TrendingUp,
  Sparkles,
  Calculator,
  Flame,
  Truck,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { productStats } from "@/lib/products.functions";
import { getExchangeRates } from "@/lib/exchange.functions";
import { Suspense, type ReactNode } from "react";

const statsOptions = () =>
  queryOptions({
    queryKey: ["products", "stats"],
    queryFn: () => productStats(),
  });

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ImportPro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions()),
  component: DashboardHome,
});

function DashboardHome() {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <DashboardShell breadcrumb="Dashboard">
      <div>
        <p className="text-xs capitalize text-muted-foreground">{today}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          Olá, <span className="text-primary">bem-vindo</span> 👋
        </h1>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <ExchangeWidget />

      <section className="grid gap-4 md:grid-cols-3">
        <QuickCard to="/dashboard/calculadora" icon={<Calculator className="h-5 w-5" />} title="Calcular Impostos" subtitle="Simule o custo total de importação" iconBg="bg-primary/15 text-primary" />
        <QuickCard to="/dashboard/produtos" icon={<Package className="h-5 w-5" />} title="Meus Produtos" subtitle="Cadastre e acompanhe seus itens" iconBg="bg-emerald-500/15 text-emerald-400" />
        <QuickCard to="/dashboard/cambio" icon={<DollarSign className="h-5 w-5" />} title="Câmbio ao vivo" subtitle="USD, EUR e CNY em BRL agora" iconBg="bg-orange-500/15 text-orange-400" />
      </section>

      <section className="rounded-2xl border border-white/5 bg-card/60 p-6 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Comece por aqui</h2>
        </div>
        <ul className="space-y-3 text-sm">
          <Row title="1. Cadastre seus produtos em análise" to="/dashboard/produtos" />
          <Row title="2. Use a calculadora para saber o custo real com impostos" to="/dashboard/calculadora" />
          <Row title="3. Acompanhe o câmbio ao vivo antes de fechar a compra" to="/dashboard/cambio" />
          <Row title="4. Anote insights de fornecedores" to="/dashboard/anotacoes" />
        </ul>
      </section>
    </DashboardShell>
  );
}

function StatsSection() {
  const { data } = useSuspenseQuery(statsOptions());
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard title="Total de Produtos" value={String(data.total)} icon={<Package className="h-4 w-4" />} accent="from-primary/40" />
      <StatCard title="Em Análise" value={String(data.analise)} icon={<BarChart3 className="h-4 w-4" />} accent="from-amber-500/40" iconBg="bg-amber-500/15 text-amber-400" />
      <StatCard title="Importados" value={String(data.importado)} icon={<TrendingUp className="h-4 w-4" />} accent="from-emerald-500/40" iconBg="bg-emerald-500/15 text-emerald-400" />
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[0,1,2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-card/40" />
      ))}
    </section>
  );
}

function ExchangeWidget() {
  const fetchRates = useServerFn(getExchangeRates);
  const { data } = useQuery({
    queryKey: ["exchange"],
    queryFn: () => fetchRates(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const fmt = (n?: number) =>
    n ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 }).format(n) : "—";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {(["USD","EUR","CNY"] as const).map((c) => (
        <div key={c} className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c} / BRL {data?.stale ? "· offline" : ""}</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 font-display text-2xl font-bold">{fmt(data?.[c])}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Atualizado {data?.updatedAt ?? "..."}</div>
        </div>
      ))}
    </section>
  );
}

function StatCard({ title, value, icon, accent, iconBg = "bg-primary/15 text-primary" }: { title: string; value: string; icon: ReactNode; accent: string; iconBg?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/70 p-5 backdrop-blur transition hover:border-primary/30">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} to-transparent`} />
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>{icon}</span>
      </div>
      <div className="mt-4 font-display text-4xl font-bold">{value}</div>
    </div>
  );
}

function QuickCard({ to, icon, title, subtitle, iconBg }: { to: string; icon: ReactNode; title: string; subtitle: string; iconBg: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-card/60 p-5 text-left backdrop-blur transition hover:border-primary/30 hover:bg-card">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>{icon}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}

function Row({ title, to }: { title: string; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/40 p-3 hover:border-primary/30">
        <Flame className="h-4 w-4 text-primary" />
        <span className="flex-1">{title}</span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </li>
  );
}
