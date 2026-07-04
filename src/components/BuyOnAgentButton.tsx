import { ShoppingCart, ExternalLink } from "lucide-react";
import { useBuyingAgent } from "@/hooks/useBuyingAgent";

/**
 * "Comprar na {agent}" button. Redirects to the user's chosen buying agent
 * with the source URL (if given) or a keyword search (fallback).
 */
export function BuyOnAgentButton({
  sourceUrl,
  keyword,
  size = "md",
  className = "",
}: {
  sourceUrl?: string | null;
  keyword?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { agent } = useBuyingAgent();
  const href = sourceUrl
    ? agent.buildProductUrl(sourceUrl)
    : keyword
    ? agent.buildSearchUrl(keyword)
    : null;
  if (!href) return null;

  const h = size === "sm" ? "h-8 text-xs px-3" : size === "lg" ? "h-11 text-sm px-5" : "h-9 text-xs px-4";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex ${h} items-center justify-center gap-1.5 rounded-lg bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 ${className}`}
      title={`Abrir no ${agent.name}`}
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      Comprar na {agent.name}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </a>
  );
}
