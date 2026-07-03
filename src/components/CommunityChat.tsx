import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Phone, Video, MoreVertical, ArrowLeft, Plus, Smile, Mic, Users } from "lucide-react";

type Msg = {
  id: number;
  author: string;
  color: string;
  text: string;
  time: string;
  self?: boolean;
};

const SCRIPT: Omit<Msg, "id" | "time">[] = [
  { author: "Rafael M.", color: "text-emerald-400", text: "Galera, acabei de fechar 200un de fone bluetooth com aquele fornecedor de Shenzhen 🔥" },
  { author: "Camila S.", color: "text-pink-400", text: "Que máximo! Qual foi o custo com imposto já calculado?" },
  { author: "Rafael M.", color: "text-emerald-400", text: "R$ 38 posto no Brasil. Vou revender por R$ 149 👀" },
  { author: "Bruno L.", color: "text-amber-400", text: "Isso é 292% de margem kkkk parabéns mano" },
  { author: "Você", color: "text-brand-glow", text: "Alguém usou o Radar hoje? Vi um produto com 5x de crescimento", self: true },
  { author: "Larissa P.", color: "text-purple-400", text: "Vi sim! Aquele mini projetor tá explodindo, já pedi amostra 📦" },
  { author: "Diego F.", color: "text-cyan-400", text: "A IA me salvou ontem, tava com dúvida de NCM e resolveu em 2 minutos" },
  { author: "Camila S.", color: "text-pink-400", text: "Essa comunidade tá impagável 💙" },
  { author: "Você", color: "text-brand-glow", text: "Real demais. Melhor investimento que fiz esse ano 🚀", self: true },
  { author: "Rafael M.", color: "text-emerald-400", text: "Bora fechar container juntos mês que vem? Divide frete 😎" },
];

function pad(n: number) { return n.toString().padStart(2, "0"); }

export function CommunityChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timeouts: number[] = [];

    const push = () => {
      if (cancelled) return;
      const next = SCRIPT[idxRef.current % SCRIPT.length];
      idxRef.current += 1;

      setTyping(next.self ? null : next.author);
      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        setTyping(null);
        const now = new Date();
        setMessages((prev) => {
          const msg: Msg = { ...next, id: Date.now() + Math.random(), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
          const arr = [...prev, msg];
          return arr.length > 20 ? arr.slice(arr.length - 20) : arr;
        });
        const t2 = window.setTimeout(push, 2200 + Math.random() * 1200);
        timeouts.push(t2);
      }, 1100 + Math.random() * 900);
      timeouts.push(t1);
    };

    // seed initial 3 messages instantly
    const now = new Date();
    setMessages(
      SCRIPT.slice(0, 3).map((m, i) => ({
        ...m,
        id: i,
        time: `${pad(now.getHours())}:${pad(now.getMinutes() - (3 - i))}`,
      })),
    );
    idxRef.current = 3;
    const start = window.setTimeout(push, 1800);
    timeouts.push(start);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-b from-brand/40 via-brand-glow/20 to-transparent blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border border-white/10 bg-neutral-950 p-2 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.5)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0b141a]">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-30 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-white/90">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span>••••</span>
              <span>5G</span>
              <span className="ml-1 inline-block h-2.5 w-4 rounded-sm border border-white/60" />
            </span>
          </div>

          {/* Chat header */}
          <div className="flex items-center gap-3 bg-[#1f2c33] px-3 py-2.5">
            <ArrowLeft className="h-4 w-4 text-white/70" />
            <div className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-glow">
              <Users className="h-4 w-4 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1f2c33] bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">Comunidade ImportPro</div>
              <div className="truncate text-[10px] text-white/60">
                {typing ? `${typing} está digitando...` : "1.284 membros · 42 online"}
              </div>
            </div>
            <Video className="h-4 w-4 text-white/70" />
            <Phone className="h-4 w-4 text-white/70" />
            <MoreVertical className="h-4 w-4 text-white/70" />
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="relative h-[440px] space-y-2 overflow-y-auto px-3 py-4"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 10%, rgba(37,211,102,0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(59,130,246,0.08), transparent 40%)",
              backgroundColor: "#0b141a",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex w-full animate-rise ${m.self ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[80%] rounded-lg px-2.5 py-1.5 text-[12px] shadow-md ${
                    m.self
                      ? "rounded-br-none bg-[#005c4b] text-white"
                      : "rounded-bl-none bg-[#1f2c33] text-white/95"
                  }`}
                >
                  {!m.self && (
                    <div className={`mb-0.5 text-[10px] font-semibold ${m.color}`}>{m.author}</div>
                  )}
                  <p className="leading-snug">{m.text}</p>
                  <div className={`mt-0.5 flex items-center justify-end gap-1 text-[9px] ${m.self ? "text-white/70" : "text-white/50"}`}>
                    <span>{m.time}</span>
                    {m.self && <CheckCheck className="h-3 w-3 text-sky-300" />}
                    {!m.self && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-lg rounded-bl-none bg-[#1f2c33] px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 bg-[#0b141a] px-2 pb-3 pt-1">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-[#1f2c33] px-3 py-2">
              <Smile className="h-4 w-4 text-white/60" />
              <span className="flex-1 text-[11px] text-white/40">Mensagem</span>
              <Plus className="h-4 w-4 text-white/60" />
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-glow">
              <Mic className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
