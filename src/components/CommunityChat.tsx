import { useEffect, useRef, useState } from "react";
import { CheckCheck, ChevronLeft, Send } from "lucide-react";

type Msg = {
  id: number;
  author: string;
  color: string;
  avatarBg: string;
  text: string;
  time: string;
  self?: boolean;
};

const SCRIPT: Omit<Msg, "id" | "time">[] = [
  { author: "Lucas", color: "text-sky-400", avatarBg: "bg-sky-500", text: "Galera, fechei 200un de fone bluetooth com fornecedor de Shenzhen 🔥" },
  { author: "Marina", color: "text-pink-400", avatarBg: "bg-pink-500", text: "Que máximo! Qual ficou o custo com imposto já calculado?" },
  { author: "Você", color: "text-white", avatarBg: "", text: "Rodei na calculadora agora, R$ 38 posto no BR 👀", self: true },
  { author: "Lucas", color: "text-sky-400", avatarBg: "bg-sky-500", text: "Vou revender por R$ 149, margem absurda 🚀" },
  { author: "Bruno", color: "text-amber-400", avatarBg: "bg-amber-500", text: "Isso é 292% kkkk parabéns mano" },
  { author: "Você", color: "text-white", avatarBg: "", text: "Alguém usou o Radar hoje? Vi produto com 5x de crescimento", self: true },
  { author: "Larissa", color: "text-purple-400", avatarBg: "bg-purple-500", text: "Vi sim! Mini projetor tá explodindo, já pedi amostra 📦" },
  { author: "Diego", color: "text-cyan-400", avatarBg: "bg-cyan-500", text: "A IA me salvou ontem, dúvida de NCM resolvida em 2 min" },
  { author: "Marina", color: "text-pink-400", avatarBg: "bg-pink-500", text: "Essa comunidade tá impagável 💙" },
  { author: "Lucas", color: "text-sky-400", avatarBg: "bg-sky-500", text: "Bora fechar container juntos mês que vem? Divide frete 😎" },
];

function pad(n: number) { return n.toString().padStart(2, "0"); }

// Subtle WhatsApp-style doodle pattern (base64 SVG)
const DOODLE_BG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
  <g fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1.2'>
    <circle cx='30' cy='40' r='10'/>
    <path d='M60 20 q10 15 20 0 t20 0'/>
    <rect x='90' y='60' width='16' height='16' rx='3'/>
    <path d='M140 30 l8 8 l-8 8 l-8 -8 z'/>
    <circle cx='190' cy='55' r='6'/>
    <path d='M20 100 h20 M25 95 v10'/>
    <path d='M70 120 q10 -15 20 0'/>
    <circle cx='130' cy='115' r='8'/>
    <path d='M170 105 l10 20 M180 105 l-10 20'/>
    <path d='M210 130 q-5 10 -15 5'/>
    <circle cx='40' cy='170' r='7'/>
    <path d='M80 180 h20 v-15 h-20 z'/>
    <path d='M120 170 l6 6 l-6 6 l-6 -6 z'/>
    <path d='M160 190 q10 -10 20 0'/>
    <circle cx='210' cy='200' r='5'/>
    <path d='M20 220 q15 -10 30 0 t30 0'/>
  </g>
</svg>`);

export function CommunityChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts: number[] = [];

    const push = () => {
      if (cancelled) return;
      const next = SCRIPT[idxRef.current % SCRIPT.length];
      idxRef.current += 1;
      const now = new Date();
      setMessages((prev) => {
        const msg: Msg = { ...next, id: Date.now() + Math.random(), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
        const arr = [...prev, msg];
        return arr.length > 14 ? arr.slice(arr.length - 14) : arr;
      });
      const t = window.setTimeout(push, 2400 + Math.random() * 1400);
      timeouts.push(t);
    };

    const now = new Date();
    setMessages(
      SCRIPT.slice(0, 4).map((m, i) => ({
        ...m,
        id: i,
        time: `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - (4 - i)))}`,
      })),
    );
    idxRef.current = 4;
    const start = window.setTimeout(push, 2200);
    timeouts.push(start);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Ambient glow */}
      <div className="absolute -inset-8 -z-10 rounded-[3.5rem] bg-gradient-to-b from-brand/40 via-brand-glow/20 to-transparent blur-3xl" />

      {/* Phone frame — iPhone-like */}
      <div className="relative rounded-[3rem] border border-white/10 bg-neutral-950 p-[10px] shadow-[0_40px_100px_-20px_rgba(59,130,246,0.55)]">
        <div className="pointer-events-none absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-white/5" />
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-24 h-16 w-[3px] rounded-l bg-neutral-800" />
        <div className="absolute -left-[3px] top-44 h-10 w-[3px] rounded-l bg-neutral-800" />
        <div className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-neutral-800" />

        <div className="relative overflow-hidden rounded-[2.4rem] bg-[#0b141a]" style={{ aspectRatio: "9 / 19.5" }}>
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-2 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-1 text-[11px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" rx="0.5"/><rect x="4" y="4" width="2" height="6" rx="0.5"/><rect x="8" y="2" width="2" height="8" rx="0.5"/><rect x="12" y="0" width="2" height="10" rx="0.5"/></svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 2c2 0 3.8.7 5.2 2l-1 1.2A5.3 5.3 0 0 0 7 3.6c-1.6 0-3 .5-4.2 1.5L1.8 4C3.2 2.7 5 2 7 2Zm0 3c1.2 0 2.3.4 3.2 1.2l-1 1.1A3.3 3.3 0 0 0 7 6.6a3.3 3.3 0 0 0-2.2.8L3.8 6.2C4.7 5.4 5.8 5 7 5Zm0 3a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 7 8Z"/></svg>
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" opacity="0.6"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/></svg>
            </span>
          </div>

          {/* Chat header */}
          <div className="relative z-10 flex items-center gap-2.5 bg-[#1f2c33] px-3 py-2.5">
            <ChevronLeft className="h-5 w-5 text-white/80" />
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-glow ring-2 ring-white/10">
              <span className="text-[13px] font-bold text-white">IP</span>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[14px] font-semibold text-white">
                ImportPro <span className="text-white/60">·</span> Assinantes
              </div>
              <div className="truncate text-[11px] text-white/50">Comunidade ImportPro</div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-hidden px-2.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              height: "calc(100% - 148px)",
              backgroundColor: "#0b141a",
              backgroundImage: `url("${DOODLE_BG}")`,
              backgroundSize: "240px 240px",
            }}
          >
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex w-full items-end gap-1.5 animate-rise ${m.self ? "justify-end" : "justify-start"}`}>
                  {!m.self && (
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.avatarBg} text-[11px] font-bold text-white shadow`}>
                      {m.author[0]}
                    </div>
                  )}
                  <div
                    className={`relative max-w-[75%] rounded-2xl px-3 py-2 text-[13px] shadow ${
                      m.self
                        ? "rounded-br-md bg-[#005c4b] text-white"
                        : "rounded-bl-md bg-[#1f2c33] text-white/95"
                    }`}
                  >
                    {!m.self && (
                      <div className={`mb-0.5 text-[11px] font-semibold ${m.color}`}>{m.author}</div>
                    )}
                    <p className="leading-snug">{m.text}</p>
                    <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${m.self ? "text-white/70" : "text-white/50"}`}>
                      <span>{m.time}</span>
                      {m.self && <CheckCheck className="h-3 w-3 text-sky-300" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-[#0b141a] px-3 pb-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-11 flex-1 rounded-full bg-[#1f2c33]" />
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00a884] shadow-lg transition-transform hover:scale-105">
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
