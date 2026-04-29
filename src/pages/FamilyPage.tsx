import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  generateFamilyAllChromas,
  getFamilyById,
  maxChromaForFamily,
} from "../lib/color";
import { useStash } from "../state/StashContext";
import { hideHexTooltip, showHexTooltip } from "../components/HexTooltip";

const GAP = 4;
const MIN_CELL = 18;
const MAX_CELL = 48;

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

export function FamilyPage() {
  const { familyId = "" } = useParams();
  const family = getFamilyById(familyId);
  const { addSwatch, recentlyAdded } = useStash();
  const [popping, setPopping] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const maxC = useMemo(
    () => (family ? maxChromaForFamily(family.centerHue) : 0.3),
    [family],
  );

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

  // Resolution stays fixed to the fit-to-viewport count so colors don't shift
  // mid-zoom. Zoom only scales the cell display size.
  const cols = Math.max(8, Math.floor((size.w - GAP) / (MIN_CELL + GAP)));
  const rows = Math.max(8, Math.floor((size.h - GAP) / (MIN_CELL + GAP)));

  const waffle = useMemo(
    () =>
      family ? generateFamilyAllChromas(family.centerHue, cols, rows, maxC) : [],
    [family, cols, rows, maxC],
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

  const baseCellByWidth = (size.w - GAP) / cols - GAP;
  const baseCellByHeight = (size.h - GAP) / rows - GAP;
  const baseCell = Math.max(
    MIN_CELL,
    Math.min(MAX_CELL, Math.floor(Math.min(baseCellByWidth, baseCellByHeight))),
  );
  const cell = Math.max(8, Math.round(baseCell * zoom));
  const gridW = cols * (cell + GAP) - GAP;
  const gridH = rows * (cell + GAP) - GAP;

  const stepZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STEPS.findIndex((z) => Math.abs(z - zoom) < 0.01);
    const cur = idx === -1 ? ZOOM_STEPS.indexOf(1) : idx;
    const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, cur + dir));
    setZoom(ZOOM_STEPS[next]);
  };

  // Keyboard shortcuts: + zoom in, - zoom out, 0 reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        stepZoom(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        stepZoom(-1);
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // Ctrl/Cmd + wheel to zoom continuously, snapping to nearest preset.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const idx = ZOOM_STEPS.findIndex((z) => Math.abs(z - zoom) < 0.01);
      const cur = idx === -1 ? ZOOM_STEPS.indexOf(1) : idx;
      const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, cur + dir));
      setZoom(ZOOM_STEPS[next]);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoom]);

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/"
            className="text-[12px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors shrink-0"
          >
            ← all families
          </Link>
          <span className="text-muted-light dark:text-muted-dark shrink-0">/</span>
          <div
            className="w-7 h-7 rounded shrink-0"
            style={{ background: family.representativeHex }}
            aria-hidden
          />
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none truncate">
            {family.name}
          </h1>
        </div>
        <div className="text-[11px] font-mono text-muted-light dark:text-muted-dark hidden sm:block">
          {family.centerHue}° · chroma 0 → {maxC.toFixed(2)} · lightness 95% → 5%
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div
          ref={wrapRef}
          className="absolute inset-0 overflow-auto scroll-thin"
        >
          <div className="min-w-full min-h-full flex items-center justify-center p-2">
            {size.w > 0 && (
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
                  gridTemplateRows: `repeat(${rows}, ${cell}px)`,
                  gap: `${GAP}px`,
                  width: gridW,
                  height: gridH,
                }}
              >
                {waffle.flatMap((row, rIdx) =>
                  row.map((c, cIdx) => {
                    const key = `${rIdx}-${cIdx}`;
                    if (!c.hex) {
                      return <div key={key} aria-hidden />;
                    }
                    const hex = c.hex.toUpperCase();
                    const isPopping = popping === c.hex;
                    const isRecent = recentlyAdded === hex;
                    return (
                      <button
                        key={key}
                        className={`rounded-md hover:scale-[1.12] hover:z-10 focus-visible:scale-[1.12] focus-visible:outline-none transition-transform ${isPopping ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
                        style={{ background: c.hex }}
                        onMouseEnter={(e) => {
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          showHexTooltip(c.hex, r.left + r.width / 2, r.bottom);
                        }}
                        onMouseLeave={hideHexTooltip}
                        onFocus={(e) => {
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          showHexTooltip(c.hex, r.left + r.width / 2, r.bottom);
                        }}
                        onBlur={hideHexTooltip}
                        onClick={() => {
                          addSwatch(c.hex);
                          setPopping(c.hex);
                          window.setTimeout(() => setPopping(null), 200);
                        }}
                        aria-label={`Add ${hex} to stash`}
                      />
                    );
                  }),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls — floating bottom-right of the waffle area */}
        <div
          className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur border border-line-light dark:border-line-dark rounded-full p-1 shadow-lift"
          title="Zoom: + / − keys, 0 to reset, or Ctrl+Scroll"
        >
          <button
            onClick={() => stepZoom(-1)}
            disabled={zoom <= ZOOM_STEPS[0]}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-30 disabled:hover:bg-transparent text-base leading-none"
            aria-label="Zoom out"
            title="Zoom out (−)"
          >
            −
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2.5 h-7 rounded-full font-mono text-[11px] tabular-nums text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark min-w-[3.25rem]"
            aria-label="Reset zoom"
            title="Reset to fit (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => stepZoom(1)}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-30 disabled:hover:bg-transparent text-base leading-none"
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
