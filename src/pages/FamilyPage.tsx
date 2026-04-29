import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import {
  generateFamilyWaffle,
  getFamilyById,
  maxChromaForFamily,
} from "../lib/color";
import { useStash } from "../state/StashContext";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

const SWATCH = 48;
const GAP = 8;
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
  const [chromaLevel, setChromaLevel] = useState(() => Math.min(maxC, 0.18));

  const waffle = useMemo(
    () => (family ? generateFamilyWaffle(family.centerHue, chromaLevel) : []),
    [family, chromaLevel],
  );

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
  const gridWidth = cols * PITCH + GAP;
  const gridHeight = Math.min(rows * PITCH + GAP, 760);

  return (
    <div className="canvas-grain min-h-full">
      <div className="px-6 pt-10 pb-12 max-w-[1400px] mx-auto">
        <div className="flex items-baseline gap-3 mb-2">
          <Link
            to="/"
            className="text-[13px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            ← all families
          </Link>
          <span className="text-muted-light dark:text-muted-dark">/</span>
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            family
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-5 mb-8">
          <div
            className="w-16 h-16 rounded-md shadow-soft"
            style={{ background: family.representativeHex }}
            aria-hidden
          />
          <div>
            <h1 className="display-tight font-display font-medium text-5xl text-ink-light dark:text-ink-dark">
              {family.name}
            </h1>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-1.5">
              Hue {family.centerHue}° ± 7.5° · {cols} hue × {rows} lightness · chroma {chromaLevel.toFixed(3)}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark p-3 shadow-soft inline-block">
            <Grid
              columnCount={cols}
              rowCount={rows}
              columnWidth={PITCH}
              rowHeight={PITCH}
              width={gridWidth + 24}
              height={gridHeight}
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
                  <div style={style} className="p-1">
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
          </div>

          <div className="w-full lg:w-64 shrink-0 space-y-4">
            <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark p-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="eyebrow text-muted-light dark:text-muted-dark">
                  Chroma
                </span>
                <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark">
                  {chromaLevel.toFixed(3)} / {maxC.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxC}
                step={0.005}
                value={chromaLevel}
                onChange={(e) => setChromaLevel(parseFloat(e.target.value))}
                className="refined-slider"
                aria-label="Chroma level"
                style={{ color: family.representativeHex }}
              />
              <p className="text-[11px] text-muted-light dark:text-muted-dark mt-3 leading-relaxed">
                Slide to walk through saturation. Out-of-gamut cells are hidden — that's honest about the math.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark p-5 text-[12px] text-muted-light dark:text-muted-dark leading-relaxed">
              Hover any swatch for the hex. Click to copy & save to your stash.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
