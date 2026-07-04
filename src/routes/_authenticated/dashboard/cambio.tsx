import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getExchangeRates } from "@/lib/exchange.functions";

export const Route = createFileRoute("/_authenticated/dashboard/cambio")({
  head: () => ({ meta: [{ title: "Câmbio ao vivo · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CambioPage,
});

function CambioPage() {
  const fetchRates = useServerFn(getExchangeRates);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["exchange"],
    queryFn: () => fetchRates(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<"USD" | "EUR" | "CNY">("USD");
  const rate = data?.[from] ?? 0;
  const converted = (Number(amount) || 0) * rate;

  const fmt = (n: number, currency = "BRL") => new Intl.NumberFormat("pt-BR", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);

  return (
    <DashboardShell breadcrumb="Câmbio" title="Câmbio ao vivo">
      <section className="grid gap-4 md:grid-cols-3">
        {(["USD","EUR","CNY"] as const).map((c) => (
          <div key={c} className="rounded-2xl border border-white/5 bg-card/60 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c} / BRL</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 }).format(data?.[c] ?? 0)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{data?.updatedAt ?? "..."}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/5 bg-card/60 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Conversor</h2>
          <button onClick={() => refetch()} disabled={isFetching} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium hover:border-primary/40">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching?"animate-spin":""}`} /> Atualizar
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 outline-none" />
          <select value={from} onChange={(e) => setFrom(e.target.value as typeof from)} className="h-11 rounded-lg border border-white/10 bg-black/20 px-3">
            <option value="USD">USD</option><option value="EUR">EUR</option><option value="CNY">CNY</option>
          </select>
          <div className="flex items-center rounded-lg border border-primary/30 bg-primary/10 px-4">
            <span className="text-xs text-muted-foreground">=</span>
            <span className="ml-3 font-display text-2xl font-bold text-primary">{fmt(converted)}</span>
          </div>
        </div>
        {data?.stale && (
          <p className="mt-3 text-xs text-amber-400">Fonte de câmbio indisponível — usando última cotação em cache.</p>
        )}
      </section>
    </DashboardShell>
  );
}
