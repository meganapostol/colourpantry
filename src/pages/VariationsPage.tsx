import { useMemo, useState } from "react";
import { useStash } from "../state/StashContext";
import { generateVariations } from "../lib/harmony";
import { readableTextOn } from "../lib/color";
import { Link } from "react-router-dom";

const ROWS: Array<{ key: keyof ReturnType<typeof generateVariations>; label: string; blurb: string }> = [
  { key: "tints", label: "Tints", blurb: "Lighter — add white" },
  { key: "shades", label: "Shades", blurb: "Darker — add black" },
  { key: "tones", label: "Tones", blurb: "Greyed — add neutral" },
  { key: "saturations", label: "Saturations", blurb: "Chroma sweep" },
  { key: "hues", label: "Hue shifts", blurb: "Rotate hue ±30°" },
];

export function VariationsPage() {
  const { stash, addSwatch } = useStash();
  const [selected, setSelected] = useState(0);
  const swatches = stash.swatches;

  const base = swatches[selected]?.hex;
  const variations = useMemo(() => (base ? generateVariations(base, 11) : null), [base]);

  if (swatches.length === 0) {
    return (
      <div className="canvas-grain h-full flex flex-col items-center justify-center px-4 max-w-[1600px] mx-auto w-full">
        <div className="text-center space-y-3 max-w-md">
          <div className="eyebrow text-muted-light dark:text-muted-dark">variations</div>
          <h1 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark display-tight">
            Add a swatch first.
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Tints, shades, tones, hue shifts and saturation sweeps appear here for any color in your stash.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/generate" className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark">
              Generate a palette
            </Link>
            <Link to="/" className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90">
              Pick from a hue family
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-y-auto scroll-thin">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">variations</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Branch from a color.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            click a chip to add it to your stash
          </span>
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap gap-1.5 mb-4 p-1.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-xl">
        {swatches.map((s, i) => {
          const ink = readableTextOn(s.hex);
          const active = i === selected;
          return (
            <button
              key={s.hex}
              onClick={() => setSelected(i)}
              className={`relative px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${active ? "ring-2 ring-offset-1 ring-offset-surface-light dark:ring-offset-surface-dark" : "hover:scale-[1.02]"}`}
              style={{ background: s.hex, color: ink, ...(active ? { boxShadow: "0 0 0 2px currentColor" } : {}) }}
              title={`${s.hex} ${s.name ?? ""}`}
            >
              <span className="font-mono text-[12px] font-semibold">{s.hex}</span>
              {s.name && <span className="text-[10px] opacity-80 truncate max-w-[100px]">{s.name}</span>}
            </button>
          );
        })}
      </div>

      {variations && (
        <div className="space-y-5 pb-4">
          {ROWS.map(({ key, label, blurb }) => {
            const arr = variations[key];
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="eyebrow text-ink-light dark:text-ink-dark">{label}</span>
                    <span className="text-[11px] text-muted-light dark:text-muted-dark">{blurb}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-light dark:text-muted-dark">{arr.length} steps</span>
                </div>
                <div
                  className="grid gap-1 rounded-lg overflow-hidden border border-line-light dark:border-line-dark"
                  style={{ gridTemplateColumns: `repeat(${arr.length}, minmax(0, 1fr))` }}
                >
                  {arr.map((hex) => {
                    const ink = readableTextOn(hex);
                    return (
                      <button
                        key={hex + key}
                        onClick={() => addSwatch(hex)}
                        className="relative aspect-square hover:z-10 hover:scale-105 transition-transform group"
                        style={{ background: hex, color: ink }}
                        aria-label={`Add ${hex}`}
                        title={hex}
                      >
                        <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {hex}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
