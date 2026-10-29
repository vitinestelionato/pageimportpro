import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TrendingProduct = {
  name: string;
  category: string;
  niche: string;
  description: string;
  growth_pct: number;
  demand: "muito_alta" | "alta" | "media";
  competition: "baixa" | "media" | "alta";
  monthly_searches: number;
  price_range_brl: { min: number; max: number };
  origin_price_usd: { min: number; max: number };
  margin_pct: number;
  target_audience: string;
  seasonality: string;
  best_platforms: string[];
  why_hot: string;
  tags: string[];
};

const CATEGORIES = [
  "Eletrônicos", "Moda", "Casa e Cozinha", "Beleza", "Fitness",
  "Pet", "Infantil", "Automotivo", "Escritório", "Ferramentas",
] as const;

export const listTrendingProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      category: z.enum(["all", ...CATEGORIES]).default("all"),
      refresh: z.boolean().default(false),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<TrendingProduct[]> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Serviço de IA indisponível no momento");

    const categoryHint = data.category === "all"
      ? "de diversas categorias (eletrônicos, moda, casa, beleza, fitness, pet, infantil, automotivo)"
      : `da categoria "${data.category}"`;

    const seed = data.refresh ? `Semente aleatória: ${Date.now() % 100000}. ` : "";

    const systemPrompt = `Você é um especialista em e-commerce e importação da China para o Brasil.
Sua tarefa é gerar uma lista de 12 PRODUTOS EM ALTA no mercado brasileiro AGORA (${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}), com base em tendências reais recentes (redes sociais, TikTok, Shopee, Mercado Livre, buscas Google).
Foque em produtos importáveis (fornecedores 1688/Alibaba/Goofish) com boa margem para revenda.
Responda SEMPRE em português brasileiro. Retorne SOMENTE JSON válido, sem markdown, sem explicações fora do JSON.`;

    const userPrompt = `${seed}Gere 12 produtos vencedores em alta ${categoryHint}, para revenda no Brasil.
Para cada produto, retorne dados realistas e coerentes entre si (margem alta implica gap entre custo origem e venda BR).
Cada produto deve ser específico (não genérico como "acessório de celular", e sim "Suporte magnético MagSafe dobrável").

Retorne JSON exatamente neste formato:
{
  "products": [
    {
      "name": "Nome específico e comercial do produto",
      "category": "uma das: Eletrônicos, Moda, Casa e Cozinha, Beleza, Fitness, Pet, Infantil, Automotivo, Escritório, Ferramentas",
      "niche": "Nicho específico (ex: Gadgets iPhone, Skincare Coreano, Home Office)",
      "description": "1-2 frases descrevendo o produto e diferencial",
      "growth_pct": número entre 40 e 320 (crescimento % nos últimos 90 dias),
      "demand": "muito_alta" | "alta" | "media",
      "competition": "baixa" | "media" | "alta",
      "monthly_searches": número entre 3000 e 250000 (buscas/mês estimadas Brasil),
      "price_range_brl": { "min": número, "max": número } (preço de venda BR),
      "origin_price_usd": { "min": número, "max": número } (custo origem em USD),
      "margin_pct": número entre 80 e 420 (margem % sobre custo),
      "target_audience": "Descrição curta do público (ex: Mulheres 25-40, entusiastas fitness)",
      "seasonality": "Ex: 'Ano todo', 'Verão', 'Volta às aulas', 'Natal'",
      "best_platforms": ["Shopee", "Mercado Livre", "Instagram", "TikTok Shop"] (2 a 4),
      "why_hot": "Por que está em alta agora, 1 frase objetiva",
      "tags": ["3 a 5 tags curtas em minúsculas"]
    }
  ]
}`;

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
    if (!res.ok) throw new Error("Falha ao gerar tendências");

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    const parsed = JSON.parse(content) as { products?: TrendingProduct[] };
    if (!parsed.products || !Array.isArray(parsed.products)) throw new Error("Formato inválido");
    return parsed.products;
  });
