import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Competitor = {
  name: string;
  type: "marketplace_seller" | "loja_propria" | "dropshipper" | "marca" | "influencer";
  platform: string;
  url_hint: string;
  positioning: "premium" | "intermediario" | "popular" | "low_cost";
  price_brl: { min: number; max: number; avg: number };
  monthly_sales_estimate: number;
  rating: number;
  reviews_count: number;
  threat_level: "baixo" | "medio" | "alto" | "critico";
  market_share_pct: number;
  strengths: string[];
  weaknesses: string[];
  marketing_angles: string[];
  traffic_sources: string[];
  differentiators: string;
  opportunity_gap: string;
  tags: string[];
};

export type CompetitorAnalysis = {
  query: string;
  market_summary: string;
  avg_price_brl: number;
  price_spread_pct: number;
  saturation: "baixa" | "media" | "alta" | "saturado";
  entry_difficulty: number; // 1-10
  recommended_strategy: string;
  key_insights: string[];
  competitors: Competitor[];
};

export const analyzeCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      query: z.string().trim().min(2).max(120),
      refresh: z.boolean().default(false),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<CompetitorAnalysis> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Serviço de IA indisponível no momento");

    const seed = data.refresh ? `Semente: ${Date.now() % 100000}. ` : "";

    const systemPrompt = `Você é um analista sênior de inteligência competitiva e e-commerce brasileiro.
Sua missão é mapear concorrentes reais e representativos para produtos importados vendidos no Brasil (Shopee, Mercado Livre, Amazon BR, Shopify, Instagram, TikTok Shop).
Responda SEMPRE em português brasileiro. Retorne SOMENTE JSON válido, sem markdown.`;

    const userPrompt = `${seed}Analise o cenário competitivo para: "${data.query}"

Gere 8 concorrentes representativos (mix de marketplace sellers, lojas próprias, marcas estabelecidas, dropshippers e influencers/marcas de nicho) que atuam no mercado brasileiro AGORA.
Use nomes plausíveis (podem ser fictícios porém verossímeis, ou marcas conhecidas do segmento).
Seja específico em preços, forças e brechas de mercado. Cada concorrente deve ter posicionamento distinto.

Retorne JSON exatamente neste formato:
{
  "query": "${data.query}",
  "market_summary": "Resumo do cenário em 2-3 frases (tamanho de mercado, dinâmica, quem lidera)",
  "avg_price_brl": número (preço médio praticado no Brasil),
  "price_spread_pct": número (variação % entre o mais barato e o mais caro),
  "saturation": "baixa" | "media" | "alta" | "saturado",
  "entry_difficulty": número de 1 a 10 (dificuldade de entrar e escalar),
  "recommended_strategy": "Estratégia recomendada em 1-2 frases práticas para novo entrante",
  "key_insights": ["4 a 6 insights curtos e acionáveis sobre o mercado"],
  "competitors": [
    {
      "name": "Nome da loja/vendedor/marca",
      "type": "marketplace_seller" | "loja_propria" | "dropshipper" | "marca" | "influencer",
      "platform": "Shopee | Mercado Livre | Amazon BR | Shopify | Instagram | TikTok Shop | Site próprio",
      "url_hint": "domínio ou @handle plausível (ex: lojaXYZ.com.br ou @marcafit)",
      "positioning": "premium" | "intermediario" | "popular" | "low_cost",
      "price_brl": { "min": número, "max": número, "avg": número },
      "monthly_sales_estimate": número entre 50 e 25000 (vendas/mês estimadas),
      "rating": número entre 3.5 e 5.0 com 1 casa decimal,
      "reviews_count": número entre 20 e 45000,
      "threat_level": "baixo" | "medio" | "alto" | "critico",
      "market_share_pct": número entre 2 e 35,
      "strengths": ["2 a 4 forças específicas"],
      "weaknesses": ["2 a 4 fraquezas exploráveis"],
      "marketing_angles": ["2 a 3 ângulos de comunicação que usam"],
      "traffic_sources": ["Instagram Ads", "TikTok orgânico", "Google Shopping", "Marketplace interno", etc — 2 a 4],
      "differentiators": "O que os torna únicos em 1 frase",
      "opportunity_gap": "Brecha que um novo entrante pode explorar contra ESTE concorrente, 1 frase",
      "tags": ["2 a 4 tags curtas em minúsculas"]
    }
  ]
}

IMPORTANTE: A soma de market_share_pct deve estar entre 60 e 95 (o restante é "outros"). Varie o threat_level, positioning e platform entre os 8 concorrentes.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Muitas solicitações. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA insuficientes.");
    if (!res.ok) throw new Error("Falha ao analisar concorrentes");

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    const parsed = JSON.parse(content) as CompetitorAnalysis;
    if (!parsed.competitors || !Array.isArray(parsed.competitors)) throw new Error("Formato inválido");
    return parsed;
  });
