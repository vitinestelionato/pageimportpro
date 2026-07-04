import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator, TrendingUp, LineChart as LineChartIcon, PieChart as PieChartIcon,
  Save, Trash2, Wallet, Coins, Package, Truck, Landmark, ShoppingCart,
  Percent, Target, Sparkles, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { calculate, brl, pct, DEFAULT_INPUTS, type PricingInputs, type Scenario } from "@/lib/pricing";
import { usePricingScenarios } from "@/hooks/usePricingScenarios";

export const Route = createFileRoute("/_authenticated/dashboard/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro & Precificação · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FinanceiroPage,
});

type TabKey = "dashboard" | "calculadora" | "simulador" | "cenarios";

const TABS: { id: TabKey; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LineChartIcon className="h-4 w-4" /> },
  { id: "calculadora", label: "Calculadora", icon: <Calculator className="h-4 w-4" /> },
  { id: "simulador", label: "Simulador", icon: <Sparkles className="h-4 w-4" /> },
  { id: "cenarios", label: "Cenários", icon: <Target className="h-4 w-4" /> },
];

function FinanceiroPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [inputs, setInputs] = useState<PricingInputs>(DEFAULT_INPUTS);
  const results = useMemo(() => calculate(inputs), [inputs]);
  const scenarios = usePricingScenarios();

  const update = <K extends keyof PricingInputs>(k: K, v: PricingInputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  return (
    <DashboardShell breadcrumb="Financeiro" title="Financeiro & Precificação">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/5 bg-card/40 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab results={results} inputs={inputs} scenarios={scenarios.items} />}
      {tab === "calculadora" && <CalculatorTab inputs={inputs} update={update} results={results} onSave={(n, t) => { scenarios.save(n, t, inputs); toast.success("Cenário salvo"); }} />}
      {tab === "simulador" && <SimulatorTab inputs={inputs} update={update} results={results} onReset={() => setInputs(DEFAULT_INPUTS)} />}
      {tab === "cenarios" && <ScenariosTab scenarios={scenarios.items} onDelete={(id) => { scenarios.remove(id); toast.success("Cenário removido"); }} onLoad={(s) => { setInputs(s.inputs); setTab("calculadora"); toast.success(`Cenário "${s.name}" carregado`); }} />}
    </DashboardShell>
  );
}

/* ============================================================== DASHBOARD */

function DashboardTab({ results, inputs, scenarios }: { results: ReturnType<typeof calculate>; inputs: PricingInputs; scenarios: Scenario[] }) {
  const costBreakdown = [
    { name: "Produto", value: results.productCostBRL, color: "oklch(0.65 0.19 255)" },
    { name: "Logística", value: results.logisticsTotal, color: "oklch(0.7 0.18 200)" },
    { name: "Impostos", value: results.iofBRL + results.importTaxBRL + results.ipiBRL + results.pisCofinsBRL, color: "oklch(0.7 0.2 30)" },
    { name: "Fixos/Op.", value: results.fixedTotal, color: "oklch(0.75 0.15 90)" },
    { name: "Taxas Venda", value: results.saleFeesTotal, color: "oklch(0.65 0.2 340)" },
  ].filter((x) => x.value > 0);

  const scenarioSeries = scenarios.slice(0, 8).reverse().map((s) => {
    const r = calculate(s.inputs);
    return {
      name: s.name.length > 12 ? s.name.slice(0, 10) + "…" : s.name,
      lucro: Math.round(r.netProfitTotal),
      custo: Math.round(r.landedCostTotal),
      margem: Number(r.netMarginPct.toFixed(1)),
    };
  });

  return (
    <div className="mt-6 space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={<Wallet />} label="Investimento Total" value={brl(results.landedCostTotal)} tone="primary" hint={`${inputs.quantity} unidades`} />
        <KPICard icon={<Coins />} label="Lucro Líquido" value={brl(results.netProfitTotal)} tone={results.netProfitTotal >= 0 ? "emerald" : "rose"} hint={brl(results.netProfitUnit) + " / un"} />
        <KPICard icon={<Percent />} label="Margem Líquida" value={pct(results.netMarginPct)} tone={results.netMarginPct >= 20 ? "emerald" : results.netMarginPct >= 10 ? "amber" : "rose"} hint={`Markup ${pct(results.markupPct)}`} />
        <KPICard icon={<TrendingUp />} label="ROI" value={pct(results.roiPct)} tone={results.roiPct >= 30 ? "emerald" : "amber"} hint={`Preço rec. ${brl(results.recommendedPrice)}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Custo Unitário (posto BR)" value={brl(results.landedCostUnit)} icon={<Package className="h-3.5 w-3.5" />} />
        <MiniStat label="Preço Mínimo (breakeven)" value={brl(results.minimumPrice)} icon={<Target className="h-3.5 w-3.5" />} />
        <MiniStat label="Ticket Médio (venda un.)" value={brl(results.effectiveSalePrice)} icon={<ShoppingCart className="h-3.5 w-3.5" />} />
        <MiniStat label="Impostos Totais" value={brl(results.iofBRL + results.importTaxBRL + results.ipiBRL + results.pisCofinsBRL)} icon={<Landmark className="h-3.5 w-3.5" />} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Composição dos custos" icon={<PieChartIcon className="h-4 w-4 text-primary" />}>
          {costBreakdown.length === 0 ? (
            <EmptyMini msg="Preencha a calculadora para ver a distribuição" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {costBreakdown.map((c) => (<Cell key={c.name} fill={c.color} />))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Comparativo de cenários salvos" icon={<LineChartIcon className="h-4 w-4 text-primary" />}>
          {scenarioSeries.length === 0 ? (
            <EmptyMini msg="Salve cenários na calculadora para comparar aqui" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={scenarioSeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
                  <RTooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => brl(v)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="lucro" name="Lucro" fill="oklch(0.7 0.19 155)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="custo" name="Custo" fill="oklch(0.65 0.19 255)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Evolução da margem por cenário" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
        {scenarioSeries.length < 2 ? (
          <EmptyMini msg="É necessário pelo menos 2 cenários salvos" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={scenarioSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <RTooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="margem" name="Margem Líquida" stroke="oklch(0.72 0.19 240)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Alerts */}
      <AlertsPanel results={results} />
    </div>
  );
}

/* =============================================================== CALCULATOR */

function CalculatorTab({ inputs, update, results, onSave }: {
  inputs: PricingInputs;
  update: <K extends keyof PricingInputs>(k: K, v: PricingInputs[K]) => void;
  results: ReturnType<typeof calculate>;
  onSave: (name: string, tag: Scenario["tag"]) => void;
}) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState<Scenario["tag"]>("realista");

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Panel title="Produto e câmbio" icon={<Package className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Custo unitário (origem)" value={inputs.productCost} onChange={(v) => update("productCost", v)} suffix={inputs.currency} />
            <NumField label="Quantidade" value={inputs.quantity} onChange={(v) => update("quantity", v)} min={1} step={1} />
            <TextField label="Moeda de origem" value={inputs.currency} onChange={(v) => update("currency", v.toUpperCase().slice(0, 4))} />
            <NumField label="Câmbio (1 = R$)" value={inputs.exchangeRate} onChange={(v) => update("exchangeRate", v)} step={0.01} />
          </div>
        </Panel>

        <Panel title="Logística" icon={<Truck className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumField label="Frete internacional (BRL)" value={inputs.internationalShipping} onChange={(v) => update("internationalShipping", v)} />
            <NumField label="Frete nacional (BRL)" value={inputs.domesticShipping} onChange={(v) => update("domesticShipping", v)} />
            <NumField label="Seguro (BRL)" value={inputs.insurance} onChange={(v) => update("insurance", v)} />
          </div>
        </Panel>

        <Panel title="Impostos (%)" icon={<Landmark className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <NumField label="II" value={inputs.importTaxPct} onChange={(v) => update("importTaxPct", v)} suffix="%" />
            <NumField label="ICMS" value={inputs.icmsPct} onChange={(v) => update("icmsPct", v)} suffix="%" />
            <NumField label="IPI" value={inputs.ipiPct} onChange={(v) => update("ipiPct", v)} suffix="%" />
            <NumField label="PIS/COFINS" value={inputs.pisCofinsPct} onChange={(v) => update("pisCofinsPct", v)} suffix="%" />
            <NumField label="IOF" value={inputs.iofPct} onChange={(v) => update("iofPct", v)} suffix="%" />
          </div>
        </Panel>

        <Panel title="Taxas de venda (%)" icon={<Percent className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-4">
            <NumField label="Plataforma" value={inputs.platformFeePct} onChange={(v) => update("platformFeePct", v)} suffix="%" />
            <NumField label="Pagamento" value={inputs.paymentFeePct} onChange={(v) => update("paymentFeePct", v)} suffix="%" />
            <NumField label="Comissão" value={inputs.commissionPct} onChange={(v) => update("commissionPct", v)} suffix="%" />
            <NumField label="Marketing" value={inputs.marketingPct} onChange={(v) => update("marketingPct", v)} suffix="%" />
          </div>
        </Panel>

        <Panel title="Custos fixos por unidade (BRL)" icon={<Coins className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-4">
            <NumField label="Embalagem" value={inputs.packaging} onChange={(v) => update("packaging", v)} />
            <NumField label="Armazenagem" value={inputs.storage} onChange={(v) => update("storage", v)} />
            <NumField label="Operacional" value={inputs.operational} onChange={(v) => update("operational", v)} />
            <NumField label="Extras" value={inputs.extra} onChange={(v) => update("extra", v)} />
          </div>
        </Panel>

        <Panel title="Objetivo de venda" icon={<Target className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumField label="Margem líquida desejada" value={inputs.targetMarginPct} onChange={(v) => update("targetMarginPct", v)} suffix="%" />
            <NumField label="Preço de venda manual (opcional)" value={inputs.salePrice} onChange={(v) => update("salePrice", v)} hint="0 = usar preço recomendado" />
          </div>
        </Panel>
      </div>

      {/* Sticky results */}
      <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <ResultsPanel results={results} />

        <Panel title="Salvar como cenário" icon={<Save className="h-4 w-4 text-primary" />}>
          <div className="space-y-3">
            <TextField label="Nome do cenário" value={name} onChange={setName} placeholder="Ex.: Fone Bluetooth — realista" />
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipo</label>
              <div className="grid grid-cols-3 gap-1">
                {(["otimista", "realista", "conservador"] as const).map((t) => (
                  <button key={t} onClick={() => setTag(t)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize transition ${
                      tag === t ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-black/20 text-muted-foreground hover:text-foreground"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { onSave(name, tag); setName(""); }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" /> Salvar cenário
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =============================================================== SIMULATOR */

function SimulatorTab({ inputs, update, results, onReset }: {
  inputs: PricingInputs;
  update: <K extends keyof PricingInputs>(k: K, v: PricingInputs[K]) => void;
  results: ReturnType<typeof calculate>;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Panel title="Ajuste rápido em tempo real" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <div className="space-y-5">
          <Slider label="Preço de venda" value={inputs.salePrice || results.recommendedPrice} min={results.landedCostUnit * 0.9} max={results.landedCostUnit * 5}
            step={1} format={brl} onChange={(v) => update("salePrice", v)} />
          <Slider label="Câmbio" value={inputs.exchangeRate} min={0.1} max={10} step={0.01} format={(v) => `R$ ${v.toFixed(2)}`} onChange={(v) => update("exchangeRate", v)} />
          <Slider label="Margem desejada" value={inputs.targetMarginPct} min={0} max={80} step={1} format={(v) => `${v.toFixed(0)}%`} onChange={(v) => update("targetMarginPct", v)} />
          <Slider label="Frete internacional" value={inputs.internationalShipping} min={0} max={2000} step={5} format={brl} onChange={(v) => update("internationalShipping", v)} />
          <Slider label="Impostos totais (II)" value={inputs.importTaxPct} min={0} max={100} step={1} format={(v) => `${v.toFixed(0)}%`} onChange={(v) => update("importTaxPct", v)} />
          <Slider label="Quantidade" value={inputs.quantity} min={1} max={500} step={1} format={(v) => `${v.toFixed(0)} un`} onChange={(v) => update("quantity", v)} />

          <button onClick={onReset} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 text-xs font-semibold text-muted-foreground hover:text-foreground">
            Restaurar valores padrão
          </button>
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <BigKpi label="Lucro Líquido Total" value={brl(results.netProfitTotal)} positive={results.netProfitTotal >= 0} />
          <BigKpi label="Margem Líquida" value={pct(results.netMarginPct)} positive={results.netMarginPct >= 15} />
          <BigKpi label="ROI" value={pct(results.roiPct)} positive={results.roiPct >= 25} />
          <BigKpi label="Rentabilidade / un" value={brl(results.netProfitUnit)} positive={results.netProfitUnit >= 0} />
        </div>
        <ResultsPanel results={results} compact />
      </div>
    </div>
  );
}

/* =============================================================== SCENARIOS */

function ScenariosTab({ scenarios, onDelete, onLoad }: { scenarios: Scenario[]; onDelete: (id: string) => void; onLoad: (s: Scenario) => void }) {
  if (scenarios.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-card/30 p-12 text-center">
        <Target className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 font-display text-lg font-bold">Nenhum cenário salvo</h3>
        <p className="mt-1 text-sm text-muted-foreground">Vá na Calculadora, ajuste os valores e clique em "Salvar cenário" para comparar aqui.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-black/30 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3 text-right">Custo total</th>
            <th className="px-4 py-3 text-right">Lucro</th>
            <th className="px-4 py-3 text-right">Margem</th>
            <th className="px-4 py-3 text-right">ROI</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const r = calculate(s.inputs);
            const tone = s.tag === "otimista" ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
              : s.tag === "conservador" ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
              : s.tag === "realista" ? "text-sky-300 border-sky-500/40 bg-sky-500/10"
              : "text-muted-foreground border-white/10 bg-white/5";
            return (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleString("pt-BR")}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase capitalize ${tone}`}>{s.tag}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{brl(r.landedCostTotal)}</td>
                <td className={`px-4 py-3 text-right font-mono font-bold ${r.netProfitTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{brl(r.netProfitTotal)}</td>
                <td className="px-4 py-3 text-right font-mono">{pct(r.netMarginPct)}</td>
                <td className="px-4 py-3 text-right font-mono">{pct(r.roiPct)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onLoad(s)} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-semibold hover:border-primary/40 hover:text-primary">Carregar</button>
                    <button onClick={() => onDelete(s.id)} className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300 hover:bg-rose-500/20"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================== SUB-COMPONENTS */

function ResultsPanel({ results, compact = false }: { results: ReturnType<typeof calculate>; compact?: boolean }) {
  return (
    <Panel title="Resultado em tempo real" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
      <div className="space-y-3">
        <ResultRow label="Custo unitário posto BR" value={brl(results.landedCostUnit)} />
        <ResultRow label="Custo total do lote" value={brl(results.landedCostTotal)} bold />
        <div className="h-px bg-white/5" />
        <ResultRow label="Preço mínimo (breakeven)" value={brl(results.minimumPrice)} tone="amber" />
        <ResultRow label="Preço recomendado" value={brl(results.recommendedPrice)} tone="primary" bold />
        <ResultRow label="Preço praticado" value={brl(results.effectiveSalePrice)} />
        <div className="h-px bg-white/5" />
        <ResultRow label="Lucro por unidade" value={brl(results.netProfitUnit)} tone={results.netProfitUnit >= 0 ? "emerald" : "rose"} />
        <ResultRow label="Lucro total" value={brl(results.netProfitTotal)} tone={results.netProfitTotal >= 0 ? "emerald" : "rose"} bold />
        {!compact && (
          <>
            <div className="h-px bg-white/5" />
            <ResultRow label="Margem bruta" value={pct(results.grossMarginPct)} />
            <ResultRow label="Margem líquida" value={pct(results.netMarginPct)} tone={results.netMarginPct >= 15 ? "emerald" : "amber"} />
            <ResultRow label="Markup" value={pct(results.markupPct)} />
            <ResultRow label="ROI" value={pct(results.roiPct)} tone={results.roiPct >= 25 ? "emerald" : "amber"} />
          </>
        )}
      </div>
    </Panel>
  );
}

function AlertsPanel({ results }: { results: ReturnType<typeof calculate> }) {
  const alerts: { level: "danger" | "warn" | "ok"; msg: string }[] = [];
  if (results.netProfitTotal < 0) alerts.push({ level: "danger", msg: "Operação gerando PREJUÍZO no preço atual — reveja custos ou aumente o preço." });
  if (results.netMarginPct < 10 && results.netProfitTotal >= 0) alerts.push({ level: "warn", msg: `Margem líquida baixa (${pct(results.netMarginPct)}). Considere renegociar o custo ou frete.` });
  if (results.roiPct < 20 && results.roiPct >= 0) alerts.push({ level: "warn", msg: `ROI abaixo de 20% (${pct(results.roiPct)}) — capital demorará a retornar.` });
  if (results.effectiveSalePrice < results.minimumPrice) alerts.push({ level: "danger", msg: "Preço praticado abaixo do ponto de equilíbrio." });
  if (alerts.length === 0) alerts.push({ level: "ok", msg: "Nenhum alerta financeiro — margens e ROI dentro do saudável." });

  return (
    <Panel title="Alertas inteligentes" icon={<Sparkles className="h-4 w-4 text-primary" />}>
      <ul className="space-y-2">
        {alerts.map((a, i) => {
          const cls = a.level === "danger" ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
            : a.level === "warn" ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
          return <li key={i} className={`rounded-lg border px-3 py-2 text-xs ${cls}`}>{a.msg}</li>;
        })}
      </ul>
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
      <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {icon}{title}
      </h3>
      {children}
    </section>
  );
}

function KPICard({ icon, label, value, tone, hint }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "emerald" | "amber" | "rose"; hint?: string }) {
  const iconCls = tone === "emerald" ? "bg-emerald-500/15 text-emerald-300"
    : tone === "amber" ? "bg-amber-500/15 text-amber-300"
    : tone === "rose" ? "bg-rose-500/15 text-rose-300"
    : "bg-primary/15 text-primary";
  return (
    <div className="rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconCls}`}>{icon}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

function BigKpi({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${positive ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
        {positive ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${positive ? "text-emerald-300" : "text-rose-300"}`}>{value}</div>
    </div>
  );
}

function ResultRow({ label, value, tone, bold }: { label: string; value: string; tone?: "primary" | "emerald" | "rose" | "amber"; bold?: boolean }) {
  const cls = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : tone === "amber" ? "text-amber-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${bold ? "text-base font-bold" : ""} ${cls}`}>{value}</span>
    </div>
  );
}

function NumField({ label, value, onChange, suffix, hint, min = 0, step }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; hint?: string; min?: number; step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        step={step ?? "any"}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 font-mono text-sm outline-none focus:border-primary"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-sm font-bold text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function EmptyMini({ msg }: { msg: string }) {
  return <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">{msg}</div>;
}
