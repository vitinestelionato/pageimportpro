import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, Heart, ExternalLink, TrendingUp, TrendingDown, Minus,
  Sparkles, Star, Flame, LayoutGrid, ArrowDownToLine, Filter, X,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCatalog, toggleCatalogFavorite, importCatalogItem } from "@/lib/catalog.functions";
import { BuyOnAgentButton } from "@/components/BuyOnAgentButton";

export const Route = createFileRoute("/_authenticated/dashboard/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CatalogPage,
});

type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  niche: string | null;
  image_url: string | null;
  origin_country: string;
  origin_currency: string;
  origin_price: number;
  suggested_price_brl: number;
  margin_pct: number;
  difficulty: string;
  trend: string;
  monthly_searches: number;
  supplier_url: string | null;
  supplier_platform: string | null;
  tags: string[];
  rating: number;
  featured: boolean;
  is_favorite: boolean;
};

type SortKey = "featured" | "margin" | "searches" | "rating" | "price_asc" | "price_desc";

function CatalogPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listCatalog);
  const toggleFav = useServerFn(toggleCatalogFavorite);
  const importItem = useServerFn(importCatalogItem);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchList() as Promise<CatalogItem[]>,
  });

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [trend, setTrend] = useState<string>("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items]);

  const filtered = useMemo(() => {
    const f = items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (difficulty !== "all" && it.difficulty !== difficulty) return false;
      if (trend !== "all" && it.trend !== trend) return false;
      if (onlyFav && !it.is_favorite) return false;
      if (q) {
        const s = q.toLowerCase();
        const inTags = it.tags.some((t) => t.toLowerCase().includes(s));
        if (!it.name.toLowerCase().includes(s) && !inTags && !(it.niche ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
    const sorted = [...f];
    switch (sort) {
      case "margin": sorted.sort((a, b) => b.margin_pct - a.margin_pct); break;
      case "searches": sorted.sort((a, b) => b.monthly_searches - a.monthly_searches); break;
      case "rating": sorted.sort((a, b) => b.rating - a.rating); break;
      case "price_asc": sorted.sort((a, b) => a.suggested_price_brl - b.suggested_price_brl); break;
      case "price_desc": sorted.sort((a, b) => b.suggested_price_brl - a.suggested_price_brl); break;
      default: sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
    }
    return sorted;
  }, [items, q, category, difficulty, trend, onlyFav, sort]);

  const favMut = useMutation({
    mutationFn: (itemId: string) => toggleFav({ data: { itemId } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(r.favorited ? "Adicionado aos favoritos" : "Removido dos favoritos");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: (itemId: string) => importItem({ data: { itemId } }),
    onSuccess: () => toast.success("Produto adicionado à sua Gestão de Produtos"),
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => ({
    total: items.length,
    featured: items.filter((i) => i.featured).length,
    hot: items.filter((i) => i.trend === "alta").length,
    avgMargin: items.length ? Math.round(items.reduce((s, i) => s + i.margin_pct, 0) / items.length) : 0,
  }), [items]);

  return (
    <DashboardShell breadcrumb="Catálogo" title="Catálogo de Produtos Vencedores">
      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<LayoutGrid className="h-4 w-4" />} label="Produtos no catálogo" value={String(stats.total)} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Destaques" value={String(stats.featured)} tone="primary" />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Em alta" value={String(stats.hot)} tone="rose" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Margem média" value={`${stats.avgMargin}%`} tone="emerald" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produto, nicho ou tag..."
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <FilterSelect value={category} onChange={setCategory} label="Categoria" options={[{ v: "all", l: "Todas categorias" }, ...categories.map((c) => ({ v: c, l: c }))]} />
          <FilterSelect value={difficulty} onChange={setDifficulty} label="Dificuldade" options={[
            { v: "all", l: "Qualquer dificuldade" },
            { v: "facil", l: "Fácil" }, { v: "medio", l: "Médio" }, { v: "dificil", l: "Difícil" },
          ]} />
          <FilterSelect value={trend} onChange={setTrend} label="Tendência" options={[
            { v: "all", l: "Todas tendências" },
            { v: "alta", l: "Em alta" }, { v: "estavel", l: "Estável" }, { v: "baixa", l: "Em queda" },
          ]} />
          <FilterSelect value={sort} onChange={(v) => setSort(v as SortKey)} label="Ordenar" options={[
            { v: "featured", l: "Destaques primeiro" },
            { v: "margin", l: "Maior margem" },
            { v: "searches", l: "Mais buscados" },
            { v: "rating", l: "Melhor avaliação" },
            { v: "price_asc", l: "Menor preço BR" },
            { v: "price_desc", l: "Maior preço BR" },
          ]} />

          <button
            onClick={() => setOnlyFav((v) => !v)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
              onlyFav ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-black/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${onlyFav ? "fill-current" : ""}`} /> Favoritos
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {items.length} produtos
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-white/5 bg-card/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
          <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou limpe a busca para ver mais opções.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it) => (
            <ProductCard
              key={it.id}
              item={it}
              onFav={() => favMut.mutate(it.id)}
              onImport={() => importMut.mutate(it.id)}
              importing={importMut.isPending && importMut.variables === it.id}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function ProductCard({ item, onFav, onImport, importing }: { item: CatalogItem; onFav: () => void; onImport: () => void; importing: boolean }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/60 backdrop-blur transition hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--primary)]">
      {item.featured && (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground shadow">
          <Sparkles className="h-3 w-3" /> Destaque
        </div>
      )}
      <button
        onClick={onFav}
        aria-label="Favoritar"
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition ${
          item.is_favorite ? "border-rose-500/60 bg-rose-500/20 text-rose-400" : "border-white/10 bg-black/40 text-white hover:border-rose-500/40 hover:text-rose-400"
        }`}
      >
        <Heart className={`h-4 w-4 ${item.is_favorite ? "fill-current" : ""}`} />
      </button>

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><LayoutGrid className="h-10 w-10" /></div>
        )}
        <div className="absolute bottom-2 left-3 flex flex-wrap gap-1">
          <TrendBadge trend={item.trend} />
          <DifficultyBadge difficulty={item.difficulty} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug">{item.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-xs text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" /> {item.rating.toFixed(1)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{item.category}</span>
          {item.niche && <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{item.niche}</span>}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Custo origem</div>
            <div className="mt-0.5 text-sm font-bold">{item.origin_currency} {Number(item.origin_price).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Venda sugerida</div>
            <div className="mt-0.5 text-sm font-bold text-primary">R$ {Number(item.suggested_price_brl).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Margem</div>
            <div className="mt-0.5 text-sm font-bold text-emerald-400">{Number(item.margin_pct).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Buscas/mês</div>
            <div className="mt-0.5 text-sm font-bold">{formatCompact(item.monthly_searches)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {item.supplier_url && (
            <a
              href={item.supplier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {item.supplier_platform ?? "Fornecedor"}
            </a>
          )}
          <button
            onClick={onImport}
            disabled={importing}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            {importing ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>
    </article>
  );
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

function TrendBadge({ trend }: { trend: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    alta: { icon: <TrendingUp className="h-3 w-3" />, cls: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300", label: "Em alta" },
    baixa: { icon: <TrendingDown className="h-3 w-3" />, cls: "border-rose-500/40 bg-rose-500/20 text-rose-300", label: "Em queda" },
    estavel: { icon: <Minus className="h-3 w-3" />, cls: "border-white/20 bg-black/40 text-white/80", label: "Estável" },
  };
  const t = map[trend] ?? map.estavel;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur ${t.cls}`}>{t.icon} {t.label}</span>;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    facil: { cls: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300", label: "Fácil" },
    medio: { cls: "border-amber-500/40 bg-amber-500/20 text-amber-300", label: "Médio" },
    dificil: { cls: "border-rose-500/40 bg-rose-500/20 text-rose-300", label: "Difícil" },
  };
  const d = map[difficulty] ?? map.medio;
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur ${d.cls}`}>{d.label}</span>;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
