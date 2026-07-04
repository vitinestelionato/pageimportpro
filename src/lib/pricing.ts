// Pricing engine — pure functions. Every calculation is derived from PricingInputs
// so that any UI change reruns instantly and stays consistent across the module.

export type PricingInputs = {
  // Produto
  productCost: number;      // custo do produto na moeda de origem
  quantity: number;
  currency: string;         // ex: CNY, USD
  exchangeRate: number;     // moeda origem -> BRL

  // Logística
  internationalShipping: number; // BRL total
  domesticShipping: number;      // BRL total
  insurance: number;             // BRL total

  // Impostos (%)
  importTaxPct: number;          // II
  icmsPct: number;
  ipiPct: number;
  pisCofinsPct: number;
  iofPct: number;                // sobre câmbio

  // Taxas / operacional (%)
  platformFeePct: number;        // marketplace / plataforma
  paymentFeePct: number;         // gateway
  commissionPct: number;         // afiliado / vendedor
  marketingPct: number;          // % sobre a venda

  // Custos fixos (BRL por unidade)
  packaging: number;
  storage: number;
  operational: number;
  extra: number;

  // Venda
  targetMarginPct: number;       // margem líquida desejada (%)
  salePrice: number;             // preço de venda unitário (BRL); 0 = usa recomendado
};

export type PricingResults = {
  productCostBRL: number;         // total (todos os itens)
  productCostUnitBRL: number;     // unitário
  iofBRL: number;
  importTaxBRL: number;
  ipiBRL: number;
  pisCofinsBRL: number;
  logisticsTotal: number;
  fixedTotal: number;             // packaging + storage + operational + extra (por unidade * qty)
  landedCostTotal: number;        // custo total posto no BR antes de ICMS/venda
  landedCostUnit: number;
  recommendedPrice: number;       // unitário para atingir targetMarginPct
  minimumPrice: number;           // ponto de equilíbrio (lucro = 0)
  effectiveSalePrice: number;     // salePrice > 0 ? salePrice : recommendedPrice
  saleTotal: number;
  saleFeesTotal: number;          // platform + payment + commission + marketing + icms sobre venda
  netProfitUnit: number;
  netProfitTotal: number;
  grossMarginPct: number;
  netMarginPct: number;
  markupPct: number;
  roiPct: number;
};

const n = (v: unknown): number => {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const DEFAULT_INPUTS: PricingInputs = {
  productCost: 100,
  quantity: 10,
  currency: "CNY",
  exchangeRate: 0.78,
  internationalShipping: 250,
  domesticShipping: 45,
  insurance: 20,
  importTaxPct: 60,
  icmsPct: 18,
  ipiPct: 0,
  pisCofinsPct: 0,
  iofPct: 3.5,
  platformFeePct: 12,
  paymentFeePct: 4.99,
  commissionPct: 0,
  marketingPct: 8,
  packaging: 3,
  storage: 1.5,
  operational: 2,
  extra: 0,
  targetMarginPct: 30,
  salePrice: 0,
};

export function calculate(inputRaw: PricingInputs): PricingResults {
  const i = { ...inputRaw };
  const qty = Math.max(1, n(i.quantity));

  const productCostBRL = n(i.productCost) * n(i.exchangeRate) * qty;
  const productCostUnitBRL = productCostBRL / qty;

  const iofBRL = productCostBRL * (n(i.iofPct) / 100);
  const importTaxBRL = productCostBRL * (n(i.importTaxPct) / 100);
  const ipiBRL = (productCostBRL + importTaxBRL) * (n(i.ipiPct) / 100);
  const pisCofinsBRL = productCostBRL * (n(i.pisCofinsPct) / 100);

  const logisticsTotal = n(i.internationalShipping) + n(i.domesticShipping) + n(i.insurance);
  const fixedPerUnit = n(i.packaging) + n(i.storage) + n(i.operational) + n(i.extra);
  const fixedTotal = fixedPerUnit * qty;

  const landedCostTotal =
    productCostBRL + iofBRL + importTaxBRL + ipiBRL + pisCofinsBRL + logisticsTotal + fixedTotal;
  const landedCostUnit = landedCostTotal / qty;

  // % que sai da venda antes do lucro
  const saleVariablePct =
    (n(i.platformFeePct) + n(i.paymentFeePct) + n(i.commissionPct) + n(i.marketingPct) + n(i.icmsPct)) /
    100;

  // Preço mínimo: venda tal que lucro = 0
  //   sale * (1 - saleVariablePct) = landedCostUnit
  const denomBreakeven = Math.max(0.0001, 1 - saleVariablePct);
  const minimumPrice = landedCostUnit / denomBreakeven;

  // Preço recomendado para atingir margem líquida alvo:
  //   netProfit / sale = targetMargin
  //   sale - saleVars - landedCostUnit = sale * target
  //   sale * (1 - saleVars - target) = landedCostUnit
  const target = n(i.targetMarginPct) / 100;
  const denomTarget = Math.max(0.0001, 1 - saleVariablePct - target);
  const recommendedPrice = landedCostUnit / denomTarget;

  const effectiveSalePrice = n(i.salePrice) > 0 ? n(i.salePrice) : recommendedPrice;
  const saleTotal = effectiveSalePrice * qty;
  const saleFeesTotal = saleTotal * saleVariablePct;
  const netProfitTotal = saleTotal - saleFeesTotal - landedCostTotal;
  const netProfitUnit = netProfitTotal / qty;

  const grossMarginPct = saleTotal > 0 ? ((saleTotal - landedCostTotal) / saleTotal) * 100 : 0;
  const netMarginPct = saleTotal > 0 ? (netProfitTotal / saleTotal) * 100 : 0;
  const markupPct = landedCostUnit > 0 ? ((effectiveSalePrice - landedCostUnit) / landedCostUnit) * 100 : 0;
  const roiPct = landedCostTotal > 0 ? (netProfitTotal / landedCostTotal) * 100 : 0;

  return {
    productCostBRL,
    productCostUnitBRL,
    iofBRL,
    importTaxBRL,
    ipiBRL,
    pisCofinsBRL,
    logisticsTotal,
    fixedTotal,
    landedCostTotal,
    landedCostUnit,
    recommendedPrice,
    minimumPrice,
    effectiveSalePrice,
    saleTotal,
    saleFeesTotal,
    netProfitUnit,
    netProfitTotal,
    grossMarginPct,
    netMarginPct,
    markupPct,
    roiPct,
  };
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;

export type Scenario = {
  id: string;
  name: string;
  tag: "otimista" | "realista" | "conservador" | "custom";
  inputs: PricingInputs;
  createdAt: string;
};
