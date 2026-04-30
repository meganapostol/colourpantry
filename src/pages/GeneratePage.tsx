import { useCallback, useEffect, useMemo, useState } from "react";
import { generatePalette, HARMONY_RULES, type HarmonyRule } from "../lib/harmony";
import { nameForHex, readableTextOn } from "../lib/color";
import { useStash } from "../state/StashContext";

const MIN = 3;
const MAX = 10;

export function GeneratePage() {
  const { addManySwatches, replaceSwatches, addSwatch, showToast } = useStash();
  const [rule, setRule] = useState<HarmonyRule>("analogous");
  const [count, setCount] = useState(5);
  const [colors, setColors] = useState<string[]>(() =>
    generatePalette({ rule: "analogous", count: 5 }),
  );
  const [locked, setLocked] = useState<boolean[]>(() => Array(5).fill(false));
  const [popping, setPopping] = useState<number | null>(null);

  const regenerate = useCallback(() => {
    setColors((prev) => {
      const next = generatePalette({
        rule,
        count,
        existing: prev,
        locked,
      });
      return next;
    });
  }, [rule, count, locked]);

  // Sync arrays when count changes
  useEffect(() => {
    setColors((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const seed = prev[0];
      const extra = generatePalette({
        rule,
        count: count - prev.length,
        baseHex: seed,
      });
      return [...prev, ...extra];
    });
    setLocked((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      return [...prev, ...Array(count - prev.length).fill(false)];
    });
  }, [count, rule]);

  // Spacebar regenerates (excluding inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      regenerate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate]);

  const toggleLock = (i: number) => {
    setLocked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const onCopyHex = (i: number, hex: string) => {
    try {
      navigator.clipboard?.writeText(hex);
    } catch {
      /* noop */
    }
    setPopping(i);
    window.setTimeout(() => setPopping(null), 200);
    showToast(`${hex} copied`);
  };

  const onAddOne = (hex: string) => {
    addSwatch(hex);
  };

  const saveAsStash = () => {
    replaceSwatches(colors);
    showToast(`${colors.length} swatches replaced your stash`);
  };

  const appendToStash = () => {
    addManySwatches(colors);
    showToast(`${colors.length} swatches added to stash`);
  };

  const ruleMeta = useMemo(
    () => HARMONY_RULES.find((r) => r.id === rule)!,
    [rule],
  );

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">generate</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Make a palette.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            {ruleMeta.blurb} · press <kbd className="px-1.5 py-0.5 rounded border border-line-light dark:border-line-dark font-mono text-[10px]">space</kbd> to shuffle
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={rule}
            onChange={(e) => setRule(e.target.value as HarmonyRule)}
            className="text-[12px] bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full px-3 py-1.5 text-ink-light dark:text-ink-dark cursor-pointer hover:bg-canvas-light dark:hover:bg-canvas-dark"
            title="Harmony rule"
          >
            {HARMONY_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full">
            <span className="text-[11px] text-muted-light dark:text-muted-dark uppercase tracking-wider">colors</span>
            <button
              onClick={() => setCount((c) => Math.max(MIN, c - 1))}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-canvas-light dark:hover:bg-canvas-dark text-ink-light dark:text-ink-dark"
              aria-label="Fewer colors"
            >
              −
            </button>
            <span className="font-mono text-[12px] text-ink-light dark:text-ink-dark w-3 text-center">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(MAX, c + 1))}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-canvas-light dark:hover:bg-canvas-dark text-ink-light dark:text-ink-dark"
              aria-label="More colors"
            >
              +
            </button>
          </div>
          <button
            onClick={regenerate}
            className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
            title="Regenerate (space)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Shuffle
          </button>
          <button
            onClick={appendToStash}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            title="Add all to current stash"
          >
            + Stash
          </button>
          <button
            onClick={saveAsStash}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            title="Replace stash with this palette"
          >
            Replace
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-1.5 rounded-2xl overflow-hidden border border-line-light dark:border-line-dark shadow-soft"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {colors.map((hex, i) => {
          const ink = readableTextOn(hex);
          const isLocked = locked[i];
          const isPop = popping === i;
          return (
            <div
              key={`${i}-${hex}`}
              className={`relative group flex flex-col justify-end p-4 transition-transform ${isPop ? "swatch-pop" : ""}`}
              style={{ background: hex, color: ink }}
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleLock(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-110 transition-transform"
                  style={{
                    background: isLocked
                      ? ink === "#1A1A1A"
                        ? "rgba(0,0,0,0.15)"
                        : "rgba(255,255,255,0.25)"
                      : "transparent",
                  }}
                  aria-label={isLocked ? "Unlock color" : "Lock color"}
                  title={isLocked ? "Unlock (will change on shuffle)" : "Lock (will keep on shuffle)"}
                >
                  {isLocked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onCopyHex(i, hex)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-110 transition-transform"
                  style={{ background: "transparent" }}
                  aria-label={`Copy ${hex}`}
                  title="Copy hex"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                </button>
                <button
                  onClick={() => onAddOne(hex)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-110 transition-transform"
                  style={{ background: "transparent" }}
                  aria-label={`Add ${hex} to stash`}
                  title="Add to stash"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <div className="font-mono text-[15px] font-semibold tracking-tight">
                {hex}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5 truncate">
                {nameForHex(hex)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-muted-light dark:text-muted-dark">
        Tip: lock colors you like before shuffling — only unlocked stripes change.
      </div>
    </div>
  );
}
