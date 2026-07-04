import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DollarSign, RefreshCw, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  getExchangeRates,
  refreshExchangeRates,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  type ExchangeRates,
} from "@/lib/exchange.functions";

export const Route = createFileRoute("/_authenticated/dashboard/cambio")({
  head: () => ({ meta: [{ title: "Câmbio ao vivo · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CambioPage,
});

const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: "Dólar americano",
  EUR: "Euro",
  CNY: "Yuan chinês",
  GBP: "Libra esterlina",
  JPY: "Iene japonês",
  ARS: "Peso argentino",
  CAD: "Dólar canadense",
  AUD: "Dólar australiano",
  HKD: "Dólar de Hong Kong",
  CHF: "Franco suíço",
  MXN: "Peso mexicano",
  KRW: "Won sul-coreano",
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  google_finance: { label: "Google Finance", color: "text-emerald-400" },
  awesomeapi: { label: "AwesomeAPI", color: "text-sky-400" },
  fallback: { label: "Cache local", color: "text-amber-400" },
  mixed: { label: "Múltiplas fontes", color: "text-sky-400" },
};

function formatWhen(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(d);
}

function CambioPage() {
  const qc = useQueryClient();
  const fetchRates = useServerFn(getExchangeRates);
  const refreshRates = useServerFn(refreshExchangeRates);

  const { data, isFetching } = useQuery({
    queryKey: ["exchange"],
    queryFn: () => fetchRates() as Promise<ExchangeRates>,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const refreshMut = useMutation({
    mutationFn: () => refreshRates() as Promise<ExchangeRates>,
    onSuccess: (fresh) => qc.setQueryData(["exchange"], fresh),
  });

  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<SupportedCurrency>("USD");
  const rate = data?.rates?.[from] ?? data?.[from as "USD" | "EUR" | "CNY"] ?? 0;
  const converted = (Number(amount) || 0) * rate;

  const fmtBrl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(n);
  const fmtRate = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 }).format(n);

  const busy = isFetching || refreshMut.isPending;
  const src = SOURCE_LABELS[data?.source ?? "fallback"] ?? SOURCE_LABELS.fallback;

  return (
    <DashboardShell breadcrumb="Câmbio" title="Câmbio ao vivo">
      {/* Barra de status + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1">
            <Clock className="h-3.5 w-3.5" />
            Atualizado: <strong className="font-semibold">{formatWhen(data?.updatedAt)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1">
            <CheckCircle2 className={`h-3.5 w-3.5 ${src.color}`} />
            Fonte: <strong className={`font-semibold ${src.color}`}>{src.label}</strong>
          </span>
          {data?.stale && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Fallback ativo — provedores parcialmente indisponíveis.
            </span>
          )}
        </div>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Atualizar agora
        </button>
      </div>

      {data?.warnings && data.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-400">
          {data.warnings.map((w, i) => <div key={i}>• {w}</div>)}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SUPPORTED_CURRENCIES.map((c) => {
          const value = data?.rates?.[c] ?? 0;
          const pairSrc = data?.perPairSources?.[c];
          const badge = pairSrc ? SOURCE_LABELS[pairSrc] : null;
          return (
            <div key={c} className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c} / BRL</span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">{CURRENCY_LABELS[c]}</p>
                </div>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 font-display text-2xl font-bold">{fmtRate(value)}</div>
              {badge && (
                <div className={`mt-2 text-[10px] font-medium uppercase tracking-wide ${badge.color}`}>
                  {badge.label}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/5 bg-card/60 p-6">
        <h2 className="font-semibold">Conversor</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 outline-none"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as SupportedCurrency)}
            className="h-11 rounded-lg border border-white/10 bg-black/20 px-3"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} — {CURRENCY_LABELS[c]}</option>
            ))}
          </select>
          <div className="flex items-center rounded-lg border border-primary/30 bg-primary/10 px-4">
            <span className="text-xs text-muted-foreground">=</span>
            <span className="ml-3 font-display text-2xl font-bold text-primary">{fmtBrl(converted)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cotação usada: 1 {from} = {fmtRate(rate)}
        </p>
      </section>
    </DashboardShell>
  );
}
