import { getPaletteSync } from "colorthief";
import { useRef, useState } from "react";
import { nameForHex, readableTextOn } from "../lib/color";
import { useStash } from "../state/StashContext";
import {
  exportExtractPDF,
  exportExtractRaster,
} from "../lib/exports";

export function ExtractPage() {
  const { addSwatch, recentlyAdded, showToast, setReferenceImage } = useStash();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [popping, setPopping] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setLoading(true);

    // Persist a data URL alongside the blob URL so it survives reload via IndexedDB
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImgDataUrl(reader.result);
    };
    reader.readAsDataURL(file);

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
    if (imgDataUrl) setReferenceImage(imgDataUrl);
    showToast(`${palette.length} swatches added · photo attached`);
  };

  const onSwatchClick = (hex: string) => {
    addSwatch(hex);
    if (imgDataUrl) setReferenceImage(imgDataUrl);
    setPopping(hex);
    window.setTimeout(() => setPopping(null), 200);
  };

  const reset = () => {
    setImgUrl(null);
    setImgDataUrl(null);
    setPalette([]);
  };

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">extract</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Image palette.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            {imgUrl
              ? loading
                ? "extracting…"
                : `${palette.length} dominant colors`
              : "drop an image to begin"}
          </span>
        </div>
        {imgUrl && (
          <div className="flex items-center gap-2 shrink-0">
            {palette.length > 0 && (
              <>
                <span className="eyebrow text-muted-light dark:text-muted-dark text-[10px] hidden md:inline">
                  Export
                </span>
                <div className="flex items-center gap-0.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full p-0.5">
                  <button
                    onClick={() => exportExtractRaster(imgUrl, palette, "png")}
                    className="px-3 py-1 text-[12px] font-medium rounded-full text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
                    title="Export PNG"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => exportExtractRaster(imgUrl, palette, "jpg")}
                    className="px-3 py-1 text-[12px] font-medium rounded-full text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
                    title="Export JPG"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => exportExtractPDF(imgUrl, palette)}
                    className="px-3 py-1 text-[12px] font-medium rounded-full text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
                    title="Export PDF"
                  >
                    PDF
                  </button>
                </div>
                <button
                  onClick={saveAll}
                  className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
                >
                  Save all to stash
                </button>
              </>
            )}
            <button
              onClick={reset}
              className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            >
              ← New image
            </button>
          </div>
        )}
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
          className={`flex-1 min-h-0 relative border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
            dragging
              ? "border-ink-light dark:border-ink-dark bg-surface-light dark:bg-surface-dark scale-[1.005]"
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
          <div className="relative text-center">
            <div className="text-5xl mb-3 text-ink-light dark:text-ink-dark opacity-60">+</div>
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
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden border border-line-light dark:border-line-dark shadow-soft bg-canvas-light dark:bg-canvas-dark">
          <div className="flex-1 min-h-0 relative bg-neutral-100 dark:bg-neutral-900">
            <img
              src={imgUrl}
              alt="source"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {palette.length > 0 && (
            <div
              className="grid shrink-0"
              style={{
                gridTemplateColumns: `repeat(${palette.length}, minmax(0, 1fr))`,
                height: "112px",
              }}
            >
              {palette.map((hex) => {
                const ink = readableTextOn(hex);
                const isPop = popping === hex;
                const isRecent = recentlyAdded === hex;
                return (
                  <button
                    key={hex}
                    onClick={() => onSwatchClick(hex)}
                    className={`relative flex flex-col items-start justify-end px-3 py-2.5 hover:scale-[1.02] hover:z-10 transition-transform ${isPop ? "swatch-pop" : ""} ${isRecent ? "recent-ring" : ""}`}
                    style={{ background: hex, color: ink }}
                    aria-label={`Add ${hex} to stash`}
                  >
                    <div className="font-mono text-[13px] font-semibold tracking-tight">
                      {hex}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5 truncate w-full text-left">
                      {nameForHex(hex)}
                    </div>
                    <div className="absolute top-2 right-2 text-[9px] uppercase tracking-wider opacity-0 hover:opacity-80 transition-opacity">
                      add →
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
