import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import {
  generateFamilyWaffle,
  getFamilyById,
  maxChromaForFamily,
  readableTextOn,
} from "../lib/color";
import { useBible } from "../state/BibleContext";

const CELL = 32;

export function FamilyPage() {
  const { familyId = "" } = useParams();
  const family = getFamilyById(familyId);
  const { addSwatch } = useBible();
  const [hover, setHover] = useState<string | null>(null);
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
      <div className="p-8">
        <Link to="/" className="text-sm text-muted-light dark:text-muted-dark hover:underline">
          ← back home
        </Link>
        <p className="mt-4">Unknown family.</p>
      </div>
    );
  }

  const rows = waffle.length;
  const cols = waffle[0]?.length ?? 0;
  const gridWidth = cols * CELL;
  const gridHeight = Math.min(rows * CELL, 720);

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            to="/"
            className="text-xs text-muted-light dark:text-muted-dark hover:underline"
          >
            ← all families
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-light dark:text-ink-dark mt-1">
            {family.name}
          </h1>
          <p className="text-xs text-muted-light dark:text-muted-dark">
            Hue {family.centerHue}° ± 7.5° · {cols} hue × {rows} lightness steps
          </p>
        </div>
        <div className="text-xs font-mono text-muted-light dark:text-muted-dark">
          {hover ?? "click a swatch"}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="bg-neutral-100 dark:bg-neutral-900 p-3 rounded-md border border-line-light dark:border-line-dark">
          <Grid
            columnCount={cols}
            rowCount={rows}
            columnWidth={CELL}
            rowHeight={CELL}
            width={gridWidth + 20}
            height={gridHeight}
          >
            {({ columnIndex, rowIndex, style }) => {
              const cell = waffle[rowIndex][columnIndex];
              if (!cell.hex) {
                return (
                  <div
                    style={style}
                    className="bg-transparent"
                    aria-hidden
                  />
                );
              }
              const isPopping = popping === cell.hex;
              return (
                <button
                  style={{ ...style, background: cell.hex }}
                  className={`hover:z-10 hover:scale-110 transition-transform relative outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${isPopping ? "swatch-pop" : ""}`}
                  onMouseEnter={() => setHover(cell.hex.toUpperCase())}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    addSwatch(cell.hex);
                    setPopping(cell.hex);
                    window.setTimeout(() => setPopping(null), 300);
                  }}
                  aria-label={`Add ${cell.hex} to bible`}
                />
              );
            }}
          </Grid>
        </div>

        <div className="w-44 shrink-0">
          <label className="block text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark mb-2">
            Chroma
          </label>
          <input
            type="range"
            min={0}
            max={maxC}
            step={0.005}
            value={chromaLevel}
            onChange={(e) => setChromaLevel(parseFloat(e.target.value))}
            className="w-full"
            aria-label="Chroma level"
            style={{ accentColor: family.representativeHex }}
          />
          <div className="text-xs font-mono text-muted-light dark:text-muted-dark mt-1">
            C = {chromaLevel.toFixed(3)} / {maxC.toFixed(3)}
          </div>

          {hover && (
            <div className="mt-6 p-3 rounded-md border border-line-light dark:border-line-dark">
              <div
                className="w-full h-12 rounded mb-2"
                style={{
                  background: hover,
                  color: readableTextOn(hover),
                }}
              />
              <div className="font-mono text-sm text-ink-light dark:text-ink-dark">
                {hover}
              </div>
              <div className="text-[10px] text-muted-light dark:text-muted-dark mt-1">
                click adds to bible
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
