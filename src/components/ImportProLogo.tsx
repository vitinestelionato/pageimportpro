import React from "react";

export function ImportProLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div
      className={`${className} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.72_0.19_240)] to-[oklch(0.52_0.22_255)] shadow-[0_10px_30px_-10px_rgba(59,130,246,0.55)]`}
    >
      <span className="font-display text-lg font-bold tracking-tight text-white">IP</span>
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
    </div>
  );
}

export function ImportProWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ImportProLogo className="h-9 w-9" />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Import<span className="text-primary">Pro</span>
      </span>
    </div>
  );
}
