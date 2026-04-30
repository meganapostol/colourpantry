import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStash } from "../state/StashContext";
import { contrastRatio, levelClass, levelDescription, wcagLevel, type WCAGLevel } from "../lib/contrast";
import { readableTextOn } from "../lib/color";

const LEVELS: WCAGLevel[] = ["AAA", "AA", "AA Large", "Fail"];

const LEVEL_BADGE: Record<WCAGLevel, string> = {
  AAA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  AA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "AA Large": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Fail: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function ContrastPage() {
  const { stash } = useStash();
  const [hovered, setHovered] = useState<{ bg: string; fg: string } | null>(null);

  const swatches = stash.swatches;

  const counts = useMemo(() => {
    const c: Record<WCAGLevel, number> = { AAA: 0, AA: 0, "AA Large": 0, Fail: 0 };
    for (let i = 0; i < swatches.length; i++) {
      for (let j = i + 1; j < swatches.length; j++) {
        const lvl = wcagLevel(contrastRatio(swatches[i].hex, swatches[j].hex));
        c[lvl]++;
      }
    }
    return c;
  }, [swatches]);

  if (swatches.length < 2) {
    return (
      <div className="canvas-grain h-full flex flex-col items-center justify-center px-4 max-w-[1600px] mx-auto w-full">
        <div className="text-center space-y-3 max-w-md">
          <div className="eyebrow text-muted-light dark:text-muted-dark">contrast</div>
          <h1 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark display-tight">
            Need at least two colors.
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Pairwise WCAG contrast ratios show up here once your stash has two or more swatches.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/generate" className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90">
              Generate a palette
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
          <span className="eyebrow text-muted-light dark:text-muted-dark">contrast</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            WCAG pairwise grid.
          </h1>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {LEVELS.map((lvl) => (
            <div key={lvl} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${LEVEL_BADGE[lvl]}`}>
              {lvl} <span className="opacity-60">· {counts[lvl]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview row */}
      <div className="shrink-0 mb-4 rounded-xl border border-line-light dark:border-line-dark overflow-hidden">
        {hovered ? (
          <div
            className="px-6 py-5 flex items-center justify-between gap-6"
            style={{ background: hovered.bg, color: hovered.fg }}
          >
            <div>
              <div className="text-[11px] uppercase tracking-widest opacity-70">Live preview</div>
              <div className="font-display font-medium text-2xl mt-1 tracking-tight">The quick brown fox</div>
              <div className="text-sm mt-0.5 opacity-90">jumps over the lazy dog · 14pt body</div>
            </div>
            <div className="text-right font-mono text-[12px]">
              <div className="text-2xl font-semibold">{contrastRatio(hovered.bg, hovered.fg).toFixed(2)}</div>
              <div className="opacity-80">{levelDescription(wcagLevel(contrastRatio(hovered.bg, hovered.fg)))}</div>
              <div className="opacity-70 mt-1">{hovered.fg} on {hovered.bg}</div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 text-[12px] text-muted-light dark:text-muted-dark italic">
            Hover any cell below to preview text contrast in this strip.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line-light dark:border-line-dark overflow-x-auto scroll-thin">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 sticky left-0 bg-surface-light dark:bg-surface-dark border-b border-r border-line-light dark:border-line-dark"></th>
              {swatches.map((s) => (
                <th
                  key={`col-${s.hex}`}
                  className="p-2 text-[10px] font-mono font-semibold border-b border-line-light dark:border-line-dark"
                  style={{ background: s.hex, color: readableTextOn(s.hex), minWidth: "92px" }}
                >
                  {s.hex}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swatches.map((bg) => (
              <tr key={`row-${bg.hex}`}>
                <th
                  className="p-2 text-[10px] font-mono font-semibold sticky left-0 border-r border-line-light dark:border-line-dark"
                  style={{ background: bg.hex, color: readableTextOn(bg.hex), minWidth: "92px" }}
                >
                  {bg.hex}
                </th>
                {swatches.map((fg) => {
                  const ratio = contrastRatio(bg.hex, fg.hex);
                  const lvl = wcagLevel(ratio);
                  const same = bg.hex === fg.hex;
                  return (
                    <td
                      key={`${bg.hex}-${fg.hex}`}
                      className="p-0 border-b border-r border-line-light/50 dark:border-line-dark/50"
                      onMouseEnter={() => !same && setHovered({ bg: bg.hex, fg: fg.hex })}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className="h-16 flex flex-col items-center justify-center px-2 cursor-default transition-transform hover:scale-[1.02]"
                        style={{ background: bg.hex, color: fg.hex }}
                        title={`${ratio.toFixed(2)} — ${levelDescription(lvl)}`}
                      >
                        {same ? (
                          <span className="text-[10px] opacity-50">—</span>
                        ) : (
                          <>
                            <span className="font-mono text-[14px] font-semibold leading-none">
                              {ratio.toFixed(2)}
                            </span>
                            <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-medium ${LEVEL_BADGE[lvl]} ${levelClass(lvl)}`}>
                              {lvl}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-3 text-[11px] text-muted-light dark:text-muted-dark">
        Ratios per WCAG 2.1. AAA ≥ 7.0 · AA ≥ 4.5 · AA Large ≥ 3.0 (large text only).
      </div>
    </div>
  );
}
