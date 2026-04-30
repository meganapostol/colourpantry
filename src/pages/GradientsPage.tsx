import { useEffect, useMemo, useState } from "react";
import { useStash } from "../state/StashContext";
import type { Gradient, GradientStop } from "../lib/db";

function toCss(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.hex} ${(s.position * 100).toFixed(0)}%`)
    .join(", ");
  if (g.type === "radial") return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

function defaultGradient(swatches: string[]): Gradient {
  if (swatches.length >= 2) {
    const stops: GradientStop[] = swatches.slice(0, 4).map((hex, i, arr) => ({
      hex,
      position: arr.length === 1 ? 0 : i / (arr.length - 1),
    }));
    return { type: "linear", angle: 135, stops };
  }
  return {
    type: "linear",
    angle: 135,
    stops: [
      { hex: "#D4A574", position: 0 },
      { hex: "#1A1A1A", position: 1 },
    ],
  };
}

export function GradientsPage() {
  const { stash, setGradient, addManySwatches, showToast } = useStash();
  const [gradient, setLocal] = useState<Gradient>(() => stash.gradient ?? defaultGradient(stash.swatches.map((s) => s.hex)));
  const [activeStop, setActiveStop] = useState(0);
  const [copiedLabel, setCopiedLabel] = useState("Copy CSS");

  // Keep in sync if stash gradient externally updates
  useEffect(() => {
    if (stash.gradient) setLocal(stash.gradient);
  }, [stash.gradient]);

  const css = useMemo(() => toCss(gradient), [gradient]);

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
    setLocal((g) => ({
      ...g,
      stops: [...g.stops, { hex: last.hex, position: Math.min(1, last.position + 0.2) }],
    }));
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
    if (stash.swatches.length < 2) return;
    setLocal(defaultGradient(stash.swatches.map((s) => s.hex)));
  };

  const presets: Gradient[] = [
    { type: "linear", angle: 135, stops: [{ hex: "#FF6B6B", position: 0 }, { hex: "#FFD93D", position: 1 }] },
    { type: "linear", angle: 90, stops: [{ hex: "#0F2027", position: 0 }, { hex: "#2C5364", position: 1 }] },
    { type: "linear", angle: 45, stops: [{ hex: "#fbc2eb", position: 0 }, { hex: "#a6c1ee", position: 1 }] },
    { type: "linear", angle: 180, stops: [{ hex: "#1A2980", position: 0 }, { hex: "#26D0CE", position: 1 }] },
    { type: "radial", angle: 0, stops: [{ hex: "#FFE0B2", position: 0 }, { hex: "#7B2D26", position: 1 }] },
    { type: "linear", angle: 135, stops: [{ hex: "#0F0524", position: 0 }, { hex: "#FF2E97", position: 0.5 }, { hex: "#3FB6FF", position: 1 }] },
    { type: "linear", angle: 90, stops: [{ hex: "#FAF7F2", position: 0 }, { hex: "#D4A574", position: 0.5 }, { hex: "#1A1A1A", position: 1 }] },
    { type: "linear", angle: 135, stops: [{ hex: "#3D2817", position: 0 }, { hex: "#C8714A", position: 0.5 }, { hex: "#F2E5D0", position: 1 }] },
  ];

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">gradients</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Compose a gradient.
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={useStashColors}
            disabled={stash.swatches.length < 2}
            className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-40"
            title="Use first colors from your stash"
          >
            Use stash colors
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

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_320px] gap-3">
        <div className="min-w-0 min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0 rounded-2xl border border-line-light dark:border-line-dark overflow-hidden shadow-soft" style={{ background: css }}>
            <div className="h-full w-full flex items-end justify-end p-4">
              <div className="bg-black/30 backdrop-blur text-white rounded-md px-3 py-1.5 text-[11px] font-mono">
                {gradient.type} · {gradient.type === "linear" ? `${gradient.angle}°` : "circle"} · {gradient.stops.length} stops
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line-light dark:border-line-dark p-3 bg-surface-light/50 dark:bg-surface-dark/50">
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">Stops</div>
            <div className="relative h-10 rounded-md overflow-hidden mb-3" style={{ background: css }}>
              {[...gradient.stops]
                .map((s, i) => ({ ...s, _i: i }))
                .map((s) => (
                  <button
                    key={s._i}
                    onClick={() => setActiveStop(s._i)}
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${
                      activeStop === s._i ? "scale-125 border-white shadow-lg" : "border-white/70"
                    }`}
                    style={{
                      left: `calc(${s.position * 100}% - 10px)`,
                      background: s.hex,
                    }}
                    title={`Stop ${s._i + 1}: ${s.hex} @ ${(s.position * 100).toFixed(0)}%`}
                  />
                ))}
            </div>
            {gradient.stops[activeStop] && (
              <div className="grid grid-cols-[140px_1fr_auto] gap-2 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={gradient.stops[activeStop].hex}
                    onChange={(e) => updateStop(activeStop, { hex: e.target.value.toUpperCase() })}
                    className="w-8 h-8 rounded cursor-pointer border border-line-light dark:border-line-dark"
                  />
                  <input
                    type="text"
                    value={gradient.stops[activeStop].hex}
                    onChange={(e) => updateStop(activeStop, { hex: e.target.value.toUpperCase() })}
                    className="flex-1 font-mono text-[12px] bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark rounded px-2 py-1.5 text-ink-light dark:text-ink-dark"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={gradient.stops[activeStop].position}
                  onChange={(e) => updateStop(activeStop, { position: parseFloat(e.target.value) })}
                  className="refined-slider"
                />
                <div className="flex gap-1">
                  <button
                    onClick={addStop}
                    disabled={gradient.stops.length >= 5}
                    className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark text-[11px] disabled:opacity-40"
                  >
                    + stop
                  </button>
                  <button
                    onClick={() => removeStop(activeStop)}
                    disabled={gradient.stops.length <= 2}
                    className="btn-pill text-muted-light dark:text-muted-dark hover:text-red-500 text-[11px] disabled:opacity-40"
                  >
                    − stop
                  </button>
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
          </div>

          {gradient.type === "linear" && (
            <div>
              <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">Angle · {gradient.angle}°</div>
              <input
                type="range"
                min={0}
                max={360}
                value={gradient.angle}
                onChange={(e) => setLocal((g) => ({ ...g, angle: parseInt(e.target.value) }))}
                className="refined-slider w-full"
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

          <div>
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2">Presets</div>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setLocal({ ...p, stops: p.stops.map((s) => ({ ...s })) })}
                  className="aspect-[2/1] rounded-md border border-line-light dark:border-line-dark transition-transform hover:scale-105"
                  style={{ background: toCss(p) }}
                  aria-label={`Apply preset ${i + 1}`}
                />
              ))}
            </div>
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
