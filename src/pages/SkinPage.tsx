import { useMemo, useState } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import {
  SKIN_ROWS,
  generateSkinNeighborhood,
  generateSkinRowSwatches,
} from "../lib/color";
import { useStash } from "../state/StashContext";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

const ROW_SWATCH = 72;
const ROW_GAP = 8;
const DRILL_SWATCH = 48;
const DRILL_GAP = 8;

export function SkinPage() {
  const { addSwatch, recentlyAdded } = useStash();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [popping, setPopping] = useState<string | null>(null);

  const matrix = useMemo(
    () => SKIN_ROWS.map((r) => ({ row: r, hexes: generateSkinRowSwatches(r, 12) })),
    [],
  );

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="px-6 pt-8 pb-8 max-w-[1400px] mx-auto">
        <div className="max-w-3xl mb-10">
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            most comprehensive free skin reference online
          </span>
          <h1 className="display-tight font-display font-medium text-[clamp(2rem,5vw,3.5rem)] text-ink-light dark:text-ink-dark mt-3">
            Skin tones.
          </h1>
          <p className="mt-4 text-base text-muted-light dark:text-muted-dark leading-relaxed">
            Eight undertone rows × twelve depth steps, hand-calibrated in OKLCH for perceptual evenness. Expand any row for the full neighborhood waffle. Click any cell to copy & save.
          </p>
        </div>

        <div className="space-y-3">
          {matrix.map(({ row, hexes }) => {
            const isOpen = expanded === row.id;
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark overflow-hidden shadow-soft"
              >
                <div className="flex items-stretch gap-4 p-3">
                  <div className="w-44 shrink-0 px-3 py-2 flex flex-col justify-center">
                    <span className="eyebrow text-muted-light dark:text-muted-dark text-[10px]">
                      Undertone
                    </span>
                    <h3 className="font-display font-medium text-base text-ink-light dark:text-ink-dark tracking-tight mt-1">
                      {row.label}
                    </h3>
                    <button
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className="mt-2 text-[11px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark inline-flex items-center gap-1 self-start"
                    >
                      {isOpen ? "collapse" : "expand"}
                      <span
                        className="transition-transform"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                      >
                        ↓
                      </span>
                    </button>
                  </div>
                  <div
                    className="flex-1 grid"
                    style={{
                      gridTemplateColumns: `repeat(${hexes.length}, 1fr)`,
                      gap: `${ROW_GAP}px`,
                    }}
                  >
                    {hexes.map((hex) => {
                      const upper = hex.toUpperCase();
                      const isPop = popping === upper;
                      const isRecent = recentlyAdded === upper;
                      return (
                        <button
                          key={hex}
                          className={`rounded-md hover:scale-[1.08] focus-visible:scale-[1.08] focus-visible:outline-none transition-transform ${isPop ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
                          style={{ background: hex, height: ROW_SWATCH }}
                          onMouseEnter={(e) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            showHexTooltip(hex, r.left + r.width / 2, r.bottom);
                          }}
                          onMouseLeave={hideHexTooltip}
                          onFocus={(e) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            showHexTooltip(hex, r.left + r.width / 2, r.bottom);
                          }}
                          onBlur={hideHexTooltip}
                          onClick={() => {
                            addSwatch(hex);
                            setPopping(upper);
                            window.setTimeout(() => setPopping(null), 200);
                          }}
                          aria-label={`Add ${upper} to stash`}
                        />
                      );
                    })}
                  </div>
                </div>
                {isOpen && (
                  <NeighborhoodWaffle
                    rowId={row.id}
                    onPop={(h) => {
                      setPopping(h);
                      window.setTimeout(() => setPopping(null), 200);
                    }}
                    popping={popping}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NeighborhoodWaffle({
  rowId,
  popping,
  onPop,
}: {
  rowId: string;
  popping: string | null;
  onPop: (h: string) => void;
}) {
  const { addSwatch, recentlyAdded } = useStash();
  const row = SKIN_ROWS.find((r) => r.id === rowId)!;
  const waffle = useMemo(() => generateSkinNeighborhood(row), [row]);
  const cols = waffle[0]?.length ?? 0;
  const rows = waffle.length;
  const pitch = DRILL_SWATCH + DRILL_GAP;
  return (
    <div className="p-4 bg-canvas-light dark:bg-canvas-dark border-t border-line-light dark:border-line-dark animate-fade-in">
      <Grid
        columnCount={cols}
        rowCount={rows}
        columnWidth={pitch}
        rowHeight={pitch}
        width={Math.min(cols * pitch + 24, 1100)}
        height={Math.min(rows * pitch, 480)}
      >
        {({ columnIndex, rowIndex, style }) => {
          const cell = waffle[rowIndex][columnIndex];
          if (!cell.hex) return <div style={style} aria-hidden />;
          const hex = cell.hex.toUpperCase();
          const isPop = popping === hex;
          const isRecent = recentlyAdded === hex;
          return (
            <div style={style} className="p-1">
              <button
                className={`w-full h-full rounded-md hover:scale-[1.08] focus-visible:scale-[1.08] focus-visible:outline-none transition-transform ${isPop ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
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
                  onPop(hex);
                }}
                aria-label={`Add ${hex} to stash`}
              />
            </div>
          );
        }}
      </Grid>
    </div>
  );
}
