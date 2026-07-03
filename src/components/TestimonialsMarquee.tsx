import { Star, BadgeCheck } from "lucide-react";

export type Review = {
  name: string;
  role: string;
  city: string;
  text: string;
  date: string;
};

const REVIEWS: Review[] = [
  { name: "Lucas M.", role: "Importador Iniciante", city: "Campinas/SP", date: "há 3 dias", text: "Eu tava com medo de importar sozinho e acabar perdendo dinheiro. Depois que comecei usar o sistema ficou tudo bem mais claro." },
  { name: "Camila S.", role: "Loja Online", city: "Curitiba/PR", date: "há 1 semana", text: "Os fornecedores que encontrei aqui são infinitamente melhores do que os que eu achava pesquisando sozinha." },
  { name: "Felipe A.", role: "Revendedor", city: "Belo Horizonte/MG", date: "há 2 semanas", text: "A calculadora praticamente evitou que eu comprasse um produto sem margem. Valeu cada centavo." },
  { name: "Marcos R.", role: "Mercado Livre", city: "São Paulo/SP", date: "há 4 dias", text: "Gostei muito da organização. Não fica aquela bagunça de planilha espalhada." },
  { name: "Renata C.", role: "Importadora", city: "Goiânia/GO", date: "há 3 semanas", text: "Pra quem tá começando ajuda demais. Achei q ia ser complicado mas foi bem tranquilo." },
  { name: "João P.", role: "E-commerce", city: "Recife/PE", date: "há 1 mês", text: "Economizei um dinheiro bom só por conseguir calcular tudo antes de comprar." },
  { name: "Pedro L.", role: "Revendedor", city: "Fortaleza/CE", date: "há 5 dias", text: "Já tinha tomado prejuizo importando antes. Dessa vez consegui planejar tudo certinho." },
  { name: "Amanda T.", role: "Shopee", city: "Salvador/BA", date: "há 2 semanas", text: "Curti muito o rastreamento. Antes eu ficava perdido sem saber onde tava minhas encomendas." },
  { name: "Bruno F.", role: "Autônomo", city: "Brasília/DF", date: "há 6 dias", text: "O sistema é bem limpo e facil de usar. Não precisei assistir mil aulas." },
  { name: "Juliana M.", role: "Importadora", city: "Florianópolis/SC", date: "há 1 mês", text: "Os fornecedores realmente parecem bem selecionados. Até agora todos deram certo." },
  { name: "Carlos N.", role: "Marketplace", city: "Vitória/ES", date: "há 2 dias", text: "Foi uma das melhores compras que fiz esse ano. Recomendo bastante." },
  { name: "Gustavo H.", role: "Revendedor", city: "Manaus/AM", date: "há 3 semanas", text: "Antes eu fazia tudo na calculadora do celular kkk agora ficou muito mais facil." },
  { name: "Patrícia L.", role: "Loja Virtual", city: "Londrina/PR", date: "há 1 semana", text: "Achei que era só mais um curso, mas na verdade uso as ferramentas praticamente todo dia." },
  { name: "Diego S.", role: "Importador", city: "Joinville/SC", date: "há 4 dias", text: "Já economizei mais do que paguei no sistema logo na primeira compra." },
  { name: "Fernanda A.", role: "Shopee", city: "Natal/RN", date: "há 2 semanas", text: "Bem organizado. Não tem informação jogada igual outros produtos." },
  { name: "Rafael B.", role: "Mercado Livre", city: "Ribeirão Preto/SP", date: "há 5 dias", text: "A lista de fornecedores foi o que mais gostei. Me poupou horas procurando." },
  { name: "Vinicius D.", role: "Revendedor", city: "Sorocaba/SP", date: "há 1 mês", text: "Vale muito os 47 reais. Achei que seria bem mais simples." },
  { name: "Bianca O.", role: "Loja Online", city: "João Pessoa/PB", date: "há 3 dias", text: "Consegui entender melhor quanto realmente custa importar. Isso fez muita diferença." },
  { name: "Matheus C.", role: "Importador", city: "Cuiabá/MT", date: "há 2 semanas", text: "Interface bonita e bem organizada. Dá gosto de usar." },
  { name: "Larissa G.", role: "Autônoma", city: "Aracaju/SE", date: "há 1 semana", text: "Já indiquei pra dois amigos que também começaram importar." },
  { name: "Eduardo V.", role: "Revendedor", city: "Uberlândia/MG", date: "há 6 dias", text: "Eu sempre errava no calculo do lucro kkk agora faço tudo rapidinho." },
  { name: "Nicole F.", role: "Loja Virtual", city: "Porto Alegre/RS", date: "há 3 semanas", text: "Gostei pq junta tudo num lugar só. Antes eu usava vários sites diferentes." },
  { name: "Thiago K.", role: "Importador", city: "São José dos Campos/SP", date: "há 4 dias", text: "O sistema é leve e funciona muito bem no celular. Uso quase sempre por ele." },
  { name: "Aline P.", role: "Empreendedora", city: "Maceió/AL", date: "há 2 semanas", text: "Me ajudou a evitar comprar de um fornecedor que parecia bom mas tinha várias reclamações." },
  { name: "Gabriel E.", role: "Revendedor", city: "Rio de Janeiro/RJ", date: "há 1 mês", text: "Pra quem quer começar a importar sem ficar perdido eu acho que vale muito a pena." },
];

const ROW_A = REVIEWS.slice(0, 13);
const ROW_B = REVIEWS.slice(13);

function ReviewCard({ r }: { r: Review }) {
  return (
    <article
      className="group/card relative flex h-[220px] w-[300px] shrink-0 flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[oklch(0.18_0.025_260)] p-5 shadow-[0_1px_0_0_oklch(1_0_0/0.04)_inset] transition-all duration-500 ease-out will-change-transform hover:-translate-y-2 hover:border-[oklch(0.65_0.19_255/0.45)] hover:shadow-[0_20px_60px_-20px_oklch(0.65_0.2_255/0.45)] sm:w-[380px] sm:p-7"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, oklch(0.65 0.2 255 / 0.12), transparent 60%)" }}
      />
      <span className="absolute right-5 top-5 text-[11px] font-medium text-white/40">{r.date}</span>

      <div className="relative">
        <div className="flex gap-0.5 text-[oklch(0.78_0.16_235)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
        <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-white/85">
          "{r.text}"
        </p>
      </div>

      <div className="relative">
        <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.2 255), oklch(0.75 0.18 235))" }}
          >
            {r.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{r.name}</div>
            <div className="truncate text-[11.5px] text-white/50">{r.role} • {r.city}</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.65_0.19_255/0.35)] bg-[oklch(0.4_0.15_255/0.15)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.82_0.14_235)]">
            <BadgeCheck className="h-3 w-3" />
            Verificada
          </span>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ items, direction = "left", duration = 90 }: { items: Review[]; direction?: "left" | "right"; duration?: number }) {
  const anim = direction === "left" ? "marquee-x" : "marquee-x-reverse";
  return (
    <div className="group/row relative overflow-x-clip overflow-y-visible py-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className="flex w-max gap-5 will-change-transform group-hover/row:[animation-duration:280s]"
        style={{ animation: `${anim} ${duration}s linear infinite` }}
      >
        {[...items, ...items].map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <section id="depoimentos" className="relative overflow-hidden bg-background py-20 sm:py-28 md:py-32">
      {/* Ambient brand glow */}
      <div
        className="pointer-events-none absolute left-1/2 -top-40 -z-0 h-[700px] w-[1200px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, oklch(0.55 0.24 255 / 0.22), transparent 72%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 60% 40% at 50% 20%, #000 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Quem começa a importar,{" "}
          <span className="text-gradient">recomenda.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">
          Centenas de importadores utilizam diariamente nossas ferramentas para encontrar fornecedores confiáveis, calcular custos e importar com muito mais segurança.
        </p>
      </div>

      <div className="relative mt-16 flex flex-col gap-5">
        <MarqueeRow items={ROW_A} direction="left" duration={95} />
        <MarqueeRow items={ROW_B} direction="right" duration={110} />
      </div>
    </section>
  );
}
