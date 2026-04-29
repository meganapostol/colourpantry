import { useMemo, useState } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import {
  SKIN_ROWS,
  generateSkinNeighborhood,
  generateSkinRowSwatches,
  readableTextOn,
} from "../lib/color";
import { useBible } from "../state/BibleContext";

const CELL = 36;

export function SkinPage() {
  const { addSwatch } = useBible();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const matrix = useMemo(
    () => SKIN_ROWS.map((r) => ({ row: r, hexes: generateSkinRowSwatches(r, 12) })),
    [],
  );

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-light dark:text-ink-dark">
          Skin Tones
        </h1>
        <p className="text-sm text-muted-light dark:text-muted-dark mt-1 max-w-2xl">
          Nine undertone rows × twelve depth steps, hand-calibrated in OKLCH for perceptual evenness. Expand any row for the full neighborhood waffle.
        </p>
        <div className="text-xs font-mono text-muted-light dark:text-muted-dark mt-2 h-4">
          {hover ?? ""}
        </div>
      </div>

      <div className="space-y-2">
        {matrix.map(({ row, hexes }) => (
          <div key={row.id} className="border border-line-light dark:border-line-dark rounded-md overflow-hidden bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-line-light dark:border-line-dark">
              <span className="text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark">
                {row.label}
              </span>
              <button
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="text-xs text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
              >
                {expanded === row.id ? "collapse" : "expand →"}
              </button>
            </div>
            <div className="flex">
              {hexes.map((hex) => (
                <button
                  key={hex}
                  className="flex-1 h-12 hover:scale-110 hover:z-10 relative transition-transform"
                  style={{ background: hex, color: readableTextOn(hex) }}
                  onMouseEnter={() => setHover(hex)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => addSwatch(hex)}
                  aria-label={`Add ${hex} to bible`}
                />
              ))}
            </div>
            {expanded === row.id && <NeighborhoodWaffle rowId={row.id} setHover={setHover} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function NeighborhoodWaffle({
  rowId,
  setHover,
}: {
  rowId: string;
  setHover: (h: string | null) => void;
}) {
  const { addSwatch } = useBible();
  const row = SKIN_ROWS.find((r) => r.id === rowId)!;
  const waffle = useMemo(() => generateSkinNeighborhood(row), [row]);
  const cols = waffle[0]?.length ?? 0;
  const rows = waffle.length;
  return (
    <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-line-light dark:border-line-dark">
      <Grid
        columnCount={cols}
        rowCount={rows}
        columnWidth={CELL}
        rowHeight={CELL}
        width={Math.min(cols * CELL + 20, 1100)}
        height={Math.min(rows * CELL, 600)}
      >
        {({ columnIndex, rowIndex, style }) => {
          const cell = waffle[rowIndex][columnIndex];
          if (!cell.hex) return <div style={style} aria-hidden />;
          return (
            <button
              style={{ ...style, background: cell.hex }}
              className="hover:z-10 hover:scale-110 transition-transform"
              onMouseEnter={() => setHover(cell.hex.toUpperCase())}
              onMouseLeave={() => setHover(null)}
              onClick={() => addSwatch(cell.hex)}
              aria-label={`Add ${cell.hex} to bible`}
            />
          );
        }}
      </Grid>
    </div>
  );
}
