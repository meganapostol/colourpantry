import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStash } from "../state/StashContext";
import { nameForHex, readableTextOn } from "../lib/color";
import type { Gradient, GradientStop } from "../lib/db";

function toCss(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.hex} ${(s.position * 100).toFixed(0)}%`)
    .join(", ");
  if (g.type === "radial") return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

function gradientFromSwatches(hexes: string[]): Gradient {
  const slice = hexes.slice(0, 4);
  if (slice.length < 2) {
    return {
      type: "linear",
      angle: 135,
      stops: [
        { hex: hexes[0] ?? "#FAF7F2", position: 0 },
        { hex: hexes[0] ?? "#1A1A1A", position: 1 },
      ],
    };
  }
  const stops: GradientStop[] = slice.map((hex, i, arr) => ({
    hex,
    position: arr.length === 1 ? 0 : i / (arr.length - 1),
  }));
  return { type: "linear", angle: 135, stops };
}

export function GradientsPage() {
  const { stash, setGradient, addManySwatches, showToast } = useStash();
  const stashHexes = useMemo(() => stash.swatches.map((s) => s.hex), [stash.swatches]);
  const [gradient, setLocal] = useState<Gradient>(
    () => stash.gradient ?? gradientFromSwatches(stashHexes),
  );
  const [activeStop, setActiveStop] = useState(0);
  const [copiedLabel, setCopiedLabel] = useState("Copy CSS");

  useEffect(() => {
    if (stash.gradient) setLocal(stash.gradient);
  }, [stash.gradient]);

  const css = useMemo(() => toCss(gradient), [gradient]);
  const activeHex = gradient.stops[activeStop]?.hex;
  const activeIsInStash = activeHex
    ? stashHexes.some((h) => h.toUpperCase() === activeHex.toUpperCase())
    : false;

  const updateStop = (i: number, patch: Partial<GradientStop>) => {
    setLocal((g) => ({
      ...g,
      stops: g.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  };

  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    const sorted = [...gradient.stops].sort((a, b) => a.position - b.position);
    const last = sorted[sorted.length - 1];
    const nextHex = stashHexes.find(
      (h) => !gradient.stops.some((s) => s.hex.toUpperCase() === h.toUpperCase()),
    ) || last.hex;
    setLocal((g) => ({
      ...g,
      stops: [
        ...g.stops,
        { hex: nextHex, position: Math.min(1, last.position + 0.2) },
      ],
    }));
    setActiveStop(gradient.stops.length);
  };

  const removeStop = (i: number) => {
    if (gradient.stops.length <= 2) return;
    setLocal((g) => ({ ...g, stops: g.stops.filter((_, j) => j !== i) }));
    setActiveStop((a) => Math.max(0, Math.min(a, gradient.stops.length - 2)));
  };

  const onCopy = () => {
    try {
      navigator.clipboard?.writeText(`background: ${css};`);
      setCopiedLabel("Copied!");
      setTimeout(() => setCopiedLabel("Copy CSS"), 1200);
    } catch {
      setCopiedLabel("Failed");
      setTimeout(() => setCopiedLabel("Copy CSS"), 1200);
    }
  };

  const saveToStash = () => {
    setGradient(gradient);
    showToast("Gradient saved to stash");
  };

  const sendToSwatches = () => {
    addManySwatches(gradient.stops.map((s) => s.hex));
    showToast(`${gradient.stops.length} stops added to stash`);
  };

  const useStashColors = () => {
    if (stashHexes.length < 2) return;
    setLocal(gradientFromSwatches(stashHexes));
    setActiveStop(0);
  };

  // Empty state when there isn't enough in the stash to compose a gradient
  if (stashHexes.length < 2) {
    return (
      <div className="canvas-grain h-full overflow-y-auto scroll-thin">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-6">
            <span className="eyebrow text-muted-light dark:text-muted-dark">pour</span>
            <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark mt-1">
              Compose a gradient.
            </h1>
            <p className="text-[12px] text-muted-light dark:text-muted-dark mt-1.5 max-w-xl leading-snug">
              Compose a gradient from the colours in your stash. Copy as CSS, save the
              image, or send the stops back as swatches.
            </p>
          </div>

          <div className="rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-6">
            <h2 className="font-display font-medium text-lg tracking-tight text-ink-light dark:text-ink-dark">
              You need at least two colours in your stash first.
            </h2>
            <p className="text-[13px] text-muted-light dark:text-muted-dark mt-2 leading-relaxed">
              Gradients are composed from the colours you've collected, so the result
              stays in the same family as the rest of your work. Pick some up first.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link
                to="/"
                className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
              >
                Browse hue families
              </Link>
              <Link
                to="/generate"
                className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
              >
                Mix a palette
              </Link>
              <Link
                to="/library"
                className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
              >
                Browse recipes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex items-end justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="eyebrow text-muted-light dark:text-muted-dark">pour</span>
            <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
              Compose a gradient.
            </h1>
          </div>
          <p className="text-[12px] text-muted-light dark:text-muted-dark mt-1.5 max-w-xl leading-snug">
            Pour your stash colours into a gradient. Click a stop, then pick a swatch
            below to colour it. Copy the CSS, save the image, or send the stops back as
            swatches.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={useStashColors}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            title="Reset stops to the first colours in your stash"
          >
            Reset to stash
          </button>
          <button
            onClick={onCopy}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
          >
            {copiedLabel}
          </button>
          <button
            onClick={sendToSwatches}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
          >
            + Stops to stash
          </button>
          <button
            onClick={saveToStash}
            className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
          >
            Save to stash
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div className="min-w-0 min-h-0 flex flex-col gap-3">
          <div
            className="flex-1 min-h-[200px] rounded-2xl border border-line-light dark:border-line-dark overflow-hidden shadow-soft"
            style={{ background: css }}
          >
            <div className="h-full w-full flex items-end justify-end p-4">
              <div className="bg-black/30 backdrop-blur text-white rounded-md px-3 py-1.5 text-[11px] font-mono">
                {gradient.type} ·{" "}
                {gradient.type === "linear" ? `${gradient.angle}°` : "circle"} ·{" "}
                {gradient.stops.length} stops
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line-light dark:border-line-dark p-3 bg-surface-light/50 dark:bg-surface-dark/50">
            <div className="flex items-center justify-between mb-2">
              <div className="eyebrow text-muted-light dark:text-muted-dark">Stops</div>
              <div className="text-[10px] text-muted-light dark:text-muted-dark">
                click a handle to edit · drag the slider to move it
              </div>
            </div>
            <div className="relative h-10 rounded-md overflow-hidden mb-3" style={{ background: css }}>
              {gradient.stops.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStop(i)}
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${
                    activeStop === i ? "scale-125 border-white shadow-lg" : "border-white/70"
                  }`}
                  style={{
                    left: `calc(${s.position * 100}% - 10px)`,
                    background: s.hex,
                  }}
                  title={`Stop ${i + 1}: ${s.hex} @ ${(s.position * 100).toFixed(0)}%`}
                  aria-label={`Edit stop ${i + 1}`}
                />
              ))}
            </div>
            {gradient.stops[activeStop] && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark">
                    <div
                      className="w-7 h-7 rounded shadow-soft"
                      style={{ background: activeHex }}
                      aria-hidden
                    />
                    <div className="leading-tight">
                      <div className="font-mono text-[12px] font-semibold text-ink-light dark:text-ink-dark">
                        {activeHex}
                      </div>
                      <div className="text-[10px] text-muted-light dark:text-muted-dark">
                        {nameForHex(activeHex)}
                        {!activeIsInStash && " · not in stash"}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[160px] flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-light dark:text-muted-dark w-8">
                      {(gradient.stops[activeStop].position * 100).toFixed(0)}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={gradient.stops[activeStop].position}
                      onChange={(e) =>
                        updateStop(activeStop, { position: parseFloat(e.target.value) })
                      }
                      className="refined-slider flex-1"
                      aria-label="Stop position"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={addStop}
                      disabled={gradient.stops.length >= 5}
                      className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark text-[11px] disabled:opacity-40"
                      title="Add a stop"
                    >
                      + stop
                    </button>
                    <button
                      onClick={() => removeStop(activeStop)}
                      disabled={gradient.stops.length <= 2}
                      className="btn-pill text-muted-light dark:text-muted-dark hover:text-red-500 text-[11px] disabled:opacity-40"
                      title="Remove this stop"
                    >
                      − stop
                    </button>
                  </div>
                </div>

                <div>
                  <div className="eyebrow text-muted-light dark:text-muted-dark mb-1.5 text-[10px]">
                    Pick a colour for this stop
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stash.swatches.map((sw) => {
                      const selected =
                        sw.hex.toUpperCase() === (activeHex || "").toUpperCase();
                      return (
                        <button
                          key={sw.hex}
                          onClick={() => updateStop(activeStop, { hex: sw.hex })}
                          className={`relative w-8 h-8 rounded-md transition-transform hover:scale-110 ${
                            selected ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark z-10" : ""
                          }`}
                          style={{ background: sw.hex, color: readableTextOn(sw.hex) }}
                          title={`${sw.hex} · ${sw.name ?? nameForHex(sw.hex)}`}
                          aria-label={`Use ${sw.hex} for active stop`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-light dark:text-muted-dark mt-2">
                    Need more colours?{" "}
                    <Link to="/" className="underline hover:opacity-70">
                      browse hue families
                    </Link>{" "}
                    or{" "}
                    <Link to="/generate" className="underline hover:opacity-70">
                      mix a palette
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-line-light dark:border-line-dark p-3 bg-surface-light/50 dark:bg-surface-dark/50 overflow-y-auto scroll-thin space-y-4">
          <div>
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">Type</div>
            <div className="flex gap-1.5">
              {(["linear", "radial"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLocal((g) => ({ ...g, type: t }))}
                  className={`flex-1 text-[12px] py-1.5 rounded-md border transition ${
                    gradient.type === t
                      ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark border-transparent"
                      : "border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1.5 leading-snug">
              Linear pours from one side to the other. Radial pours outward from a centre.
            </p>
          </div>

          {gradient.type === "linear" && (
            <div>
              <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">
                Angle · {gradient.angle}°
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={gradient.angle}
                onChange={(e) =>
                  setLocal((g) => ({ ...g, angle: parseInt(e.target.value) }))
                }
                className="refined-slider w-full"
                aria-label="Gradient angle"
              />
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <button
                    key={a}
                    onClick={() => setLocal((g) => ({ ...g, angle: a }))}
                    className="text-[11px] py-1 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark font-mono"
                  >
                    {a}°
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">CSS</div>
            <pre className="text-[10px] font-mono p-2 rounded bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark whitespace-pre-wrap break-all">
              background: {css};
            </pre>
          </div>

          {stash.gradient && (
            <div className="text-[11px] text-muted-light dark:text-muted-dark">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              Saved with stash · matches editor
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
