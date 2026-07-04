import { useCallback, useEffect, useState } from "react";
import type { Scenario, PricingInputs } from "@/lib/pricing";

const KEY = "importpro:pricing-scenarios";
const EVT = "importpro:pricing-scenarios-change";

function readAll(): Scenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Scenario[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Scenario[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function usePricingScenarios() {
  const [items, setItems] = useState<Scenario[]>([]);

  useEffect(() => {
    setItems(readAll());
    const h = () => setItems(readAll());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const save = useCallback((name: string, tag: Scenario["tag"], inputs: PricingInputs) => {
    const s: Scenario = {
      id: crypto.randomUUID(),
      name: name.trim() || "Cenário sem nome",
      tag,
      inputs,
      createdAt: new Date().toISOString(),
    };
    writeAll([s, ...readAll()]);
    return s;
  }, []);

  const remove = useCallback((id: string) => {
    writeAll(readAll().filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => writeAll([]), []);

  return { items, save, remove, clear };
}
