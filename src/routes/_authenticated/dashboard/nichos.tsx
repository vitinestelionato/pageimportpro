import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, TrendingUp, Search, RefreshCw, Sparkles, X, Users, Calendar,
  Target, DollarSign, Filter, Zap, Hash, Store, Lightbulb, MapPin, Eye,
  ChevronRight, ArrowUpRight,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listHotNiches, type HotNiche } from "@/lib/niches.functions";

export const Route = createFileRoute("/_authenticated/dashboard/nichos")({
  head: () => ({ meta: [{ title: "Nichos Quentes · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NichesPage,
});

const SEGMENTS = [
  "Todos", "Eletrônicos", "Moda", "Casa e Cozinha", "Beleza",
  "Fitness", "Pet", "Infantil", "Automotivo", "Escritório",
];

type SortKey = "heat" | "growth" | "margin" | "searches" | "ticket";

function NichesPage() {
  const qc = useQueryClient();
  const fetchNiches = useServerFn(listHotNiches);
  const [segment, setSegment] = useState("Todos");
  const [q, setQ] = useState("");
  const [competition, setCompetition] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("heat");
  const [selected, setSelected] = useState<HotNiche | null>(null);

  const { data: niches = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["hot-niches", segment],
    queryFn: () => fetchNiches({ data: { segment: segment as never, refresh: false } }) as Promise<HotNiche[]>,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

  const refreshMut = useMutation({
    mutationFn: () => fetchNiches({ data: { segment: segment as never, refresh: true } }) as Promise<HotNiche[]>,
    onSuccess: (fresh) => {
      qc.setQueryData(["hot-niches", segment], fresh);
      toast.success("Nichos atualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const f = niches.filter((n) => {
      if (competition !== "all" && n.competition !== competition) return false;
      if (audience !== "all" && n.audience_size !== audience) return false;
      if (q) {
        const t = q.toLowerCase();
        const hay = [n.name, n.description, n.category, ...(n.tags ?? []), ...(n.keywords ?? [])].join(" ").toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
    const s = [...f];
    switch (sort) {
      case "heat": s.sort((a, b) => b.heat_score - a.heat_score); break;
      case "growth": s.sort((a, b) => b.growth_pct - a.growth_pct); break;
      case "margin": s.sort((a, b) => b.margin_pct - a.margin_pct); break;
      case "searches": s.sort((a, b) => b.monthly_searches - a.monthly_searches); break;
      case "ticket": s.sort((a, b) => b.avg_ticket_brl - a.avg_ticket_brl); break;
    }
    return s;
  }, [niches, q, competition, audience, sort]);

  const stats = useMemo(() => {
    if (!niches.length) return { total: 0, hot: 0, avgGrowth: 0, avgMargin: 0 };
    const avgGrowth = Math.round(niches.reduce((s, n) => s + n.growth_pct, 0) / niches.length);
    const avgMargin = Math.round(niches.reduce((s, n) => s + n.margin_pct, 0) / niches.length);
    const hot = niches.filter((n) => n.heat_score >= 85).length;
    return { total: niches.length, hot, avgGrowth, avgMargin };
  }, [niches]);

  return (
    <DashboardShell breadcrumb="Nichos Quentes" title="Nichos Quentes">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Descubra nichos com alta demanda no Brasil para focar sua operação de importação. Cada nicho traz público-alvo, produtos que vendem, ângulos de conteúdo e palavras-chave.
        </p>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending || isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 text-sm font-semibold hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMut.isPending || isFetching ? "animate-spin" : ""}`} />
          {refreshMut.isPending ? "Analisando..." : "Nova análise"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Target className="h-4 w-4" />} label="Nichos analisados" value={String(stats.total)} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Muito quentes" value={String(stats.hot)} tone="rose" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Crescimento médio" value={`+${stats.avgGrowth}%`} tone="emerald" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Margem média" value={`${stats.avgMargin}%`} tone="primary" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nicho, palavra-chave ou tag..."
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <FilterSelect
            value={segment}
            onChange={setSegment}
            label="Segmento"
            options={SEGMENTS.map((s) => ({ v: s, l: s }))}
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
            value={audience}
            onChange={setAudience}
            label="Público"
            options={[
              { v: "all", l: "Qualquer tamanho" },
              { v: "pequeno", l: "Pequeno" },
              { v: "medio", l: "Médio" },
              { v: "grande", l: "Grande" },
              { v: "massivo", l: "Massivo" },
            ]}
          />
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            label="Ordenar"
            options={[
              { v: "heat", l: "Mais quentes" },
              { v: "growth", l: "Maior crescimento" },
              { v: "margin", l: "Maior margem" },
              { v: "searches", l: "Mais buscados" },
              { v: "ticket", l: "Maior ticket" },
            ]}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {niches.length} nichos
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
          <h3 className="mt-4 font-semibold">Nenhum nicho encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou gere uma nova análise.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n, i) => (
            <NicheCard key={`${n.slug}-${i}`} niche={n} rank={i + 1} onOpen={() => setSelected(n)} />
          ))}
        </div>
      )}

      {selected && <NicheDetailModal niche={selected} onClose={() => setSelected(null)} />}
    </DashboardShell>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-white/5 bg-card/40 p-12 text-center backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-7 w-7 animate-pulse text-primary" />
      </div>
      <h3 className="mt-5 font-display text-lg font-bold">Mapeando nichos em ascensão...</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Nossa IA está cruzando dados de marketplaces, redes sociais e volume de buscas para identificar os nichos mais promissores agora.
      </p>
      <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-2 xl:grid-cols-3">
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
      <h3 className="font-display text-lg font-bold text-rose-300">Não foi possível carregar os nichos</h3>
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

function NicheCard({ niche, rank, onOpen }: { niche: HotNiche; rank: number; onOpen: () => void }) {
  const n = niche;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur transition hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">#{rank}</span>
          <HeatBadge score={n.heat_score} />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
          <TrendingUp className="h-3 w-3" /> +{n.growth_pct}%
        </div>
      </div>

      <h3 className="mt-3 font-display text-base font-bold leading-snug">{n.name}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{n.category}</span>
        <CompetitionBadge c={n.competition} />
        <AudienceBadge size={n.audience_size} />
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{n.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
        <Metric icon={<Eye className="h-3 w-3" />} label="Buscas/mês" value={formatCompact(n.monthly_searches)} />
        <Metric icon={<DollarSign className="h-3 w-3" />} label="Ticket" value={`R$${Math.round(n.avg_ticket_brl)}`} />
        <Metric icon={<Zap className="h-3 w-3" />} label="Margem" value={`${n.margin_pct}%`} tone="emerald" />
      </div>

      <div className="mt-3 flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
        <Flame className="h-4 w-4 shrink-0 text-rose-400" />
        <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90">{n.why_hot}</p>
      </div>

      {n.top_products?.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Top produtos</div>
          <div className="flex flex-wrap gap-1">
            {n.top_products.slice(0, 3).map((p) => (
              <span key={p} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-foreground/80">{p}</span>
            ))}
            {n.top_products.length > 3 && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">+{n.top_products.length - 3}</span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onOpen}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/15 text-xs font-bold text-primary hover:bg-primary/25"
      >
        Ver estratégia completa <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function NicheDetailModal({ niche, onClose }: { niche: HotNiche; onClose: () => void }) {
  const n = niche;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <HeatBadge score={n.heat_score} />
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                <TrendingUp className="h-3 w-3" /> +{n.growth_pct}%
              </span>
              <CompetitionBadge c={n.competition} />
              <AudienceBadge size={n.audience_size} />
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold">{n.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{n.description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile icon={<Eye className="h-4 w-4" />} label="Buscas/mês" value={formatCompact(n.monthly_searches)} />
          <KpiTile icon={<DollarSign className="h-4 w-4" />} label="Ticket médio" value={`R$ ${Math.round(n.avg_ticket_brl)}`} />
          <KpiTile icon={<Zap className="h-4 w-4" />} label="Margem" value={`${n.margin_pct}%`} tone="emerald" />
          <KpiTile icon={<Calendar className="h-4 w-4" />} label="Sazonalidade" value={n.seasonality} small />
        </div>

        {/* Why hot */}
        <div className="mt-5 flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <Flame className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-rose-300">Por que está bombando</div>
            <p className="mt-1 text-sm text-foreground/90">{n.why_hot}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Section icon={<Users className="h-4 w-4" />} title="Público-alvo">
            <p className="text-sm text-foreground/90">{n.target_audience}</p>
          </Section>

          <Section icon={<Store className="h-4 w-4" />} title="Melhores plataformas">
            <div className="flex flex-wrap gap-1.5">
              {n.best_platforms.map((p) => (
                <span key={p} className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{p}</span>
              ))}
            </div>
          </Section>

          <Section icon={<Target className="h-4 w-4" />} title="Top produtos que vendem">
            <ul className="space-y-1.5">
              {n.top_products.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Lightbulb className="h-4 w-4" />} title="Ângulos de conteúdo">
            <ul className="space-y-1.5">
              {n.content_angles.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-foreground/90">{a}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Zap className="h-4 w-4" />} title="Dores que resolve">
            <ul className="space-y-1.5">
              {n.pain_points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<MapPin className="h-4 w-4" />} title="Hubs de fornecedores">
            <div className="flex flex-wrap gap-1.5">
              {n.origin_hubs.map((h) => (
                <span key={h} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground/90">{h}</span>
              ))}
            </div>
          </Section>
        </div>

        {/* Keywords */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Hash className="h-3.5 w-3.5" /> Palavras-chave para SEO e ads
          </div>
          <div className="flex flex-wrap gap-1.5">
            {n.keywords.map((k) => (
              <span key={k} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">{k}</span>
            ))}
          </div>
        </div>

        {n.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {n.tags.map((t) => (
              <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function KpiTile({ icon, label, value, tone, small }: { icon: React.ReactNode; label: string; value: string; tone?: "emerald"; small?: boolean }) {
  const toneCls = tone === "emerald" ? "text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div className={`mt-1.5 font-display font-bold ${small ? "text-sm" : "text-xl"} ${toneCls}`}>{value}</div>
    </div>
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

function HeatBadge({ score }: { score: number }) {
  const label = score >= 90 ? "Muito quente" : score >= 80 ? "Quente" : score >= 70 ? "Aquecendo" : "Morno";
  const cls =
    score >= 90 ? "border-rose-500/50 bg-rose-500/20 text-rose-300" :
    score >= 80 ? "border-orange-500/50 bg-orange-500/20 text-orange-300" :
    score >= 70 ? "border-amber-500/50 bg-amber-500/20 text-amber-300" :
    "border-white/20 bg-white/5 text-white/70";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      <Flame className="h-3 w-3" /> {label} · {score}°
    </span>
  );
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

function AudienceBadge({ size }: { size: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pequeno: { cls: "border-white/20 bg-white/5 text-white/70", label: "Público pequeno" },
    medio: { cls: "border-sky-500/40 bg-sky-500/15 text-sky-300", label: "Público médio" },
    grande: { cls: "border-violet-500/40 bg-violet-500/15 text-violet-300", label: "Público grande" },
    massivo: { cls: "border-primary/50 bg-primary/15 text-primary", label: "Público massivo" },
  };
  const d = map[size] ?? map.medio;
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
