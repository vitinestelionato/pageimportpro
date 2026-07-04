import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, RefreshCw, Sparkles, X, Users, Target, DollarSign, Filter,
  Zap, Store, Shield, ShieldAlert, TrendingUp, Star, ChevronRight,
  Lightbulb, AlertTriangle, Megaphone, ArrowUpRight, Swords, Crown,
  Eye, BarChart3,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeCompetitors, type Competitor, type CompetitorAnalysis } from "@/lib/competitors.functions";

export const Route = createFileRoute("/_authenticated/dashboard/concorrentes")({
  head: () => ({ meta: [{ title: "Análise de Concorrentes · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CompetitorsPage,
});

const SUGGESTIONS = [
  "Suporte magnético MagSafe",
  "Escova alisadora íon",
  "Luminária de mesa RGB",
  "Cinta modeladora shapewear",
  "Fone bluetooth translation",
  "Câmera veicular dashcam",
];

type SortKey = "threat" | "share" | "sales" | "rating" | "price_asc" | "price_desc";

function CompetitorsPage() {
  const fetchAnalysis = useServerFn(analyzeCompetitors);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CompetitorAnalysis | null>(null);
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [threat, setThreat] = useState<string>("all");
  const [positioning, setPositioning] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("threat");

  const analyzeMut = useMutation({
    mutationFn: (payload: { query: string; refresh: boolean }) =>
      fetchAnalysis({ data: payload }) as Promise<CompetitorAnalysis>,
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${data.competitors.length} concorrentes mapeados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (q?: string) => {
    const query = (q ?? input).trim();
    if (query.length < 2) {
      toast.error("Digite um produto ou nicho para analisar");
      return;
    }
    setInput(query);
    setThreat("all"); setPositioning("all"); setPlatform("all"); setSort("threat");
    analyzeMut.mutate({ query, refresh: false });
  };

  const platforms = useMemo(() => {
    if (!result) return [] as string[];
    return Array.from(new Set(result.competitors.map((c) => c.platform)));
  }, [result]);

  const filtered = useMemo(() => {
    if (!result) return [];
    const f = result.competitors.filter((c) => {
      if (threat !== "all" && c.threat_level !== threat) return false;
      if (positioning !== "all" && c.positioning !== positioning) return false;
      if (platform !== "all" && c.platform !== platform) return false;
      return true;
    });
    const s = [...f];
    const threatRank = { critico: 4, alto: 3, medio: 2, baixo: 1 };
    switch (sort) {
      case "threat": s.sort((a, b) => (threatRank[b.threat_level] ?? 0) - (threatRank[a.threat_level] ?? 0)); break;
      case "share": s.sort((a, b) => b.market_share_pct - a.market_share_pct); break;
      case "sales": s.sort((a, b) => b.monthly_sales_estimate - a.monthly_sales_estimate); break;
      case "rating": s.sort((a, b) => b.rating - a.rating); break;
      case "price_asc": s.sort((a, b) => a.price_brl.avg - b.price_brl.avg); break;
      case "price_desc": s.sort((a, b) => b.price_brl.avg - a.price_brl.avg); break;
    }
    return s;
  }, [result, threat, positioning, platform, sort]);

  return (
    <DashboardShell breadcrumb="Concorrentes" title="Análise de Concorrentes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Mapeie quem já vende o produto/nicho que você quer atacar. A IA identifica concorrentes reais, preços praticados, forças, fraquezas e brechas de mercado para você entrar melhor.
        </p>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ex: suporte veicular magnético, escova alisadora, camiseta oversized..."
              className="h-12 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {input && (
              <button onClick={() => setInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => submit()}
            disabled={analyzeMut.isPending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {analyzeMut.isPending ? (
              <><Sparkles className="h-4 w-4 animate-pulse" /> Analisando...</>
            ) : (
              <><Swords className="h-4 w-4" /> Analisar concorrentes</>
            )}
          </button>
        </div>

        {!result && !analyzeMut.isPending && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Sugestões</div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/80 hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {analyzeMut.isPending ? (
        <LoadingState query={input} />
      ) : analyzeMut.isError ? (
        <ErrorState message={(analyzeMut.error as Error)?.message ?? "Erro"} onRetry={() => submit()} />
      ) : !result ? (
        <EmptyState />
      ) : (
        <>
          {/* Market overview */}
          <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-primary">
                <BarChart3 className="h-3.5 w-3.5" /> Panorama de mercado
              </div>
              <h2 className="mt-2 font-display text-xl font-bold">"{result.query}"</h2>
              <p className="mt-2 text-sm text-foreground/90">{result.market_summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Preço médio" value={`R$ ${Math.round(result.avg_price_brl)}`} />
                <MiniStat label="Variação" value={`±${result.price_spread_pct}%`} />
                <MiniStat label="Saturação" value={cap(result.saturation)} tone={saturationTone(result.saturation)} />
                <MiniStat label="Dificuldade" value={`${result.entry_difficulty}/10`} tone={result.entry_difficulty >= 7 ? "rose" : result.entry_difficulty >= 4 ? "amber" : "emerald"} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                <Lightbulb className="h-3.5 w-3.5" /> Estratégia recomendada
              </div>
              <p className="mt-2 text-sm text-foreground/90">{result.recommended_strategy}</p>
              {result.key_insights?.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {result.key_insights.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-xs text-foreground/85">
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect value={threat} onChange={setThreat} label="Ameaça" options={[
                { v: "all", l: "Qualquer ameaça" },
                { v: "critico", l: "Crítica" },
                { v: "alto", l: "Alta" },
                { v: "medio", l: "Média" },
                { v: "baixo", l: "Baixa" },
              ]} />
              <FilterSelect value={positioning} onChange={setPositioning} label="Posicionamento" options={[
                { v: "all", l: "Qualquer posicionamento" },
                { v: "premium", l: "Premium" },
                { v: "intermediario", l: "Intermediário" },
                { v: "popular", l: "Popular" },
                { v: "low_cost", l: "Low cost" },
              ]} />
              <FilterSelect value={platform} onChange={setPlatform} label="Plataforma" options={[
                { v: "all", l: "Qualquer plataforma" },
                ...platforms.map((p) => ({ v: p, l: p })),
              ]} />
              <FilterSelect value={sort} onChange={(v) => setSort(v as SortKey)} label="Ordenar" options={[
                { v: "threat", l: "Maior ameaça" },
                { v: "share", l: "Maior share" },
                { v: "sales", l: "Mais vendas" },
                { v: "rating", l: "Melhor avaliado" },
                { v: "price_desc", l: "Maior preço" },
                { v: "price_asc", l: "Menor preço" },
              ]} />
              <div className="ml-auto flex items-center gap-2">
                <p className="text-xs text-muted-foreground"><Filter className="mr-1 inline h-3 w-3" /> {filtered.length} de {result.competitors.length}</p>
                <button
                  onClick={() => analyzeMut.mutate({ query: result.query, refresh: true })}
                  disabled={analyzeMut.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${analyzeMut.isPending ? "animate-spin" : ""}`} /> Nova análise
                </button>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Nenhum concorrente com esses filtros</h3>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros para ver todos.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c, i) => (
                <CompetitorCard key={`${c.name}-${i}`} c={c} rank={i + 1} onOpen={() => setSelected(c)} />
              ))}
            </div>
          )}
        </>
      )}

      {selected && <CompetitorModal c={selected} onClose={() => setSelected(null)} />}
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <Swords className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">Analise seus concorrentes</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Digite um produto, nicho ou palavra-chave acima. Nossa IA mapeia quem vende, quanto cobra, o que faz bem e onde você pode atacar.
      </p>
    </div>
  );
}

function LoadingState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-card/40 p-12 text-center backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-7 w-7 animate-pulse text-primary" />
      </div>
      <h3 className="mt-5 font-display text-lg font-bold">Mapeando concorrentes de "{query}"...</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Cruzando dados de marketplaces, lojas próprias e redes sociais para montar o panorama competitivo.
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
      <h3 className="font-display text-lg font-bold text-rose-300">Não foi possível concluir a análise</h3>
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

function CompetitorCard({ c, rank, onOpen }: { c: Competitor; rank: number; onOpen: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur transition hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
            {rank === 1 ? <Crown className="h-4 w-4" /> : `#${rank}`}
          </span>
          <ThreatBadge level={c.threat_level} />
        </div>
        <PositioningBadge p={c.positioning} />
      </div>

      <h3 className="mt-3 font-display text-base font-bold leading-snug">{c.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Store className="h-3 w-3" /> {c.platform}</span>
        <span className="opacity-60">·</span>
        <span>{typeLabel(c.type)}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground/80">{c.url_hint}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
        <Metric icon={<DollarSign className="h-3 w-3" />} label="Preço médio" value={`R$${Math.round(c.price_brl.avg)}`} />
        <Metric icon={<TrendingUp className="h-3 w-3" />} label="Vendas/mês" value={formatCompact(c.monthly_sales_estimate)} tone="emerald" />
        <Metric icon={<Star className="h-3 w-3" />} label={`${c.reviews_count > 999 ? formatCompact(c.reviews_count) : c.reviews_count} avals`} value={`${c.rating.toFixed(1)}★`} tone="amber" />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Market share estimado</span>
          <span className="text-primary">{c.market_share_pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${Math.min(100, c.market_share_pct * 2.5)}%` }} />
        </div>
      </div>

      <div className="mt-3 flex gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90"><span className="font-semibold text-emerald-300">Brecha: </span>{c.opportunity_gap}</p>
      </div>

      <button
        onClick={onOpen}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/15 text-xs font-bold text-primary hover:bg-primary/25"
      >
        Ver análise completa <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function CompetitorModal({ c, onClose }: { c: Competitor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ThreatBadge level={c.threat_level} />
              <PositioningBadge p={c.positioning} />
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                <Store className="h-3 w-3" /> {c.platform}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">{typeLabel(c.type)}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold">{c.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.url_hint}</p>
            <p className="mt-3 text-sm text-foreground/90">{c.differentiators}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile icon={<DollarSign className="h-4 w-4" />} label="Faixa de preço" value={`R$${Math.round(c.price_brl.min)}–${Math.round(c.price_brl.max)}`} small />
          <KpiTile icon={<TrendingUp className="h-4 w-4" />} label="Vendas/mês" value={formatCompact(c.monthly_sales_estimate)} tone="emerald" />
          <KpiTile icon={<Star className="h-4 w-4" />} label={`${formatCompact(c.reviews_count)} avals`} value={`${c.rating.toFixed(1)}★`} tone="amber" />
          <KpiTile icon={<Eye className="h-4 w-4" />} label="Market share" value={`${c.market_share_pct}%`} tone="primary" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Section icon={<Shield className="h-4 w-4" />} title="Forças" tone="emerald">
            <ul className="space-y-1.5">
              {c.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<ShieldAlert className="h-4 w-4" />} title="Fraquezas exploráveis" tone="rose">
            <ul className="space-y-1.5">
              {c.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span className="text-foreground/90">{w}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Megaphone className="h-4 w-4" />} title="Ângulos de marketing">
            <ul className="space-y-1.5">
              {c.marketing_angles.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-foreground/90">{a}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Users className="h-4 w-4" />} title="Fontes de tráfego">
            <div className="flex flex-wrap gap-1.5">
              {c.traffic_sources.map((t) => (
                <span key={t} className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{t}</span>
              ))}
            </div>
          </Section>
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">Brecha de oportunidade</div>
            <p className="mt-1 text-sm text-foreground/90">{c.opportunity_gap}</p>
          </div>
        </div>

        {c.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {c.tags.map((t) => (
              <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- helpers --- */

function Section({ icon, title, children, tone }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: "emerald" | "rose" }) {
  const iconCls = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : "text-primary";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className={iconCls}>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function KpiTile({ icon, label, value, tone, small }: { icon: React.ReactNode; label: string; value: string; tone?: "emerald" | "amber" | "primary"; small?: boolean }) {
  const cls = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div className={`mt-1.5 font-display font-bold ${small ? "text-base" : "text-xl"} ${cls}`}>{value}</div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "emerald" | "amber" }) {
  const cls = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : "text-foreground";
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-sm font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "rose" | "primary" }) {
  const cls = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : tone === "rose" ? "text-rose-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function ThreatBadge({ level }: { level: Competitor["threat_level"] }) {
  const map = {
    critico: { cls: "border-rose-500/50 bg-rose-500/20 text-rose-300", label: "Crítico", icon: <AlertTriangle className="h-3 w-3" /> },
    alto: { cls: "border-orange-500/50 bg-orange-500/20 text-orange-300", label: "Alto", icon: <ShieldAlert className="h-3 w-3" /> },
    medio: { cls: "border-amber-500/50 bg-amber-500/20 text-amber-300", label: "Médio", icon: <Shield className="h-3 w-3" /> },
    baixo: { cls: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300", label: "Baixo", icon: <Shield className="h-3 w-3" /> },
  } as const;
  const d = map[level] ?? map.medio;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${d.cls}`}>
      {d.icon} Ameaça {d.label}
    </span>
  );
}

function PositioningBadge({ p }: { p: Competitor["positioning"] }) {
  const map = {
    premium: { cls: "border-violet-500/40 bg-violet-500/15 text-violet-300", label: "Premium" },
    intermediario: { cls: "border-sky-500/40 bg-sky-500/15 text-sky-300", label: "Intermediário" },
    popular: { cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", label: "Popular" },
    low_cost: { cls: "border-amber-500/40 bg-amber-500/15 text-amber-300", label: "Low cost" },
  } as const;
  const d = map[p] ?? map.intermediario;
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${d.cls}`}>{d.label}</span>;
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-[160px] rounded-lg border-white/10 bg-black/20 text-xs" aria-label={label}>
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

function typeLabel(t: Competitor["type"]): string {
  return { marketplace_seller: "Marketplace", loja_propria: "Loja própria", dropshipper: "Dropshipper", marca: "Marca", influencer: "Influencer" }[t] ?? t;
}

function saturationTone(s: string): "emerald" | "amber" | "rose" {
  return s === "baixa" ? "emerald" : s === "saturado" || s === "alta" ? "rose" : "amber";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
