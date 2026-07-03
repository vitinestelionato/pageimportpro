import { useEffect, useRef, useState } from "react";
import { CheckCheck, ChevronLeft, Send } from "lucide-react";
import chatChart from "@/assets/chat-chart.jpg";

type Msg = {
  id: number;
  author: string;
  color: string;
  avatarBg: string;
  text: string;
  time: string;
  self?: boolean;
  image?: string;
};

// Sequence mimics the reference: msg, msg+image, self, typing, reply — then loops
const SCRIPT: Omit<Msg, "id" | "time">[] = [
  { author: "Lucas", color: "text-sky-400", avatarBg: "bg-sky-500", text: "Gente, esse fornecedor tá enviando em 12 dias 🔥" },
  { author: "Lucas", color: "text-sky-400", avatarBg: "bg-sky-500", text: "aproveitei o Radar do ImportPro, já fechei 3 produtos 🚀", image: chatChart },
  { author: "Você", color: "text-white", avatarBg: "", text: "Boa, parabéns! qual foi a margem?", self: true },
  { author: "Marina", color: "text-pink-400", avatarBg: "bg-pink-500", text: "Fechei 200un, margem de 180% garantida" },
  { author: "Bruno", color: "text-amber-400", avatarBg: "bg-amber-500", text: "IA calculou o imposto certinho, sem surpresa 👌" },
  { author: "Você", color: "text-white", avatarBg: "", text: "Bora fechar container juntos mês que vem?", self: true },
];

function pad(n: number) { return n.toString().padStart(2, "0"); }

const DOODLE_BG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
  <g fill='none' stroke='rgba(255,255,255,0.055)' stroke-width='1.2'>
    <circle cx='25' cy='30' r='9'/>
    <path d='M55 15 q8 12 16 0 t16 0'/>
    <rect x='75' y='45' width='14' height='14' rx='3'/>
    <path d='M115 20 l7 7 l-7 7 l-7 -7 z'/>
    <circle cx='160' cy='40' r='6'/>
    <path d='M180 70 q-5 8 -12 4'/>
    <path d='M15 80 h18 M20 75 v10'/>
    <path d='M60 95 q8 -12 16 0'/>
    <circle cx='110' cy='95' r='7'/>
    <path d='M145 85 l8 16 M153 85 l-8 16'/>
    <circle cx='185' cy='115' r='5'/>
    <circle cx='35' cy='140' r='6'/>
    <path d='M65 150 h16 v-12 h-16 z'/>
    <path d='M100 140 l5 5 l-5 5 l-5 -5 z'/>
    <path d='M135 155 q8 -8 16 0'/>
    <circle cx='175' cy='165' r='5'/>
    <path d='M15 180 q12 -8 24 0 t24 0'/>
    <path d='M100 180 q6 -6 12 0'/>
    <circle cx='145' cy='185' r='4'/>
  </g>
</svg>`);

export function CommunityChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState<{ author: string; color: string; avatarBg: string } | null>(null);
  const idxRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-trim: remove oldest messages whenever content doesn't fit the screen
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const contentOverflows = () => {
      const style = getComputedStyle(el);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const gap = parseFloat(style.rowGap) || 0;
      const children = Array.from(el.children) as HTMLElement[];
      const total =
        children.reduce((sum, c) => sum + c.offsetHeight, 0) +
        gap * Math.max(0, children.length - 1) +
        padY;
      return total > el.clientHeight + 2;
    };
    const trim = () => {
      if (contentOverflows()) {
        setMessages((prev) => (prev.length > 1 ? prev.slice(1) : prev));
      }
    };
    trim();
    // re-check after images load / layout settles
    const t = window.setTimeout(trim, 120);
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => img.addEventListener("load", trim));
    return () => {
      clearTimeout(t);
      imgs.forEach((img) => img.removeEventListener("load", trim));
    };
  }, [messages, typing]);

  useEffect(() => {
    let cancelled = false;
    const timeouts: number[] = [];

    const push = () => {
      if (cancelled) return;
      const next = SCRIPT[idxRef.current % SCRIPT.length];
      idxRef.current += 1;

      const commit = () => {
        if (cancelled) return;
        setTyping(null);
        const now = new Date();
        setMessages((prev) => {
          const msg: Msg = { ...next, id: Date.now() + Math.random(), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
          const arr = [...prev, msg];
          return arr.length > 3 ? arr.slice(arr.length - 3) : arr;
        });
        const t = window.setTimeout(push, 2800 + Math.random() * 1200);
        timeouts.push(t);
      };

      if (!next.self) {
        setTyping({ author: next.author, color: next.color, avatarBg: next.avatarBg });
        const t = window.setTimeout(commit, 1400 + Math.random() * 600);
        timeouts.push(t);
      } else {
        commit();
      }
    };

    const now = new Date();
    setMessages(
      SCRIPT.slice(0, 2).map((m, i) => ({
        ...m,
        id: i,
        time: `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - (2 - i)))}`,
      })),
    );
    idxRef.current = 2;
    const start = window.setTimeout(push, 2400);
    timeouts.push(start);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Ambient glow */}
      <div className="absolute -inset-8 -z-10 rounded-[3.5rem] bg-gradient-to-b from-brand/40 via-brand-glow/20 to-transparent blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[3rem] border border-white/10 bg-neutral-950 p-[10px] shadow-[0_40px_100px_-20px_rgba(59,130,246,0.55)]">
        <div className="pointer-events-none absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-white/5" />
        <div className="absolute -left-[3px] top-24 h-16 w-[3px] rounded-l bg-neutral-800" />
        <div className="absolute -left-[3px] top-44 h-10 w-[3px] rounded-l bg-neutral-800" />
        <div className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-neutral-800" />

        <div className="relative flex flex-col overflow-hidden rounded-[2.4rem] bg-[#0b141a]" style={{ aspectRatio: "9 / 19.5" }}>
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-2 z-30 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" rx="0.5"/><rect x="4" y="4" width="2" height="6" rx="0.5"/><rect x="8" y="2" width="2" height="8" rx="0.5"/><rect x="12" y="0" width="2" height="10" rx="0.5"/></svg>
              <svg width="13" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 2c2 0 3.8.7 5.2 2l-1 1.2A5.3 5.3 0 0 0 7 3.6c-1.6 0-3 .5-4.2 1.5L1.8 4C3.2 2.7 5 2 7 2Zm0 3c1.2 0 2.3.4 3.2 1.2l-1 1.1A3.3 3.3 0 0 0 7 6.6a3.3 3.3 0 0 0-2.2.8L3.8 6.2C4.7 5.4 5.8 5 7 5Zm0 3a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 7 8Z"/></svg>
              <svg width="20" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" opacity="0.6"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/></svg>
            </span>
          </div>

          {/* Chat header */}
          <div className="relative z-10 flex items-center gap-2.5 bg-[#1f2c33] px-3 py-2.5">
            <ChevronLeft className="h-5 w-5 text-white/80" />
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-glow ring-[3px] ring-white/15">
              <span className="text-[13px] font-bold text-white">I</span>
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
            className="relative flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden px-2.5 py-3"
            style={{
              backgroundColor: "#0b141a",
              backgroundImage: `url("${DOODLE_BG}")`,
              backgroundSize: "200px 200px",
            }}
          >
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full shrink-0 items-end gap-1.5 animate-rise ${m.self ? "justify-end" : "justify-start"}`}>
                {!m.self && (
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.avatarBg} text-[11px] font-bold text-white shadow`}>
                    {m.author[0]}
                  </div>
                )}
                <div
                  className={`relative max-w-[78%] rounded-2xl px-2.5 py-1.5 text-[12.5px] shadow ${
                    m.self
                      ? "rounded-br-md bg-[#005c4b] text-white"
                      : "rounded-bl-md bg-[#1f2c33] text-white/95"
                  }`}
                >
                  {!m.self && (
                    <div className={`mb-0.5 text-[11px] font-semibold ${m.color}`}>{m.author}</div>
                  )}
                  {m.image && (
                    <img
                      src={m.image}
                      alt=""
                      loading="lazy"
                      className="mb-1 h-auto w-full rounded-lg"
                    />
                  )}
                  <p className="leading-snug">{m.text}</p>
                  <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${m.self ? "text-white/70" : "text-white/50"}`}>
                    <span>{m.time}</span>
                    {m.self && <CheckCheck className="h-3 w-3 text-sky-300" />}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex w-full shrink-0 items-end gap-1.5 animate-rise">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${typing.avatarBg} text-[11px] font-bold text-white shadow`}>
                  {typing.author[0]}
                </div>
                <div className="rounded-2xl rounded-bl-md bg-[#1f2c33] px-3 py-2.5">
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
          <div className="relative z-10 shrink-0 bg-[#0b141a] px-3 pb-6 pt-2">
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
