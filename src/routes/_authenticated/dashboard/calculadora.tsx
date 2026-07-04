import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getExchangeRates } from "@/lib/exchange.functions";

export const Route = createFileRoute("/_authenticated/dashboard/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora de Impostos · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CalcPage,
});

// ICMS aproximado por estado (referência comum p/ importação — verificar sempre)
const ICMS: Record<string, number> = {
  AC: 19, AL: 19, AP: 18, AM: 20, BA: 20.5, CE: 20, DF: 20, ES: 17, GO: 19, MA: 22, MT: 17,
  MS: 17, MG: 18, PA: 19, PB: 20, PR: 19.5, PE: 20.5, PI: 21, RJ: 22, RN: 18, RS: 17, RO: 19.5,
  RR: 20, SC: 17, SP: 18, SE: 22, TO: 20,
};

function CalcPage() {
  const fetchRates = useServerFn(getExchangeRates);
  const { data: rates } = useQuery({ queryKey: ["exchange"], queryFn: () => fetchRates(), staleTime: 4 * 60 * 1000 });

  const [price, setPrice] = useState("100");
  const [freight, setFreight] = useState("30");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "CNY" | "BRL">("USD");
  const [state, setState] = useState("SP");
  const [ii, setIi] = useState("60");
  const [correios, setCorreios] = useState("15");

  const rate = currency === "BRL" ? 1 : rates?.[currency] ?? 0;
  const result = useMemo(() => {
    const p = Number(price) || 0;
    const f = Number(freight) || 0;
    const iiPct = Number(ii) / 100;
    const icmsPct = (ICMS[state] ?? 18) / 100;
    const cor = Number(correios) || 0;

    const productBRL = p * rate;
    const freightBRL = f * rate;
    const cif = productBRL + freightBRL;
    const iiValue = cif * iiPct;
    // ICMS na importação: base = (CIF + II) / (1 - icms%)
    const icmsBase = (cif + iiValue) / (1 - icmsPct);
    const icmsValue = icmsBase * icmsPct;
    const total = cif + iiValue + icmsValue + cor;

    return { productBRL, freightBRL, cif, iiValue, icmsValue, cor, total };
  }, [price, freight, rate, ii, state, correios]);

  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <DashboardShell breadcrumb="Calculadora" title="Calculadora de Impostos">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-white/5 bg-card/60 p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Calculator className="h-4 w-4 text-primary" /> Dados do produto</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Preço do produto"><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" /></Field>
            <Field label="Moeda">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className="input">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="CNY">CNY</option><option value="BRL">BRL</option>
              </select>
            </Field>
            <Field label="Frete (mesma moeda)"><input type="number" step="0.01" value={freight} onChange={(e) => setFreight(e.target.value)} className="input" /></Field>
            <Field label="Estado (ICMS)">
              <select value={state} onChange={(e) => setState(e.target.value)} className="input">
                {Object.keys(ICMS).map((s) => <option key={s} value={s}>{s} — {ICMS[s]}%</option>)}
              </select>
            </Field>
            <Field label="Imposto de Importação (%)"><input type="number" step="0.1" value={ii} onChange={(e) => setIi(e.target.value)} className="input" /></Field>
            <Field label="Taxa Correios (BRL)"><input type="number" step="0.01" value={correios} onChange={(e) => setCorreios(e.target.value)} className="input" /></Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Câmbio {currency}/BRL: <strong>{rate.toFixed(4)}</strong> {rates?.stale ? "(offline)" : "(ao vivo)"}
          </p>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <h2 className="font-semibold">Resultado</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Produto convertido" value={fmt(result.productBRL)} />
            <Row label="Frete convertido" value={fmt(result.freightBRL)} />
            <Row label="CIF (produto + frete)" value={fmt(result.cif)} />
            <Row label={`Imposto de Importação (${ii}%)`} value={fmt(result.iiValue)} />
            <Row label={`ICMS ${state} (${ICMS[state]}%)`} value={fmt(result.icmsValue)} />
            <Row label="Taxa Correios" value={fmt(result.cor)} />
          </div>
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Custo final</div>
            <div className="mt-1 font-display text-4xl font-bold text-primary">{fmt(result.total)}</div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Cálculo referencial. Verifique alíquotas específicas do produto e regime tributário aplicável.
          </p>
        </section>
      </div>
      <style>{`.input{width:100%;height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.2);padding:0 12px;font-size:14px;outline:none}`}</style>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-white/5 py-1.5"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
