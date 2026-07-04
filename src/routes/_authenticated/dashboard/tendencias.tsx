import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, TrendingUp, Search, RefreshCw, Sparkles, X, Users, Calendar,
  Store, Eye, DollarSign, ChevronDown, ChevronUp, Filter, Zap, ShoppingBag,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTrendingProducts, type TrendingProduct } from "@/lib/trends.functions";
import { BuyOnAgentButton } from "@/components/BuyOnAgentButton";

export const Route = createFileRoute("/_authenticated/dashboard/tendencias")({
  head: () => ({ meta: [{ title: "Produtos em Alta · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TrendsPage,
});

const CATEGORIES = [
  "Eletrônicos", "Moda", "Casa e Cozinha", "Beleza", "Fitness",
  "Pet", "Infantil", "Automotivo", "Escritório", "Ferramentas",
];

type SortKey = "growth" | "searches" | "margin" | "price_asc";

function TrendsPage() {
  const qc = useQueryClient();
  const fetchTrends = useServerFn(listTrendingProducts);
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const [demand, setDemand] = useState<string>("all");
  const [competition, setCompetition] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("growth");

  const { data: products = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["trends", category],
    queryFn: () => fetchTrends({ data: { category: category as never, refresh: false } }) as Promise<TrendingProduct[]>,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

  const refreshMut = useMutation({
    mutationFn: () => fetchTrends({ data: { category: category as never, refresh: true } }) as Promise<TrendingProduct[]>,
    onSuccess: (fresh) => {
      qc.setQueryData(["trends", category], fresh);
      toast.success("Tendências atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const f = products.filter((p) => {
      if (demand !== "all" && p.demand !== demand) return false;
      if (competition !== "all" && p.competition !== competition) return false;
      if (q) {
        const t = q.toLowerCase();
        const hay = [p.name, p.niche, p.description, p.category, ...(p.tags ?? [])].join(" ").toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
    const s = [...f];
    switch (sort) {
      case "growth": s.sort((a, b) => b.growth_pct - a.growth_pct); break;
      case "searches": s.sort((a, b) => b.monthly_searches - a.monthly_searches); break;
      case "margin": s.sort((a, b) => b.margin_pct - a.margin_pct); break;
      case "price_asc": s.sort((a, b) => a.price_range_brl.min - b.price_range_brl.min); break;
    }
    return s;
  }, [products, q, demand, competition, sort]);

  const stats = useMemo(() => {
    if (!products.length) return { total: 0, avgGrowth: 0, avgMargin: 0, hot: 0 };
    const avgGrowth = Math.round(products.reduce((s, p) => s + p.growth_pct, 0) / products.length);
    const avgMargin = Math.round(products.reduce((s, p) => s + p.margin_pct, 0) / products.length);
    const hot = products.filter((p) => p.demand === "muito_alta").length;
    return { total: products.length, avgGrowth, avgMargin, hot };
  }, [products]);

  return (
    <DashboardShell breadcrumb="Produtos em Alta" title="Produtos em Alta">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Descubra os produtos que estão bombando agora no mercado brasileiro, com estimativas de busca, margem e nível de concorrência para você antecipar tendências.
        </p>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending || isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 text-sm font-semibold hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMut.isPending || isFetching ? "animate-spin" : ""}`} />
          {refreshMut.isPending ? "Atualizando..." : "Nova análise"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Tendências" value={String(stats.total)} tone="rose" />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Demanda muito alta" value={String(stats.hot)} tone="primary" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Crescimento médio" value={`+${stats.avgGrowth}%`} tone="emerald" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Margem média" value={`${stats.avgMargin}%`} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tendência, nicho ou tag..."
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <FilterSelect
            value={category}
            onChange={setCategory}
            label="Categoria"
            options={[{ v: "all", l: "Todas categorias" }, ...CATEGORIES.map((c) => ({ v: c, l: c }))]}
          />
          <FilterSelect
            value={demand}
            onChange={setDemand}
            label="Demanda"
            options={[
              { v: "all", l: "Qualquer demanda" },
              { v: "muito_alta", l: "Muito alta" },
              { v: "alta", l: "Alta" },
              { v: "media", l: "Média" },
            ]}
          />
          <FilterSelect
            value={competition}
            onChange={setCompetition}
            label="Concorrência"
            options={[
              { v: "all", l: "Qualquer concorrência" },
              { v: "baixa", l: "Baixa" },
              { v: "media", l: "Média" },
              { v: "alta", l: "Alta" },
            ]}
          />
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            label="Ordenar"
            options={[
              { v: "growth", l: "Maior crescimento" },
              { v: "searches", l: "Mais buscados" },
              { v: "margin", l: "Maior margem" },
              { v: "price_asc", l: "Menor preço BR" },
            ]}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {products.length} produtos
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refreshMut.mutate()} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma tendência encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou gere uma nova análise.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => <TrendCard key={`${p.name}-${i}`} product={p} rank={i + 1} />)}
        </div>
      )}
    </DashboardShell>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-white/5 bg-card/40 p-12 text-center backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-7 w-7 animate-pulse text-primary" />
      </div>
      <h3 className="mt-5 font-display text-lg font-bold">Analisando tendências do mercado...</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Nossa IA está pesquisando produtos em alta no Brasil, cruzando dados de redes sociais, marketplaces e volume de buscas.
      </p>
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl border border-white/5 bg-black/20" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center">
      <h3 className="font-display text-lg font-bold text-rose-300">Não foi possível carregar as tendências</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" /> Tentar novamente
      </button>
    </div>
  );
}

function TrendCard({ product, rank }: { product: TrendingProduct; rank: number }) {
  const [open, setOpen] = useState(false);
  const p = product;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur transition hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--primary)]">
      {/* Rank + growth */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
            #{rank}
          </span>
          <DemandBadge demand={p.demand} />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
          <TrendingUp className="h-3 w-3" /> +{p.growth_pct}%
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3 font-display text-base font-bold leading-snug">{p.name}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{p.category}</span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{p.niche}</span>
        <CompetitionBadge c={p.competition} />
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>

      {/* Key metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
        <Metric icon={<Eye className="h-3 w-3" />} label="Buscas/mês" value={formatCompact(p.monthly_searches)} />
        <Metric icon={<ShoppingBag className="h-3 w-3" />} label="Preço BR" value={`R$${Math.round(p.price_range_brl.min)}-${Math.round(p.price_range_brl.max)}`} />
        <Metric icon={<DollarSign className="h-3 w-3" />} label="Margem" value={`${p.margin_pct}%`} tone="emerald" />
      </div>

      {/* Why hot */}
      <div className="mt-3 flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
        <Flame className="h-4 w-4 shrink-0 text-rose-400" />
        <p className="text-xs leading-relaxed text-foreground/90">{p.why_hot}</p>
      </div>

      {/* Expandable */}
      {open && (
        <div className="mt-3 space-y-2.5 border-t border-white/5 pt-3 text-xs">
          <Detail icon={<Users className="h-3 w-3" />} label="Público-alvo" value={p.target_audience} />
          <Detail icon={<Calendar className="h-3 w-3" />} label="Sazonalidade" value={p.seasonality} />
          <Detail icon={<DollarSign className="h-3 w-3" />} label="Custo origem" value={`US$ ${p.origin_price_usd.min.toFixed(2)} - US$ ${p.origin_price_usd.max.toFixed(2)}`} />
          <div className="flex items-start gap-2">
            <Store className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Melhores plataformas</div>
              <div className="flex flex-wrap gap-1">
                {p.best_platforms.map((pl) => (
                  <span key={pl} className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{pl}</span>
                ))}
              </div>
            </div>
          </div>
          {p.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {p.tags.map((t) => (
                <span key={t} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <BuyOnAgentButton keyword={p.name} size="sm" className="flex-1" />
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 bg-black/20 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {open ? <>Recolher <ChevronUp className="h-3 w-3" /></> : <>Ver detalhes <ChevronDown className="h-3 w-3" /></>}
        </button>
      </div>
    </article>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "emerald" }) {
  const toneCls = tone === "emerald" ? "text-emerald-400" : "text-foreground";
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-0.5 text-sm font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-foreground/90">{value}</div>
      </div>
    </div>
  );
}

function DemandBadge({ demand }: { demand: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    muito_alta: { cls: "border-rose-500/40 bg-rose-500/20 text-rose-300", label: "Muito alta" },
    alta: { cls: "border-amber-500/40 bg-amber-500/20 text-amber-300", label: "Alta" },
    media: { cls: "border-white/20 bg-white/5 text-white/70", label: "Média" },
  };
  const d = map[demand] ?? map.media;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${d.cls}`}>{d.label}</span>;
}

function CompetitionBadge({ c }: { c: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    baixa: { cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", label: "Conc. baixa" },
    media: { cls: "border-amber-500/40 bg-amber-500/15 text-amber-300", label: "Conc. média" },
    alta: { cls: "border-rose-500/40 bg-rose-500/15 text-rose-300", label: "Conc. alta" },
  };
  const d = map[c] ?? map.media;
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${d.cls}`}>{d.label}</span>;
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "primary" | "emerald" | "rose" }) {
  const toneCls =
    tone === "primary" ? "text-primary" :
    tone === "emerald" ? "text-emerald-400" :
    tone === "rose" ? "text-rose-400" : "text-foreground";
  return (
    <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className={toneCls}>{icon}</span> {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 min-w-[180px] rounded-lg border-white/10 bg-black/20 text-sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
