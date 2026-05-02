import { useMemo, useState } from "react";
import { CURATED_PALETTES, MOOD_TAGS, type CuratedPalette, type MoodTag } from "../lib/curated";
import { useStash } from "../state/StashContext";
import { readableTextOn } from "../lib/color";

type Filter = MoodTag | "all";

export function LibraryPage() {
  const { addManySwatches, replaceSwatches, showToast } = useStash();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const palettes = useMemo(() => {
    let list: CuratedPalette[] = CURATED_PALETTES;
    if (filter !== "all") list = list.filter((p) => p.tags.includes(filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.hexes.some((h) => h.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [filter, search]);

  const onAddAll = (p: CuratedPalette) => {
    addManySwatches(p.hexes);
    showToast(`${p.name} added to stash`);
  };

  const onReplace = (p: CuratedPalette) => {
    replaceSwatches(p.hexes);
    showToast(`Stash replaced with ${p.name}`);
  };

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">library</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Curated palettes.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            {palettes.length} of {CURATED_PALETTES.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, tag, or hex…"
            className="text-[12px] bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full px-3 py-1.5 text-ink-light dark:text-ink-dark placeholder:text-muted-light dark:placeholder:text-muted-dark w-64 outline-none focus:border-ink-light dark:focus:border-ink-dark"
          />
        </div>
      </div>

      <div className="shrink-0 mb-3 flex flex-wrap gap-1.5">
        {(["all", ...MOOD_TAGS] as Filter[]).map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-3 py-1 text-[11px] font-medium rounded-full border transition ${
              filter === tag
                ? "bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark border-transparent"
                : "border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
          {palettes.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-line-light dark:border-line-dark overflow-hidden lift-hover bg-surface-light dark:bg-surface-dark group"
            >
              <div
                className="grid h-32"
                style={{ gridTemplateColumns: `repeat(${p.hexes.length}, 1fr)` }}
              >
                {p.hexes.map((hex) => (
                  <div
                    key={hex}
                    style={{ background: hex, color: readableTextOn(hex) }}
                    className="flex items-end p-2 text-[10px] font-mono"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-display font-medium tracking-tight text-ink-light dark:text-ink-dark truncate">
                    {p.name}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-canvas-light dark:bg-canvas-dark text-muted-light dark:text-muted-dark uppercase tracking-wider"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onAddAll(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark whitespace-nowrap"
                  >
                    + Stash
                  </button>
                  <button
                    onClick={() => onReplace(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 whitespace-nowrap"
                  >
                    Replace
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {palettes.length === 0 && (
          <div className="text-center py-12 text-muted-light dark:text-muted-dark">
            No matches. Try a different filter or search.
          </div>
        )}
      </div>
    </div>
  );
}
