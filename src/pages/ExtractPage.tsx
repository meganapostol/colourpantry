import { getPaletteSync } from "colorthief";
import { useRef, useState } from "react";
import { nameForHex, readableTextOn } from "../lib/color";
import { useBible } from "../state/BibleContext";

export function ExtractPage() {
  const { addSwatch, showToast } = useBible();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const saveAll = () => {
    palette.forEach((h) => addSwatch(h));
    showToast(`${palette.length} swatches added`);
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-light dark:text-ink-dark">
          Extract from Image
        </h1>
        <p className="text-sm text-muted-light dark:text-muted-dark mt-1">
          Drop or upload an image to pull its dominant palette. Click any swatch to add to your bible.
        </p>
      </div>

      {!imgUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-line-light dark:border-line-dark rounded-md p-16 text-center cursor-pointer hover:border-ink-light dark:hover:border-ink-dark transition-colors"
        >
          <div className="text-3xl mb-2">+</div>
          <div className="text-sm text-muted-light dark:text-muted-dark">
            Drop an image here, or click to upload
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
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                setImgUrl(null);
                setPalette([]);
              }}
              className="text-xs px-3 py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900"
            >
              ← new image
            </button>
            {palette.length > 0 && (
              <button
                onClick={saveAll}
                className="text-xs px-3 py-1.5 rounded bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
              >
                Save full palette to bible
              </button>
            )}
          </div>

          {loading && (
            <div className="text-sm text-muted-light dark:text-muted-dark">
              Extracting…
            </div>
          )}

          <div className="space-y-3">
            {palette.map((hex) => (
              <button
                key={hex}
                onClick={() => addSwatch(hex)}
                className="w-full relative h-20 rounded-md overflow-hidden border border-line-light dark:border-line-dark hover:scale-[1.01] transition-transform group"
              >
                <img
                  src={imgUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: hex, opacity: 0.92 }}
                />
                <div
                  className="relative flex items-center justify-between px-5 py-3 h-full"
                  style={{ color: readableTextOn(hex) }}
                >
                  <div>
                    <div className="font-mono text-base font-semibold">{hex}</div>
                    <div className="text-[11px] opacity-80">{nameForHex(hex)}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">
                    click to add
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
