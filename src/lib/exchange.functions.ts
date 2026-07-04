import { createServerFn } from "@tanstack/react-start";

export type ExchangeRates = {
  USD: number;
  EUR: number;
  CNY: number;
  updatedAt: string;
  stale: boolean;
};

type CacheEntry = { data: ExchangeRates; expiresAt: number };
let cache: CacheEntry | null = null;
const TTL_MS = 5 * 60 * 1000;

const FALLBACK: Omit<ExchangeRates, "updatedAt" | "stale"> = {
  USD: 5.4,
  EUR: 5.9,
  CNY: 0.75,
};

export const getExchangeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExchangeRates> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.data;

    try {
      const res = await fetch(
        "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,CNY-BRL",
        { headers: { accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as Record<string, { bid: string; create_date: string }>;

      const rates: ExchangeRates = {
        USD: Number(json.USDBRL?.bid ?? FALLBACK.USD),
        EUR: Number(json.EURBRL?.bid ?? FALLBACK.EUR),
        CNY: Number(json.CNYBRL?.bid ?? FALLBACK.CNY),
        updatedAt: json.USDBRL?.create_date ?? new Date().toISOString(),
        stale: false,
      };
      cache = { data: rates, expiresAt: now + TTL_MS };
      return rates;
    } catch (err) {
      console.error("[exchange] fetch failed", err);
      const fallback: ExchangeRates = {
        ...FALLBACK,
        updatedAt: new Date().toISOString(),
        stale: true,
      };
      // Short cache on failure to avoid hammering
      cache = { data: fallback, expiresAt: now + 60_000 };
      return fallback;
    }
  },
);
