import { useEffect, useMemo, useRef, useState } from "react";
import chroma from "chroma-js";
import { useStash } from "../state/StashContext";
import { hexToRgbString, nameForHex, readableTextOn } from "../lib/color";
import { generatePalette, HARMONY_RULES, type HarmonyRule } from "../lib/harmony";
import { CVD_MODES } from "../state/CVDContext";
import { CURATED_PALETTES } from "../lib/curated";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

type Season = "spring" | "summer" | "autumn" | "winter";
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

const NEIGHBOR_HARMONIES: HarmonyRule[] = [
  "monochromatic",
  "analogous",
  "complementary",
  "split-complementary",
  "triadic",
  "tetradic",
  "shades",
];

function normalizeHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null;
  if (trimmed.length === 3) {
    const expanded = trimmed
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (trimmed.length === 6) return `#${trimmed.toUpperCase()}`;
  if (trimmed.length === 8) return `#${trimmed.slice(0, 6).toUpperCase()}`;
  return null;
}

function clampInGamutHex(L: number, C: number, H: number): string {
  let col = chroma.oklch(L, C, H);
  if (col.clipped()) {
    let cAdj = C;
    while (cAdj > 0 && col.clipped()) {
      cAdj -= 0.005;
      col = chroma.oklch(L, cAdj, H);
    }
  }
  return col.hex().toUpperCase();
}

interface NeighborCell {
  hex: string;
  isCenter: boolean;
}

function buildNeighborStrip(hex: string, cols = 17): NeighborCell[] {
  const [Lraw, Craw, Hraw] = chroma(hex).oklch();
  const baseL = Number.isFinite(Lraw) ? Lraw : 0.55;
  const baseC = Number.isFinite(Craw) ? Math.max(0.02, Craw) : 0.08;
  const baseH = Number.isFinite(Hraw) ? Hraw : 0;
  const hSpan = 60;
  const out: NeighborCell[] = [];
  const mid = Math.floor(cols / 2);
  for (let c = 0; c < cols; c++) {
    const tH = c / Math.max(1, cols - 1) - 0.5;
    const Hr = (baseH + tH * hSpan + 360) % 360;
    const isCenter = c === mid;
    const cellHex = isCenter ? hex.toUpperCase() : clampInGamutHex(baseL, baseC, Hr);
    out.push({ hex: cellHex, isCenter });
  }
  return out;
}

interface SeasonalMatch {
  paletteId: string;
  name: string;
  hexes: string[];
  closestHex: string;
  closestDelta: number;
  season: Season;
}

function findSeasonalMatches(target: string): Record<Season, SeasonalMatch[]> {
  const out: Record<Season, SeasonalMatch[]> = {
    spring: [],
    summer: [],
    autumn: [],
    winter: [],
  };
  const tColor = chroma(target);
  for (const palette of CURATED_PALETTES) {
    const seasonsHere = palette.tags.filter((t): t is Season =>
      (SEASONS as string[]).includes(t),
    );
    if (seasonsHere.length === 0) continue;
    let bestHex = palette.hexes[0];
    let bestDelta = Infinity;
    for (const h of palette.hexes) {
      const d = chroma.deltaE(tColor, chroma(h));
      if (d < bestDelta) {
        bestDelta = d;
        bestHex = h;
      }
    }
    for (const season of seasonsHere) {
      out[season].push({
        paletteId: palette.id,
        name: palette.name,
        hexes: palette.hexes,
        closestHex: bestHex,
        closestDelta: bestDelta,
        season,
      });
    }
  }
  for (const k of SEASONS) {
    out[k].sort((a, b) => a.closestDelta - b.closestDelta);
    out[k] = out[k].slice(0, 6);
  }
  return out;
}

export function LookupPage() {
  const { addSwatch, addManySwatches, showToast } = useStash();
  const [input, setInput] = useState("#D4A574");
  const [hex, setHex] = useState("#D4A574");
  const [harmony, setHarmony] = useState<HarmonyRule>("monochromatic");
  const [seasonTab, setSeasonTab] = useState<Season>("autumn");
  const [pickerImage, setPickerImage] = useState<string | null>(null);
  const [magnifier, setMagnifier] = useState<{
    x: number;
    y: number;
    bgX: number;
    bgY: number;
    bgW: number;
    bgH: number;
    previewHex: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const MAG_SIZE = 130;
  const MAG_ZOOM = 8;

  const onFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setPickerImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sampleHexAt = (natX: number, natY: number): string | null => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    let canvas = sampleCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      sampleCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      const data = ctx.getImageData(Math.round(natX), Math.round(natY), 1, 1).data;
      return (
        "#" +
        [data[0], data[1], data[2]]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
      );
    } catch {
      return null;
    }
  };

  const onPickFromImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const rect = img.getBoundingClientRect();
    const natX = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
    const natY = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;
    const picked = sampleHexAt(natX, natY);
    if (picked) setInput(picked);
  };

  const onImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setMagnifier(null);
      return;
    }
    const bgW = rect.width * MAG_ZOOM;
    const bgH = rect.height * MAG_ZOOM;
    const natX = (x / rect.width) * img.naturalWidth;
    const natY = (y / rect.height) * img.naturalHeight;
    const previewHex = sampleHexAt(natX, natY) ?? "#000000";
    setMagnifier({
      x,
      y,
      bgX: -(x * MAG_ZOOM - MAG_SIZE / 2),
      bgY: -(y * MAG_ZOOM - MAG_SIZE / 2),
      bgW,
      bgH,
      previewHex,
    });
  };

  const onImageMouseLeave = () => setMagnifier(null);

  useEffect(() => {
    // Clear cached canvas so the next sample re-draws from the new source image.
    sampleCanvasRef.current = null;
    setMagnifier(null);
  }, [pickerImage]);

  useEffect(() => {
    const norm = normalizeHex(input);
    if (norm) setHex(norm);
  }, [input]);

  const error = useMemo(() => {
    if (input.trim() === "") return null;
    return normalizeHex(input) ? null : "Not a valid hex — try #FF5733 or FF5733.";
  }, [input]);

  const ink = readableTextOn(hex);
  const rgb = hexToRgbString(hex);
  const colorName = nameForHex(hex);
  const [L, C, H] = chroma(hex).oklch();

  const neighbors = useMemo(() => buildNeighborStrip(hex), [hex]);
  const harmonyPalette = useMemo(
    () => generatePalette({ rule: harmony, count: 6, baseHex: hex }),
    [hex, harmony],
  );
  const seasonalMatches = useMemo(() => findSeasonalMatches(hex), [hex]);

  const harmonyMeta = HARMONY_RULES.find((r) => r.id === harmony)!;

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-y-auto scroll-thin">
      <div className="flex items-end justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="eyebrow text-muted-light dark:text-muted-dark">taste</span>
            <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
              Taste a hex.
            </h1>
          </div>
          <p className="text-[12px] text-muted-light dark:text-muted-dark mt-1.5 max-w-xl leading-snug">
            Look up any hex. See its neighbours on the colour wheel, how it reads under
            colour vision deficiency, and palettes that go well with it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-3 shrink-0 mb-4">
        <div
          className="rounded-2xl border border-line-light dark:border-line-dark p-4 flex flex-col justify-end min-h-[140px]"
          style={{ background: hex, color: ink }}
        >
          <div className="font-mono text-2xl font-semibold tracking-tight">{hex}</div>
          <div className="text-[12px] opacity-80 mt-0.5">{colorName}</div>
          <div className="text-[10px] opacity-70 font-mono mt-1">
            rgb({rgb}) · L {Math.round((L || 0) * 100)}% · C {(C || 0).toFixed(2)} · H{" "}
            {Math.round(Number.isFinite(H) ? H : 0)}°
          </div>
        </div>
        <div className="rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="eyebrow text-muted-light dark:text-muted-dark">Enter a hex</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[11px] flex items-center gap-1.5 text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors"
              title="Upload an image to pick a colour from it"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              or pick from an image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileUpload(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#FF5733"
            className="w-full bg-transparent text-ink-light dark:text-ink-dark text-2xl font-mono font-medium tracking-tight border-b border-line-light dark:border-line-dark focus:border-ink-light dark:focus:border-ink-dark outline-none py-1"
            spellCheck={false}
            autoComplete="off"
          />

          {pickerImage && (
            <div className="relative rounded-lg border border-line-light dark:border-line-dark overflow-hidden bg-canvas-light dark:bg-canvas-dark">
              <img
                ref={imgRef}
                src={pickerImage}
                alt="Click anywhere to pick a colour"
                className="w-full max-h-48 object-contain cursor-crosshair block"
                onClick={onPickFromImage}
                onMouseMove={onImageMouseMove}
                onMouseLeave={onImageMouseLeave}
                draggable={false}
              />
              {magnifier && (
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-white shadow-lift z-10"
                  style={{
                    width: MAG_SIZE,
                    height: MAG_SIZE,
                    left: magnifier.x - MAG_SIZE / 2,
                    top: magnifier.y - MAG_SIZE / 2,
                    backgroundImage: `url(${pickerImage})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${magnifier.bgW}px ${magnifier.bgH}px`,
                    backgroundPosition: `${magnifier.bgX}px ${magnifier.bgY}px`,
                    imageRendering: "pixelated",
                  }}
                >
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                    style={{ width: 10, height: 10, boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -bottom-6 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap"
                    style={{
                      background: magnifier.previewHex,
                      color: readableTextOn(magnifier.previewHex),
                    }}
                  >
                    {magnifier.previewHex}
                  </div>
                </div>
              )}
              <button
                onClick={() => setPickerImage(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink-light/80 dark:bg-ink-dark/80 text-canvas-light dark:text-canvas-dark text-sm flex items-center justify-center hover:opacity-100 z-20"
                aria-label="Remove image"
                title="Remove image"
              >
                ×
              </button>
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-ink-light/80 dark:bg-ink-dark/80 text-canvas-light dark:text-canvas-dark text-[10px] tracking-tight">
                hover to zoom · click to pick
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-auto">
            <span className="text-[11px] text-muted-light dark:text-muted-dark">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <>3-, 6-, or 8-digit hex. Pasting works.</>
              )}
            </span>
            <button
              onClick={() => addSwatch(hex)}
              className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 text-[12px]"
            >
              + Add to stash
            </button>
          </div>
        </div>
      </div>

      <section className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="eyebrow text-ink-light dark:text-ink-dark">Neighbours</span>
            <span className="text-[11px] text-muted-light dark:text-muted-dark">
              ±30° hue at this lightness · click any to add
            </span>
          </div>
        </div>
        <div
          className="grid gap-1 rounded-xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark px-3 py-4"
          style={{ gridTemplateColumns: `repeat(${neighbors.length}, minmax(0, 1fr))` }}
        >
          {neighbors.map((cell, cIdx) => (
            <button
              key={cIdx}
              className={`relative h-12 rounded-md transition-transform ${
                cell.isCenter
                  ? "z-10 scale-[1.18] ring-4 ring-amber-500 ring-offset-[3px] ring-offset-surface-light dark:ring-offset-surface-dark shadow-lift"
                  : "hover:scale-110 hover:z-10"
              }`}
              style={{ background: cell.hex }}
              onClick={() => addSwatch(cell.hex)}
              onMouseEnter={(e) => {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                showHexTooltip(cell.hex, r.left + r.width / 2, r.bottom);
              }}
              onMouseLeave={hideHexTooltip}
              aria-label={`Add ${cell.hex}`}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow text-ink-light dark:text-ink-dark">How others see it</span>
              <span className="text-[11px] text-muted-light dark:text-muted-dark">
                same hex, simulated through each form of colour vision
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CVD_MODES.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-line-light dark:border-line-dark overflow-hidden bg-surface-light dark:bg-surface-dark"
              >
                <div
                  className="h-16 w-full p-2 flex flex-col justify-end"
                  style={{
                    background: hex,
                    color: ink,
                    filter: m.id === "none" ? "none" : `url(#cvd-${m.id})`,
                    WebkitFilter: m.id === "none" ? "none" : `url(#cvd-${m.id})`,
                  }}
                >
                  <div className="font-mono text-[11px] font-semibold leading-tight">{hex}</div>
                  <div className="text-[10px] opacity-85 leading-tight truncate">{colorName}</div>
                </div>
                <div className="px-2 py-1.5 flex flex-col border-t border-line-light dark:border-line-dark">
                  <span className="text-[11px] font-medium text-ink-light dark:text-ink-dark leading-tight">
                    {m.label}
                  </span>
                  <span className="text-[10px] text-muted-light dark:text-muted-dark leading-snug truncate">
                    {m.hint}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow text-ink-light dark:text-ink-dark">Goes well with</span>
              <span className="text-[11px] text-muted-light dark:text-muted-dark">
                palettes anchored on this hex
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {NEIGHBOR_HARMONIES.map((rule) => {
              const meta = HARMONY_RULES.find((r) => r.id === rule)!;
              return (
                <button
                  key={rule}
                  onClick={() => setHarmony(rule)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition ${
                    harmony === rule
                      ? "bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark border-transparent"
                      : "border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
                  }`}
                  title={meta.blurb}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border border-line-light dark:border-line-dark overflow-hidden">
            <div
              className="grid h-20"
              style={{ gridTemplateColumns: `repeat(${harmonyPalette.length}, 1fr)` }}
            >
              {harmonyPalette.map((h, i) => {
                const ink2 = readableTextOn(h);
                return (
                  <button
                    key={`${h}-${i}`}
                    onClick={() => addSwatch(h)}
                    className="group relative flex items-end p-2 text-[10px] font-mono hover:scale-[1.02] transition-transform"
                    style={{ background: h, color: ink2 }}
                    title={`Add ${h}`}
                    aria-label={`Add ${h}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">{h}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-2.5 flex items-center justify-between bg-surface-light dark:bg-surface-dark border-t border-line-light dark:border-line-dark">
              <span className="text-[11px] text-muted-light dark:text-muted-dark truncate">
                {harmonyMeta.blurb}
              </span>
              <button
                onClick={() => {
                  addManySwatches(harmonyPalette);
                  showToast(`${harmonyMeta.label} palette added to stash`);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark whitespace-nowrap"
              >
                + Stash all
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="eyebrow text-ink-light dark:text-ink-dark">Seasonal matches</span>
                <span className="text-[11px] text-muted-light dark:text-muted-dark">
                  curated palettes that already contain something close (lower ΔE = closer)
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeasonTab(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition capitalize ${
                    seasonTab === s
                      ? "bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark border-transparent"
                      : "border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {seasonalMatches[seasonTab].length === 0 ? (
                <div className="text-[11px] text-muted-light dark:text-muted-dark italic px-2 py-3">
                  no close matches in {seasonTab}
                </div>
              ) : (
                seasonalMatches[seasonTab].map((m) => (
                  <div
                    key={`${m.paletteId}-${m.season}`}
                    className="rounded-xl border border-line-light dark:border-line-dark overflow-hidden"
                  >
                    <div
                      className="grid h-12"
                      style={{ gridTemplateColumns: `repeat(${m.hexes.length}, 1fr)` }}
                    >
                      {m.hexes.map((h) => {
                        const isClosest = h.toUpperCase() === m.closestHex.toUpperCase();
                        return (
                          <button
                            key={`${m.paletteId}-${h}`}
                            onClick={() => addSwatch(h)}
                            className={`relative ${isClosest ? "ring-2 ring-amber-400 z-10" : ""}`}
                            style={{ background: h }}
                            title={`Add ${h}`}
                            aria-label={`Add ${h}`}
                          />
                        );
                      })}
                    </div>
                    <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 bg-surface-light dark:bg-surface-dark">
                      <span className="text-[11px] text-ink-light dark:text-ink-dark font-medium truncate">
                        {m.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted-light dark:text-muted-dark">
                          ΔE {m.closestDelta.toFixed(1)}
                        </span>
                        <button
                          onClick={() => {
                            addManySwatches(m.hexes);
                            showToast(`${m.name} added to stash`);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark whitespace-nowrap"
                        >
                          + Stash
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
