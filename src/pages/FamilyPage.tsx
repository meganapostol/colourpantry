import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  generateFamilyWaffle,
  getFamilyById,
  maxChromaForFamily,
} from "../lib/color";
import { useStash } from "../state/StashContext";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

const GAP = 6;
const MIN_CELL = 24;
const MAX_CELL = 64;

export function FamilyPage() {
  const { familyId = "" } = useParams();
  const family = getFamilyById(familyId);
  const { addSwatch, recentlyAdded } = useStash();
  const [popping, setPopping] = useState<string | null>(null);

  const maxC = useMemo(
    () => (family ? maxChromaForFamily(family.centerHue) : 0.3),
    [family],
  );
  const [chromaLevel, setChromaLevel] = useState(() => Math.min(maxC * 0.4, 0.1));

  const waffle = useMemo(
    () => (family ? generateFamilyWaffle(family.centerHue, chromaLevel) : []),
    [family, chromaLevel],
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 800, h: 500 });
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!family) {
    return (
      <div className="p-12 max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-muted-light dark:text-muted-dark hover:underline">
          ← back home
        </Link>
        <p className="mt-4 text-ink-light dark:text-ink-dark">Unknown family.</p>
      </div>
    );
  }

  const rows = waffle.length;
  const cols = waffle[0]?.length ?? 0;

  // Compute optimal cell size so the entire waffle fits without scroll,
  // but never below MIN_CELL or above MAX_CELL.
  const cellByWidth = cols > 0 ? (size.w - GAP) / cols - GAP : MIN_CELL;
  const cellByHeight = rows > 0 ? (size.h - GAP) / rows - GAP : MIN_CELL;
  const cell = Math.max(
    MIN_CELL,
    Math.min(MAX_CELL, Math.floor(Math.min(cellByWidth, cellByHeight))),
  );
  const gridW = cols * (cell + GAP) + GAP;
  const gridH = rows * (cell + GAP) + GAP;

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 pb-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors shrink-0"
          >
            ← all families
          </Link>
          <span className="text-muted-light dark:text-muted-dark shrink-0">/</span>
          <div
            className="w-7 h-7 rounded shrink-0"
            style={{ background: family.representativeHex }}
            aria-hidden
          />
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none truncate">
            {family.name}
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline shrink-0">
            {family.centerHue}° ± 7.5° · {cols}×{rows}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pb-2 shrink-0 rounded-lg bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark px-3 py-1.5">
        <span className="eyebrow text-muted-light dark:text-muted-dark text-[10px] shrink-0">
          Chroma
        </span>
        <input
          type="range"
          min={0}
          max={maxC}
          step={0.005}
          value={chromaLevel}
          onChange={(e) => setChromaLevel(parseFloat(e.target.value))}
          className="refined-slider flex-1"
          aria-label="Chroma level"
          style={{ color: family.representativeHex }}
        />
        <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark tabular-nums shrink-0 w-24 text-right">
          {chromaLevel.toFixed(3)} / {maxC.toFixed(3)}
        </span>
      </div>

      <div
        ref={wrapRef}
        className="flex-1 min-h-0 rounded-lg overflow-hidden flex items-center justify-center"
      >
        {size.w > 0 && cols > 0 && rows > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
              gridTemplateRows: `repeat(${rows}, ${cell}px)`,
              gap: `${GAP}px`,
              width: gridW - GAP,
              height: gridH - GAP,
            }}
          >
            {waffle.flatMap((row, rIdx) =>
              row.map((c, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                if (!c.hex) {
                  return <div key={key} aria-hidden />;
                }
                const hex = c.hex.toUpperCase();
                const isPopping = popping === c.hex;
                const isRecent = recentlyAdded === hex;
                return (
                  <button
                    key={key}
                    className={`rounded-md hover:scale-[1.08] focus-visible:scale-[1.08] focus-visible:outline-none transition-transform ${isPopping ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
                    style={{ background: c.hex }}
                    onMouseEnter={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      showHexTooltip(c.hex, r.left + r.width / 2, r.bottom);
                    }}
                    onMouseLeave={hideHexTooltip}
                    onFocus={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      showHexTooltip(c.hex, r.left + r.width / 2, r.bottom);
                    }}
                    onBlur={hideHexTooltip}
                    onClick={() => {
                      addSwatch(c.hex);
                      setPopping(c.hex);
                      window.setTimeout(() => setPopping(null), 200);
                    }}
                    aria-label={`Add ${hex} to stash`}
                  />
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
