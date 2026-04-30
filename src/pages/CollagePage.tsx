import { getPaletteSync } from "colorthief";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { useStash } from "../state/StashContext";
import { nameForHex, readableTextOn } from "../lib/color";

interface CollageImage {
  id: string;
  url: string;
  dataUrl: string;
  width: number;
  height: number;
}

type Layout = "grid" | "stack" | "mosaic";

const LAYOUTS: Array<{ id: Layout; label: string }> = [
  { id: "grid", label: "Grid" },
  { id: "stack", label: "Stack" },
  { id: "mosaic", label: "Mosaic" },
];

export function CollagePage() {
  const { addManySwatches, showToast } = useStash();
  const [images, setImages] = useState<CollageImage[]>([]);
  const [layout, setLayout] = useState<Layout>("grid");
  const [palette, setPalette] = useState<string[]>([]);
  const [bg, setBg] = useState("#FAF7F2");
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    arr.forEach((file) => {
      const url = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== "string") return;
        const dataUrl = reader.result;
        const probe = new Image();
        probe.onload = () => {
          setImages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              url,
              dataUrl,
              width: probe.naturalWidth,
              height: probe.naturalHeight,
            },
          ]);
        };
        probe.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  // Recompute combined palette when images change
  useEffect(() => {
    if (images.length === 0) {
      setPalette([]);
      return;
    }
    const collected: string[] = [];
    let processed = 0;
    images.forEach((image) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const colors = getPaletteSync(img, { colorCount: 4, colorSpace: "oklch" });
          for (const c of colors ?? []) collected.push(c.hex().toUpperCase());
        } catch {
          /* skip */
        }
        processed++;
        if (processed === images.length) {
          // Dedupe near-duplicates
          const seen = new Set<string>();
          const out: string[] = [];
          for (const hex of collected) {
            if (!seen.has(hex)) {
              seen.add(hex);
              out.push(hex);
            }
          }
          setPalette(out.slice(0, 10));
        }
      };
      img.onerror = () => {
        processed++;
        if (processed === images.length) {
          setPalette(collected.slice(0, 10));
        }
      };
      img.src = image.url;
    });
  }, [images.length]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setPalette([]);
  };

  const onSavePalette = () => {
    if (palette.length === 0) return;
    addManySwatches(palette);
    showToast(`${palette.length} swatches added to stash`);
  };

  const onExport = async () => {
    if (!collageRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(collageRef.current, {
        backgroundColor: bg,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collage.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="eyebrow text-muted-light dark:text-muted-dark">collage</span>
          <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
            Compose a moodboard.
          </h1>
          <span className="text-[11px] text-muted-light dark:text-muted-dark hidden md:inline">
            {images.length === 0
              ? "drop images to begin"
              : `${images.length} image${images.length === 1 ? "" : "s"} · palette extracted`}
          </span>
        </div>
        {images.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-full p-0.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-full transition ${
                    layout === l.id
                      ? "bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark"
                      : "text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <label className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer">
              <span>+ Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </label>
            <button
              onClick={onSavePalette}
              disabled={palette.length === 0}
              className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-40"
            >
              + Save palette
            </button>
            <button
              onClick={onExport}
              disabled={exporting}
              className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 disabled:opacity-50"
            >
              {exporting ? "Rendering…" : "Export JPG"}
            </button>
            <button
              onClick={clearAll}
              className="btn-pill text-muted-light dark:text-muted-dark hover:text-red-500"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex-1 min-h-0 relative border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
            dragging
              ? "border-ink-light dark:border-ink-dark bg-surface-light dark:bg-surface-dark"
              : "border-line-light dark:border-line-dark hover:border-muted-light dark:hover:border-muted-dark hover:bg-surface-light/50 dark:hover:bg-surface-dark/50"
          }`}
        >
          <div className="text-center">
            <div className="text-5xl mb-3 text-ink-light dark:text-ink-dark opacity-60">⊞</div>
            <div className="text-base font-medium text-ink-light dark:text-ink-dark">
              Drop a few images here
            </div>
            <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
              we'll arrange them and pull a combined palette
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_240px] gap-3">
          <div className="min-w-0 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 rounded-2xl border border-line-light dark:border-line-dark overflow-hidden">
              <div ref={collageRef} className="h-full w-full" style={{ background: bg }}>
                <CollageGrid images={images} layout={layout} onRemove={removeImage} />
              </div>
            </div>

            {palette.length > 0 && (
              <div className="mt-3 rounded-xl border border-line-light dark:border-line-dark overflow-hidden">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${palette.length}, minmax(0, 1fr))`,
                    height: "72px",
                  }}
                >
                  {palette.map((hex) => (
                    <div
                      key={hex}
                      className="flex items-end p-2"
                      style={{ background: hex, color: readableTextOn(hex) }}
                    >
                      <div>
                        <div className="font-mono text-[11px] font-semibold tracking-tight">{hex}</div>
                        <div className="text-[9px] opacity-80">{nameForHex(hex)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-line-light dark:border-line-dark p-3 bg-surface-light/50 dark:bg-surface-dark/50 overflow-y-auto scroll-thin">
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2.5">Background</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {["#FAF7F2", "#FFFFFF", "#0E0E0E", "#1A1A1A", "#E8E2D5", ...palette].map((hex) => (
                <button
                  key={`bg-${hex}`}
                  onClick={() => setBg(hex)}
                  className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                    bg === hex ? "border-ink-light dark:border-ink-dark" : "border-line-light dark:border-line-dark"
                  }`}
                  style={{ background: hex }}
                  title={hex}
                />
              ))}
            </div>
            <div className="eyebrow text-muted-light dark:text-muted-dark mb-2.5">Images</div>
            <div className="space-y-1.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="flex items-center gap-2 p-1.5 rounded-md border border-line-light dark:border-line-dark"
                >
                  <div
                    className="w-10 h-10 rounded shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${img.url})` }}
                  />
                  <div className="flex-1 min-w-0 text-[10px] text-muted-light dark:text-muted-dark font-mono">
                    {img.width}×{img.height}
                  </div>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="text-muted-light dark:text-muted-dark hover:text-red-500 w-6 h-6 flex items-center justify-center"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CollageGrid({
  images,
  layout,
  onRemove,
}: {
  images: CollageImage[];
  layout: Layout;
  onRemove: (id: string) => void;
}) {
  const cols = layout === "grid" ? Math.ceil(Math.sqrt(images.length)) : layout === "stack" ? 1 : 3;
  const isMosaic = layout === "mosaic";

  return (
    <div
      className="h-full w-full p-4 gap-3 grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: layout === "stack" ? "auto" : isMosaic ? "minmax(120px, auto)" : "1fr",
      }}
    >
      {images.map((img, i) => {
        const span = isMosaic ? (i % 5 === 0 ? 2 : 1) : 1;
        const rowSpan = isMosaic ? (i % 7 === 0 ? 2 : 1) : 1;
        return (
          <div
            key={img.id}
            className="relative group rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800"
            style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}` }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <button
              onClick={() => onRemove(img.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
