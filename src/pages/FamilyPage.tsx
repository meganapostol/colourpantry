import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import {
  generateFamilyWaffle,
  getFamilyById,
  maxChromaForFamily,
} from "../lib/color";
import { useStash } from "../state/StashContext";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

const SWATCH = 40;
const GAP = 6;
const PITCH = SWATCH + GAP;

export function FamilyPage() {
  const { familyId = "" } = useParams();
  const family = getFamilyById(familyId);
  const { addSwatch, recentlyAdded } = useStash();
  const [popping, setPopping] = useState<string | null>(null);

  const maxC = useMemo(
    () => (family ? maxChromaForFamily(family.centerHue) : 0.3),
    [family],
  );
  // Default to ~40% of max chroma so most cells render in-gamut
  const [chromaLevel, setChromaLevel] = useState(() => Math.min(maxC * 0.4, 0.1));

  const waffle = useMemo(
    () => (family ? generateFamilyWaffle(family.centerHue, chromaLevel) : []),
    [family, chromaLevel],
  );

  // Measure available space for the grid so it never causes page scroll
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

  return (
    <div className="canvas-grain h-full flex flex-col px-6 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      {/* Compact header strip */}
      <div className="flex items-center justify-between gap-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors shrink-0"
          >
            ← all families
          </Link>
          <span className="text-muted-light dark:text-muted-dark shrink-0">/</span>
          <div
            className="w-8 h-8 rounded shrink-0 shadow-soft"
            style={{ background: family.representativeHex }}
            aria-hidden
          />
          <h1 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark leading-none truncate">
            {family.name}
          </h1>
          <span className="text-[12px] text-muted-light dark:text-muted-dark hidden md:inline shrink-0">
            hue {family.centerHue}° ± 7.5° · {cols}×{rows}
          </span>
        </div>
      </div>

      {/* Horizontal control bar */}
      <div className="flex items-center gap-4 pb-3 shrink-0 rounded-xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark px-4 py-2.5">
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
        <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark tabular-nums shrink-0 w-28 text-right">
          {chromaLevel.toFixed(3)} / {maxC.toFixed(3)}
        </span>
      </div>

      {/* Waffle — fills remaining viewport */}
      <div
        ref={wrapRef}
        className="flex-1 min-h-0 rounded-xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark p-2 overflow-hidden"
      >
        {size.w > 0 && (
          <Grid
            columnCount={cols}
            rowCount={rows}
            columnWidth={PITCH}
            rowHeight={PITCH}
            width={size.w - 16}
            height={size.h - 16}
          >
            {({ columnIndex, rowIndex, style }) => {
              const cell = waffle[rowIndex][columnIndex];
              if (!cell.hex) {
                return <div style={style} aria-hidden />;
              }
              const hex = cell.hex.toUpperCase();
              const isPopping = popping === cell.hex;
              const isRecent = recentlyAdded === hex;
              return (
                <div style={style} className="p-[3px]">
                  <button
                    className={`w-full h-full rounded-md hover:scale-[1.08] focus-visible:scale-[1.08] focus-visible:outline-none transition-transform ${isPopping ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
                    style={{ background: cell.hex }}
                    onMouseEnter={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      showHexTooltip(cell.hex, r.left + r.width / 2, r.bottom);
                    }}
                    onMouseLeave={hideHexTooltip}
                    onFocus={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      showHexTooltip(cell.hex, r.left + r.width / 2, r.bottom);
                    }}
                    onBlur={hideHexTooltip}
                    onClick={() => {
                      addSwatch(cell.hex);
                      setPopping(cell.hex);
                      window.setTimeout(() => setPopping(null), 200);
                    }}
                    aria-label={`Add ${hex} to stash`}
                  />
                </div>
              );
            }}
          </Grid>
        )}
      </div>
    </div>
  );
}
