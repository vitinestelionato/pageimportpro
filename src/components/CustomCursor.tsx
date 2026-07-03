import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    x: -100,
    y: -100,
    rx: -100,
    ry: -100,
    down: false,
    hover: false,
  });

  useEffect(() => {
    // Only enable on devices with a real pointer (desktop)
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("cursor-none-root");

    let raf = 0;
    const s = stateRef.current;

    const isInteractive = (el: Element | null) => {
      if (!el) return false;
      return !!el.closest(
        'a, button, [role="button"], input, select, textarea, label, summary, [data-cursor="hover"]',
      );
    };

    const onFrame = () => {
      raf = 0;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(-18deg) scale(${s.down ? 0.85 : 1})`;
      }
      if (ringRef.current) {
        const scale = s.hover ? 1.9 : 1;
        ringRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(onFrame);
    };

    const onMove = (e: MouseEvent) => {
      s.x = e.clientX;
      s.y = e.clientY;
      schedule();
    };
    const onDown = () => { s.down = true; schedule(); };
    const onUp = () => { s.down = false; schedule(); };
    const onOver = (e: MouseEvent) => {
      const h = isInteractive(e.target as Element);
      if (h !== s.hover) { s.hover = h; schedule(); }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("cursor-none-root");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Ring */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-8 w-8 rounded-full border border-brand-glow/70 will-change-transform"
        style={{ boxShadow: "0 0 18px oklch(0.72 0.22 240 / 0.5)" }}
      />
      {/* Arrow pointer */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] will-change-transform"
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path
            d="M4 3 L22 12 L14 14 L11 22 Z"
            fill="oklch(0.62 0.2 255)"
            stroke="white"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}
