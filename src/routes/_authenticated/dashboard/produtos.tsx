import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, Loader2, RefreshCw, Link as LinkIcon, Package, Tag, Building2,
  Star, Shield, ShieldAlert, AlertTriangle, DollarSign, ImageIcon, Play, Info,
  CheckCircle2, XCircle, Boxes, Truck, Sparkles, Globe, User, MapPin, Award,
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { analyzeListing, NOT_FOUND, type ListingAnalysis } from "@/lib/listing-analysis.functions";

export const Route = createFileRoute("/_authenticated/dashboard/produtos")({
  head: () => ({
    meta: [
      { title: "Gestão de Produtos · ImportPro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProdutosPage,
});

const EXAMPLES = [
  "https://item.taobao.com/item.htm?id=...",
  "https://detail.1688.com/offer/...",
  "https://www.goofish.com/item?id=...",
  "https://www.aliexpress.com/item/...",
];

function isMissing(v: string) {
  return !v || v === NOT_FOUND;
}

function Field({ label, value, icon }: { label: string; value: string | number | null; icon?: React.ReactNode }) {
  const display = value == null || value === "" ? NOT_FOUND : String(value);
  const missing = typeof value === "string" ? isMissing(value) : value == null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`text-sm ${missing ? "italic text-muted-foreground/70" : "text-foreground font-medium"}`}>
        {display}
      </span>
    </div>
  );
}

function Chip({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warn" | "danger" }) {
  const cls = {
    default: "bg-muted text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    danger: "bg-red-500/10 text-red-500 border-red-500/30",
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function ProdutosPage() {
  const fetchAnalysis = useServerFn(analyzeListing);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ListingAnalysis | null>(null);

  const mut = useMutation({
    mutationFn: (payload: { url: string; refresh: boolean }) =>
      fetchAnalysis({ data: payload }) as Promise<ListingAnalysis>,
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.meta.cached ? "Análise em cache atualizada" : "Anúncio analisado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (refresh = false) => {
    if (url.trim().length < 8) {
      toast.error("Cole a URL completa do anúncio");
      return;
    }
    mut.mutate({ url: url.trim(), refresh });
  };

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Diagnóstico de Anúncios</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Analise anúncios reais de Goofish, 1688, Taobao, Tmall, Alibaba, JD, Pinduoduo, AliExpress,
            Weidian, DHGate, Made-in-China e Global Sources. O sistema abre a página em navegador
            headless real (via ScraperService) e extrai apenas dados verdadeiros do anúncio.
          </p>
        </header>

        {/* Input */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5" />
            URL do anúncio
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(false)}
              placeholder="https://item.taobao.com/item.htm?id=..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={mut.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analisar
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">Exemplos:</span>
            {EXAMPLES.map((e) => (
              <code key={e} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {e}
              </code>
            ))}
          </div>
        </div>

        {/* Loading */}
        {mut.isPending && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Identificando plataforma, lendo o anúncio e validando dados…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Passos: identificar → carregar → extrair → validar → traduzir → converter câmbio → analisar vendedor → gerar score
            </p>
          </div>
        )}

        {/* Result */}
        {result && !mut.isPending && <AnalysisResult data={result} onRefresh={() => submit(true)} />}
      </div>
    </DashboardShell>
  );
}

function AnalysisResult({ data, onRefresh }: { data: ListingAnalysis; onRefresh: () => void }) {
  const scoreColor =
    data.trust.score >= 80 ? "text-emerald-500" : data.trust.score >= 50 ? "text-amber-500" : "text-red-500";
  const scoreLabel =
    data.trust.score >= 80 ? "Alta Confiabilidade" : data.trust.score >= 50 ? "Média Confiabilidade" : "Baixa / Alto Risco";

  return (
    <div className="space-y-6">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="default">
            <Globe className="h-3 w-3" /> {data.source.platform_label}
          </Chip>
          <Chip variant={data.source.fetched_ok ? "success" : "warn"}>
            {data.source.fetched_ok ? "Página carregada" : "Análise por texto colado"}
          </Chip>
          {data.meta.cached && <Chip variant="default">Cache · câmbio atualizado</Chip>}
          {data.source.url && (
            <a href={data.source.url} target="_blank" rel="noreferrer noopener" className="text-xs text-primary underline">
              Abrir anúncio original
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reanalisar
        </button>
      </div>

      {data.meta.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600">
          {data.meta.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Produto + Imagens */}
      <ProductImages images={data.images} />



        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Produto</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome original" value={data.product.name_original} />
              <Field label="Nome traduzido (PT-BR)" value={data.product.name_translated} />
              <Field label="Categoria" value={data.product.category} icon={<Tag className="h-3 w-3" />} />
              <Field label="Marca" value={data.product.brand} />
              <Field label="Modelo" value={data.product.model} />
              <Field label="Estoque" value={data.product.stock_status} />
              <Field label="Pedido mínimo (MOQ)" value={data.product.moq} />
            </div>
            {!isMissing(data.product.description) && (
              <div className="mt-4 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">Descrição</span>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{data.product.description}</p>
              </div>
            )}
            {data.product.variations.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">Variações</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.product.variations.map((v, i) => <Chip key={i}>{v}</Chip>)}
                </div>
              </div>
            )}
            {data.product.keywords.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">Palavras-chave / SKU / EAN</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.product.keywords.map((k, i) => <Chip key={i}>{k}</Chip>)}
                </div>
              </div>
            )}
          </div>

          {data.product.specs.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Especificações técnicas</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.product.specs.map((s, i) => (
                  <div key={i} className="flex justify-between gap-4 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{s.key}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preço */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Preço e câmbio em tempo real</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground">Valor original</span>
            <p className="mt-1 text-2xl font-bold">
              {data.price.original_value != null
                ? `${data.price.original_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${data.price.original_currency}`
                : NOT_FOUND}
            </p>
            {!isMissing(data.price.original_display) && (
              <p className="mt-1 text-xs text-muted-foreground">Exibido no anúncio: {data.price.original_display}</p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground">Cotação atual</span>
            <p className="mt-1 text-lg font-semibold">
              {data.price.exchange_rate != null && data.price.original_currency !== NOT_FOUND
                ? `1 ${data.price.original_currency} = R$ ${data.price.exchange_rate.toFixed(4).replace(".", ",")}`
                : NOT_FOUND}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Fonte: {data.price.exchange_source}</p>
          </div>
          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
            <span className="text-xs text-primary">Convertido para BRL</span>
            <p className="mt-1 text-2xl font-bold text-primary">{data.price.converted_display}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Faixa de preço" value={data.price.price_range} />
          <Field label="Preço atacado" value={data.price.wholesale} />
          <Field label="Preço promocional" value={data.price.promotional} />
          <Field label="Histórico" value={data.price.history} />
        </div>
      </div>

      {/* Vendedor + Reputação */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Vendedor / Loja</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Loja" value={data.seller.store} icon={<Building2 className="h-3 w-3" />} />
            <Field label="Vendedor" value={data.seller.name} icon={<User className="h-3 w-3" />} />
            <Field label="Localização" value={data.seller.location} icon={<MapPin className="h-3 w-3" />} />
            <Field label="Tempo de atuação" value={data.seller.years_active} />
            <Field label="Tipo" value={data.seller.type} />
            <Field label="Reputação" value={data.seller.reputation} icon={<Award className="h-3 w-3" />} />
          </div>
          {data.seller.certifications.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <span className="text-xs font-medium text-muted-foreground">Certificações</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {data.seller.certifications.map((c, i) => <Chip key={i} variant="success">{c}</Chip>)}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Avaliações</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Total" value={data.reviews.total} />
            <Field label="Média" value={data.reviews.average} />
            <Field label="% positivas" value={data.reviews.positive_pct} />
          </div>
          {data.reviews.highlights.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <span className="text-xs font-medium text-emerald-600">Pontos positivos</span>
              <ul className="mt-1 space-y-1 text-sm">
                {data.reviews.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.reviews.complaints.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <span className="text-xs font-medium text-red-600">Problemas recorrentes</span>
              <ul className="mt-1 space-y-1 text-sm">
                {data.reviews.complaints.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Score de confiabilidade */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Score de Confiabilidade</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-bold ${scoreColor}`}>{data.trust.score}<span className="text-xl">/100</span></div>
            <p className={`mt-1 text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
            {!isMissing(data.trust.label) && <p className="mt-0.5 text-xs text-muted-foreground">{data.trust.label}</p>}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-emerald-600">A favor</span>
              {data.trust.positives.length === 0 ? (
                <p className="mt-1 text-xs italic text-muted-foreground">Sem evidências positivas identificadas.</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-sm">
                  {data.trust.positives.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-red-600">Contra</span>
              {data.trust.negatives.length === 0 ? (
                <p className="mt-1 text-xs italic text-muted-foreground">Sem evidências negativas identificadas.</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-sm">
                  {data.trust.negatives.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" /> {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {data.trust.risk_alerts.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
              <ShieldAlert className="h-4 w-4" /> Alertas de risco / possíveis golpes
            </div>
            <ul className="space-y-0.5 text-sm text-red-700 dark:text-red-400">
              {data.trust.risk_alerts.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Importação */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Análise de importação</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Peso estimado" value={data.import.estimated_weight_kg} />
          <Field label="Volume estimado" value={data.import.estimated_volume} />
          <Field label="Categoria fiscal" value={data.import.tax_category} />
          <Field label="Risco de tributação" value={data.import.tax_risk} />
          <Field label="Frete estimado" value={data.import.shipping_estimate} />
          <Field label="Viabilidade" value={data.import.viability} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Info className="mr-1 inline h-3 w-3" />
        Todos os campos são extraídos exclusivamente do anúncio enviado. Ausência de dado é sinalizada como
        "{NOT_FOUND}".
      </p>
    </div>
  );
}
