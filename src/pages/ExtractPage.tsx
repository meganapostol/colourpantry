import { getPaletteSync } from "colorthief";
import { useRef, useState } from "react";
import { nameForHex, readableTextOn } from "../lib/color";
import { useStash } from "../state/StashContext";

export function ExtractPage() {
  const { addSwatch, showToast } = useStash();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const colors = getPaletteSync(img, { colorCount: 10, colorSpace: "oklch" });
        const hexes: string[] = [];
        const seen = new Set<string>();
        for (const c of colors ?? []) {
          const h = c.hex().toUpperCase();
          if (!seen.has(h)) {
            seen.add(h);
            hexes.push(h);
          }
        }
        setPalette(hexes.slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => setLoading(false);
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const saveAll = () => {
    palette.forEach((h) => addSwatch(h));
    showToast(`${palette.length} swatches added`);
  };

  return (
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="px-6 pt-8 pb-10 max-w-4xl mx-auto">
        <div className="mb-10">
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            from any image
          </span>
          <h1 className="display-tight font-display font-medium text-[clamp(2rem,5vw,3.5rem)] text-ink-light dark:text-ink-dark mt-3">
            Extract a palette.
          </h1>
          <p className="mt-4 text-base text-muted-light dark:text-muted-dark leading-relaxed max-w-2xl">
            Drop or upload an image to pull its dominant palette. Click any swatch to add to your stash — or save the whole set with one button.
          </p>
        </div>

        {!imgUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all overflow-hidden ${
              dragging
                ? "border-ink-light dark:border-ink-dark bg-surface-light dark:bg-surface-dark scale-[1.01]"
                : "border-line-light dark:border-line-dark hover:border-muted-light dark:hover:border-muted-dark hover:bg-surface-light/50 dark:hover:bg-surface-dark/50"
            }`}
          >
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top, rgba(255,180,120,0.12), transparent 60%), radial-gradient(ellipse at bottom right, rgba(120,180,255,0.1), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="text-5xl mb-4 text-ink-light dark:text-ink-dark opacity-70">+</div>
              <div className="text-base font-medium text-ink-light dark:text-ink-dark">
                Drop an image here
              </div>
              <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
                or click to upload · PNG, JPG, WEBP
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
              }}
            />
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5 mb-6">
              <div className="rounded-2xl overflow-hidden border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark shadow-soft">
                <img src={imgUrl} alt="source" className="w-full h-64 object-cover" />
              </div>
              <div className="flex flex-col justify-between gap-3">
                <div>
                  <span className="eyebrow text-muted-light dark:text-muted-dark">Palette</span>
                  <h2 className="font-display font-medium text-2xl tracking-tight text-ink-light dark:text-ink-dark mt-1">
                    {loading ? "Extracting…" : `${palette.length} dominant colors`}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setImgUrl(null);
                      setPalette([]);
                    }}
                    className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
                  >
                    ← New image
                  </button>
                  {palette.length > 0 && (
                    <button
                      onClick={saveAll}
                      className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
                    >
                      Save full palette to stash
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {palette.map((hex) => (
                <button
                  key={hex}
                  onClick={() => addSwatch(hex)}
                  className="w-full relative h-20 rounded-xl overflow-hidden border border-line-light dark:border-line-dark hover:scale-[1.005] hover:shadow-lift transition-all group"
                >
                  <div className="absolute inset-0" style={{ background: hex }} />
                  <div
                    className="relative flex items-center justify-between px-6 h-full"
                    style={{ color: readableTextOn(hex) }}
                  >
                    <div>
                      <div className="font-mono text-base font-semibold tracking-tight">
                        {hex}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{nameForHex(hex)}</div>
                    </div>
                    <div className="text-[11px] uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                      click to add →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
