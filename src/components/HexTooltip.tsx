import { useEffect, useState } from "react";

interface TooltipState {
  hex: string;
  x: number;
  y: number;
}

let setActive: ((s: TooltipState | null) => void) | null = null;

export function showHexTooltip(hex: string, x: number, y: number) {
  setActive?.({ hex: hex.toUpperCase(), x, y });
}

export function hideHexTooltip() {
  setActive?.(null);
}

export function HexTooltip() {
  const [s, set] = useState<TooltipState | null>(null);

  useEffect(() => {
    setActive = set;
    return () => {
      setActive = null;
    };
  }, []);

  if (!s) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 translate-y-2 px-2 py-0.5 rounded-full bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark font-mono text-[11px] tracking-tight shadow-lift"
      style={{ left: s.x, top: s.y }}
    >
      {s.hex}
    </div>
  );
}
