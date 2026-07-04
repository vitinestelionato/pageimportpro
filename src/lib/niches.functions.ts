import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HotNiche = {
  name: string;
  slug: string;
  category: string;
  heat_score: number;
  growth_pct: number;
  competition: "baixa" | "media" | "alta";
  audience_size: "pequeno" | "medio" | "grande" | "massivo";
  avg_ticket_brl: number;
  margin_pct: number;
  monthly_searches: number;
  seasonality: string;
  description: string;
  why_hot: string;
  target_audience: string;
  top_products: string[];
  best_platforms: string[];
  content_angles: string[];
  pain_points: string[];
  keywords: string[];
  origin_hubs: string[];
  tags: string[];
};

const SEGMENTS = [
  "Todos", "Eletrônicos", "Moda", "Casa e Cozinha", "Beleza",
  "Fitness", "Pet", "Infantil", "Automotivo", "Escritório",
] as const;

export const listHotNiches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      segment: z.enum(SEGMENTS).default("Todos"),
      refresh: z.boolean().default(false),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<HotNiche[]> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Serviço de IA indisponível no momento");

    const segmentHint = data.segment === "Todos"
      ? "de diversos segmentos (eletrônicos, moda, beleza, casa, fitness, pet, infantil, automotivo, escritório)"
      : `focados no segmento "${data.segment}"`;

    const seed = data.refresh ? `Semente: ${Date.now() % 100000}. ` : "";

    const systemPrompt = `Você é analista sênior de e-commerce e importação da China para o Brasil.
Sua tarefa é identificar NICHOS QUENTES para revenda no mercado brasileiro AGORA (${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}).
Um nicho é uma categoria específica de público + necessidade (ex: "Gadgets para iPhone", "Skincare Coreano", "Home Office Ergonômico"), não um produto único.
Baseie-se em tendências reais: TikTok Brasil, Shopee, Mercado Livre, Instagram, Google Trends, comunidades e influenciadores.
Responda SEMPRE em português brasileiro. Retorne SOMENTE JSON válido, sem markdown, sem comentários.`;

    const userPrompt = `${seed}Gere 10 nichos quentes ${segmentHint} para revenda no Brasil via importação.
Cada nicho deve ser específico e acionável (ex: "Skincare Coreano K-Beauty", não apenas "Beleza").
Os dados devem ser coerentes entre si (nichos massivos raramente têm concorrência baixa).

Retorne JSON exatamente neste formato:
{
  "niches": [
    {
      "name": "Nome curto e comercial do nicho",
      "slug": "nome-em-slug-minusculo",
      "category": "Eletrônicos | Moda | Casa e Cozinha | Beleza | Fitness | Pet | Infantil | Automotivo | Escritório",
      "heat_score": número de 60 a 100 (temperatura geral do nicho),
      "growth_pct": número de 30 a 280 (crescimento % nos últimos 90 dias),
      "competition": "baixa" | "media" | "alta",
      "audience_size": "pequeno" | "medio" | "grande" | "massivo",
      "avg_ticket_brl": número (ticket médio de venda em R$),
      "margin_pct": número de 80 a 380 (margem % sobre custo),
      "monthly_searches": número de 5000 a 500000 (buscas/mês estimadas Brasil),
      "seasonality": "Ano todo | Verão | Inverno | Volta às aulas | Natal | Dia das mães | ...",
      "description": "1-2 frases descrevendo o nicho",
      "why_hot": "Por que está bombando agora, 1 frase objetiva",
      "target_audience": "Descrição curta do público-alvo (idade, gênero, interesses)",
      "top_products": ["4 a 6 produtos específicos que vendem bem neste nicho"],
      "best_platforms": ["2 a 4 plataformas de venda ideais"],
      "content_angles": ["3 a 5 ângulos/ideias de conteúdo para vender neste nicho"],
      "pain_points": ["2 a 4 dores/problemas que este nicho resolve"],
      "keywords": ["5 a 8 palavras-chave principais para SEO e ads"],
      "origin_hubs": ["1 a 3 hubs de fornecedores (ex: '1688 Shenzhen', 'Yiwu Market', 'Guangzhou Beauty')"],
      "tags": ["3 a 5 tags curtas em minúsculas"]
    }
  ]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Muitas solicitações. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA insuficientes.");
    if (!res.ok) throw new Error("Falha ao gerar nichos");

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    const parsed = JSON.parse(content) as { niches?: HotNiche[] };
    if (!parsed.niches || !Array.isArray(parsed.niches)) throw new Error("Formato inválido");
    return parsed.niches;
  });
