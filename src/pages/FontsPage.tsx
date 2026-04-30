import { useEffect, useMemo, useState } from "react";
import { FONT_PAIRS, fontStack, loadFontPair, type FontPair } from "../lib/fontPairs";
import { useStash } from "../state/StashContext";
import { readableTextOn } from "../lib/color";
import type { FontPairing } from "../lib/db";

const CATEGORIES: Array<{ id: FontPair["category"] | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "modern", label: "Modern" },
  { id: "editorial", label: "Editorial" },
  { id: "classic", label: "Classic" },
  { id: "playful", label: "Playful" },
  { id: "tech", label: "Tech" },
  { id: "display", label: "Display" },
];

export function FontsPage() {
  const { stash, setFontPair, showToast } = useStash();
  const [category, setCategory] = useState<FontPair["category"] | "all">("all");
  const [previewBg, setPreviewBg] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "all" ? FONT_PAIRS : FONT_PAIRS.filter((p) => p.category === category)),
    [category],
  );

  // Eager-load all visible font pairs
  useEffect(() => {
    filtered.forEach((p) => loadFontPair(p));
  }, [filtered]);

  const accent = stash.swatches[0]?.hex;
  const bg = previewBg ?? "#FAF7F2";

  const isApplied = (pair: FontPair) => stash.fontPair?.pairId === pair.id;

  const apply = (pair: FontPair) => {
    const fp: FontPairing = {
      pairId: pair.id,
      headingFamily: pair.heading.family,
      headingWeight: pair.heading.weight,
      bodyFamily: pair.body.family,
      bodyWeight: pair.body.weight,
    };
    setFontPair(fp);
    showToast(`Font pair "${pair.name}" attached to stash`);
  };

  const removePair = () => {
    setFontPair(undefined);
    showToast("Font pair removed");
  };

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-y-auto scroll-thin">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">fonts</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Pair the type.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            attach a pair to your stash · loaded from Google Fonts
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full p-0.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1 text-[12px] font-medium rounded-full transition ${
                  category === c.id
                    ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark"
                    : "text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {stash.fontPair && (
            <button
              onClick={removePair}
              className="btn-pill text-muted-light dark:text-muted-dark hover:text-red-500"
              title="Remove attached font pair"
            >
              Detach
            </button>
          )}
        </div>
      </div>

      {stash.swatches.length > 0 && (
        <div className="shrink-0 mb-3 rounded-xl border border-line-light dark:border-line-dark p-2 bg-surface-light/50 dark:bg-surface-dark/50 flex items-center gap-2">
          <span className="text-[11px] text-muted-light dark:text-muted-dark uppercase tracking-wider px-2">Preview on</span>
          {stash.swatches.slice(0, 8).map((s) => (
            <button
              key={s.hex}
              onClick={() => setPreviewBg(s.hex)}
              className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                previewBg === s.hex ? "border-ink-light dark:border-ink-dark" : "border-line-light dark:border-line-dark"
              }`}
              style={{ background: s.hex }}
              title={s.hex}
            />
          ))}
          <button
            onClick={() => setPreviewBg(null)}
            className="text-[11px] text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark px-2"
          >
            reset
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
        {filtered.map((pair) => {
          const headingStyle = {
            fontFamily: fontStack(pair.heading.family),
            fontWeight: pair.heading.weight,
          };
          const bodyStyle = {
            fontFamily: fontStack(pair.body.family),
            fontWeight: pair.body.weight,
          };
          const cardBg = bg;
          const cardInk = readableTextOn(cardBg);
          const cardAccent = accent ?? cardInk;
          const applied = isApplied(pair);
          return (
            <div
              key={pair.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                applied
                  ? "border-ink-light dark:border-ink-dark shadow-lift"
                  : "border-line-light dark:border-line-dark hover:shadow-lift"
              }`}
              style={{ background: cardBg, color: cardInk }}
            >
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-widest opacity-60 mb-3" style={{ color: cardInk }}>
                  {pair.category} · {pair.name}
                </div>
                <h3 style={{ ...headingStyle, color: cardAccent }} className="text-3xl leading-tight tracking-tight">
                  A palette walks into a room.
                </h3>
                <p style={{ ...bodyStyle, color: cardInk }} className="text-sm mt-3 leading-relaxed opacity-90">
                  Type and color make a chord. Pick a heavier serif and the room slows down. Pick a tight grotesque and it crackles. Try this pair against your accent — see how the headline reads when the body copy is nearby.
                </p>
              </div>
              <div
                className="px-6 py-3 flex items-center justify-between border-t"
                style={{ borderColor: cardInk + "22" }}
              >
                <div className="text-[11px] opacity-70 font-mono">
                  {pair.heading.family} {pair.heading.weight} · {pair.body.family} {pair.body.weight}
                </div>
                <button
                  onClick={() => apply(pair)}
                  className="text-[12px] px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: applied ? cardAccent : "transparent",
                    color: applied ? readableTextOn(cardAccent) : cardInk,
                    border: applied ? "none" : `1px solid ${cardInk}33`,
                  }}
                >
                  {applied ? "✓ Attached" : "Attach to stash"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
