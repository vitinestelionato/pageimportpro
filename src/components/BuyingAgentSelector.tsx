import { ShoppingCart, ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBuyingAgent } from "@/hooks/useBuyingAgent";

/**
 * Dropdown to pick the user's preferred buying agent (CSSBUY, ACBUY, etc.).
 * Persisted in localStorage. Emits a global event so other components refresh.
 */
export function BuyingAgentSelector({ compact = false }: { compact?: boolean }) {
  const { agent, agents, setAgentId } = useBuyingAgent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 ${compact ? "h-8 text-xs" : "h-10 text-sm"} font-semibold hover:border-primary/40 hover:text-primary`}
        title="Agente de compras preferido"
      >
        <ShoppingCart className="h-3.5 w-3.5 text-primary" />
        <span className="text-muted-foreground">Agente:</span>
        <span className="text-foreground">{agent.logo} {agent.name}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-xl backdrop-blur">
          <div className="border-b border-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Escolha seu agente
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {agents.map((a) => {
              const active = a.id === agent.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setAgentId(a.id); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 ${active ? "text-primary" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{a.logo}</span>
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground">{a.domain}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
