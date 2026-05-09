import { useEffect, useMemo, useState } from "react";
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

function buildNeighborhood(hex: string, cols = 13, rows = 7): NeighborCell[][] {
  const [Lraw, Craw, Hraw] = chroma(hex).oklch();
  const baseL = Number.isFinite(Lraw) ? Lraw : 0.55;
  const baseC = Number.isFinite(Craw) ? Math.max(0.02, Craw) : 0.08;
  const baseH = Number.isFinite(Hraw) ? Hraw : 0;
  const hSpan = 60;
  const lSpan = 0.5;
  const grid: NeighborCell[][] = [];
  const midR = Math.floor(rows / 2);
  const midC = Math.floor(cols / 2);
  for (let r = 0; r < rows; r++) {
    const tL = r / Math.max(1, rows - 1) - 0.5;
    const Lr = Math.max(0.05, Math.min(0.97, baseL - tL * lSpan));
    const row: NeighborCell[] = [];
    for (let c = 0; c < cols; c++) {
      const tH = c / Math.max(1, cols - 1) - 0.5;
      const Hr = (baseH + tH * hSpan + 360) % 360;
      const isCenter = r === midR && c === midC;
      const cellHex = isCenter ? hex.toUpperCase() : clampInGamutHex(Lr, baseC, Hr);
      row.push({ hex: cellHex, isCenter });
    }
    grid.push(row);
  }
  return grid;
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

  const neighbors = useMemo(() => buildNeighborhood(hex), [hex]);
  const harmonyPalette = useMemo(
    () => generatePalette({ rule: harmony, count: 6, baseHex: hex }),
    [hex, harmony],
  );
  const seasonalMatches = useMemo(() => findSeasonalMatches(hex), [hex]);

  const harmonyMeta = HARMONY_RULES.find((r) => r.id === harmony)!;

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-y-auto scroll-thin">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">lookup</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Look up a hex.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            neighbours, accessibility, and palettes that suit it
          </span>
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
          <label className="eyebrow text-muted-light dark:text-muted-dark">Enter a hex</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#FF5733"
            className="w-full bg-transparent text-ink-light dark:text-ink-dark text-2xl font-mono font-medium tracking-tight border-b border-line-light dark:border-line-dark focus:border-ink-light dark:focus:border-ink-dark outline-none py-1"
            spellCheck={false}
            autoComplete="off"
          />
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
              ±30° hue · ±25% lightness · click any to add · ringed cell is your hex
            </span>
          </div>
        </div>
        <div
          className="grid gap-1 rounded-xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-1.5"
          style={{ gridTemplateColumns: `repeat(${neighbors[0].length}, minmax(0, 1fr))` }}
        >
          {neighbors.flatMap((row, rIdx) =>
            row.map((cell, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}`}
                className={`relative aspect-square rounded-md hover:scale-110 hover:z-10 transition-transform ${cell.isCenter ? "ring-2 ring-amber-400 z-10" : ""}`}
                style={{ background: cell.hex }}
                onClick={() => addSwatch(cell.hex)}
                onMouseEnter={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  showHexTooltip(cell.hex, r.left + r.width / 2, r.bottom);
                }}
                onMouseLeave={hideHexTooltip}
                aria-label={`Add ${cell.hex}`}
              />
            )),
          )}
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
                  className="h-14 w-full"
                  style={{
                    background: hex,
                    filter: m.id === "none" ? "none" : `url(#cvd-${m.id})`,
                    WebkitFilter: m.id === "none" ? "none" : `url(#cvd-${m.id})`,
                  }}
                  aria-hidden
                />
                <div className="p-2 flex flex-col">
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
