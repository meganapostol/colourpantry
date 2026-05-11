import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FOLDERS, getAllStashes, type Stash } from "../lib/db";
import { useStash } from "../state/StashContext";
import { readableTextOn } from "../lib/color";

type Mode = "flat" | "tone";

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

// sRGB -> linear
function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function linearToSrgb(x: number): number {
  const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

// Linear sRGB -> OKLab (Björn Ottosson)
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  return linearRgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
}
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const [lr, lg, lb] = oklabToLinearRgb(L, a, b);
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

function recolorPixels(
  data: Uint8ClampedArray,
  paletteHex: string[],
  mode: Mode,
  blendPct: number,
) {
  if (paletteHex.length === 0) return;
  const blend = blendPct / 100;
  const inv = 1 - blend;

  // Precompute palette in OKLab for perceptual nearest-neighbor matching
  const paletteLab = paletteHex.map((h) => {
    const [r, g, b] = hexToRgb(h);
    return rgbToOklab(r, g, b);
  });
  const paletteRgb = paletteHex.map(hexToRgb);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [L, A, B] = rgbToOklab(r, g, b);

    // Find nearest palette colour in OKLab (perceptual)
    let minD = Infinity;
    let nearest = 0;
    for (let p = 0; p < paletteLab.length; p++) {
      const [pL, pA, pB] = paletteLab[p];
      const dL = L - pL;
      const dA = A - pA;
      const dB = B - pB;
      const d = dL * dL + dA * dA + dB * dB;
      if (d < minD) {
        minD = d;
        nearest = p;
      }
    }

    let nr: number, ng: number, nb: number;
    if (mode === "tone") {
      // Keep pixel's lightness, take palette's chroma (a, b)
      const [, pA, pB] = paletteLab[nearest];
      [nr, ng, nb] = oklabToRgb(L, pA, pB);
    } else {
      [nr, ng, nb] = paletteRgb[nearest];
    }

    data[i] = Math.round(r * inv + nr * blend);
    data[i + 1] = Math.round(g * inv + ng * blend);
    data[i + 2] = Math.round(b * inv + nb * blend);
    // alpha unchanged
  }
}

export function GlazePage() {
  const { stash: currentStash } = useStash();
  const [stashes, setStashes] = useState<Stash[]>([]);
  const [selectedStashId, setSelectedStashId] = useState<string>(currentStash.id);
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [recoloredUrl, setRecoloredUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<Mode>("flat");
  const [blendPct, setBlendPct] = useState(100);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refresh stash list whenever any stash changes
  useEffect(() => {
    let cancelled = false;
    getAllStashes().then((list) => {
      if (!cancelled) setStashes(list);
    });
    return () => {
      cancelled = true;
    };
  }, [currentStash.updatedAt, currentStash.id]);

  // Keep selectedStashId valid as the list arrives
  useEffect(() => {
    if (stashes.length === 0) return;
    if (!stashes.find((s) => s.id === selectedStashId)) {
      setSelectedStashId(stashes[0].id);
    }
  }, [stashes, selectedStashId]);

  // Decode the uploaded image into an HTMLImageElement
  useEffect(() => {
    if (!imgDataUrl) {
      setImgEl(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImgEl(img);
    img.src = imgDataUrl;
  }, [imgDataUrl]);

  const selectedStash = useMemo(
    () => stashes.find((s) => s.id === selectedStashId),
    [stashes, selectedStashId],
  );
  const paletteHexes = useMemo(
    () => selectedStash?.swatches.map((s) => s.hex.toUpperCase()) ?? [],
    [selectedStash],
  );

  const recolor = useCallback(() => {
    if (!imgEl || paletteHexes.length === 0) {
      setRecoloredUrl(null);
      return;
    }
    setProcessing(true);
    // Defer to next paint so the spinner shows on big images
    window.setTimeout(() => {
      const maxDim = 1600;
      const ratio = Math.min(
        maxDim / imgEl.naturalWidth,
        maxDim / imgEl.naturalHeight,
        1,
      );
      const W = Math.max(1, Math.round(imgEl.naturalWidth * ratio));
      const H = Math.max(1, Math.round(imgEl.naturalHeight * ratio));

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessing(false);
        return;
      }
      ctx.drawImage(imgEl, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      recolorPixels(imageData.data, paletteHexes, mode, blendPct);
      ctx.putImageData(imageData, 0, 0);
      setRecoloredUrl(canvas.toDataURL("image/png"));
      setProcessing(false);
    }, 0);
  }, [imgEl, paletteHexes, mode, blendPct]);

  // Recolor when inputs change
  useEffect(() => {
    recolor();
  }, [recolor]);

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImgDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/"),
    );
    if (item) {
      const f = item.getAsFile();
      if (f) onFile(f);
    }
  };

  const download = () => {
    if (!recoloredUrl) return;
    const a = document.createElement("a");
    a.href = recoloredUrl;
    const safe = (selectedStash?.name || "stash").replace(/[^a-z0-9-_]+/gi, "_");
    a.download = `glazed-${safe}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    setImgDataUrl(null);
    setRecoloredUrl(null);
    setShowOriginal(false);
  };

  const previewSrc = showOriginal ? imgDataUrl : (recoloredUrl ?? imgDataUrl);

  return (
    <div
      className="canvas-grain h-full flex flex-col px-4 pt-3 pb-3 max-w-[1600px] mx-auto w-full"
      onPaste={onPaste}
    >
      <div className="flex items-end justify-between gap-3 pb-3 shrink-0 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="eyebrow text-muted-light dark:text-muted-dark">glaze</span>
            <h1 className="font-display font-medium text-xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
              Try on your colours.
            </h1>
          </div>
          <p className="text-[12px] text-muted-light dark:text-muted-dark mt-1.5 max-w-2xl leading-snug">
            Drop in a screenshot, pick a stash, and see the site painted in your
            palette. Useful for showing a client what their brand colours would look
            like on a familiar UI.
          </p>
        </div>
        {imgDataUrl && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
              title="Toggle original / glazed"
            >
              {showOriginal ? "Show glazed" : "Show original"}
            </button>
            <button
              onClick={download}
              disabled={!recoloredUrl}
              className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90 disabled:opacity-40"
            >
              Download PNG
            </button>
            <button
              onClick={reset}
              className="btn-pill border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
            >
              ← New image
            </button>
          </div>
        )}
      </div>

      {!imgDataUrl ? (
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
                "radial-gradient(ellipse at top, rgba(180,160,255,0.14), transparent 60%), radial-gradient(ellipse at bottom right, rgba(255,180,200,0.12), transparent 60%)",
            }}
          />
          <div className="relative text-center">
            <div className="text-5xl mb-3 text-ink-light dark:text-ink-dark opacity-60">+</div>
            <div className="text-base font-medium text-ink-light dark:text-ink-dark">
              Drop a screenshot here
            </div>
            <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
              or click to upload · paste also works · PNG, JPG, WEBP
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-3">
          <div className="min-h-0 rounded-2xl overflow-hidden border border-line-light dark:border-line-dark shadow-soft bg-neutral-100 dark:bg-neutral-900 relative">
            {previewSrc && (
              <img
                src={previewSrc}
                alt={showOriginal ? "Original" : "Glazed"}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {processing && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-ink-light/80 dark:bg-ink-dark/80 text-canvas-light dark:text-canvas-dark text-[11px] tracking-tight">
                glazing…
              </div>
            )}
            {showOriginal && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-ink-light/80 dark:bg-ink-dark/80 text-canvas-light dark:text-canvas-dark text-[11px] tracking-tight">
                original
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark p-4 flex flex-col gap-4 min-h-0 overflow-y-auto scroll-thin">
            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark text-[10px] block mb-1.5">
                Stash
              </label>
              {stashes.length === 0 ? (
                <div className="text-[12px] text-muted-light dark:text-muted-dark italic">
                  No stashes yet.{" "}
                  <Link to="/stashes" className="underline">
                    Create one
                  </Link>{" "}
                  to glaze with.
                </div>
              ) : (
                <select
                  value={selectedStashId}
                  onChange={(e) => setSelectedStashId(e.target.value)}
                  className="w-full text-[13px] bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark rounded-md px-2.5 py-2 text-ink-light dark:text-ink-dark cursor-pointer hover:bg-surface-light dark:hover:bg-surface-dark"
                >
                  {stashes.map((s) => {
                    const folderLabel =
                      FOLDERS.find((f) => f.id === s.folder)?.label ?? s.folder;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name || "Untitled Stash"} · {folderLabel} ·{" "}
                        {s.swatches.length}
                      </option>
                    );
                  })}
                </select>
              )}
              {selectedStash && paletteHexes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {paletteHexes.map((h) => (
                    <div
                      key={h}
                      className="px-2 py-1 rounded-md font-mono text-[10px] tracking-tight"
                      style={{ background: h, color: readableTextOn(h) }}
                      title={h}
                    >
                      {h}
                    </div>
                  ))}
                </div>
              )}
              {selectedStash && paletteHexes.length === 0 && (
                <div className="text-[11px] text-muted-light dark:text-muted-dark italic mt-2">
                  This stash has no colours yet.
                </div>
              )}
            </div>

            <div>
              <label className="eyebrow text-muted-light dark:text-muted-dark text-[10px] block mb-1.5">
                Mode
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode("flat")}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    mode === "flat"
                      ? "bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark"
                      : "border border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                  }`}
                  title="Each pixel becomes its nearest stash colour. Looks like a posterised mockup."
                >
                  Flat
                </button>
                <button
                  onClick={() => setMode("tone")}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    mode === "tone"
                      ? "bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark"
                      : "border border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                  }`}
                  title="Keep the image's original light/dark contrast, only swap the hue and chroma. Better for photos."
                >
                  Keep tones
                </button>
              </div>
              <div className="text-[10px] text-muted-light dark:text-muted-dark mt-1.5 leading-snug">
                {mode === "flat"
                  ? "Flat: each pixel snaps to the nearest stash colour. Best for UI screenshots."
                  : "Keep tones: original light/dark stays, only the hue changes. Best for photos."}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="eyebrow text-muted-light dark:text-muted-dark text-[10px]">
                  Strength
                </label>
                <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark tabular-nums">
                  {blendPct}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={blendPct}
                onChange={(e) => setBlendPct(parseInt(e.target.value, 10))}
                className="w-full accent-ink-light dark:accent-ink-dark"
              />
              <div className="text-[10px] text-muted-light dark:text-muted-dark mt-1 leading-snug">
                Pull back to mix the original with the glazed version.
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
