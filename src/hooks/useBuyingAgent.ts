import { useEffect, useState, useCallback } from "react";
import { DEFAULT_AGENT_ID, getAgent, BUYING_AGENTS, type BuyingAgent } from "@/lib/buying-agents";

const STORAGE_KEY = "importpro:buying-agent";
const EVENT = "importpro:buying-agent-change";

function read(): string {
  if (typeof window === "undefined") return DEFAULT_AGENT_ID;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_AGENT_ID;
}

export function useBuyingAgent(): {
  agent: BuyingAgent;
  agentId: string;
  setAgentId: (id: string) => void;
  agents: BuyingAgent[];
} {
  const [agentId, setAgentIdState] = useState<string>(DEFAULT_AGENT_ID);

  useEffect(() => {
    setAgentIdState(read());
    const onChange = () => setAgentIdState(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setAgentId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new Event(EVENT));
    setAgentIdState(id);
  }, []);

  return { agent: getAgent(agentId), agentId, setAgentId, agents: BUYING_AGENTS };
}
