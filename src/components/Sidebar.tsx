import { useRef, useState } from "react";
import { useStash } from "../state/StashContext";
import { FOLDERS, type FolderId } from "../lib/db";
import { exportJPG, exportPDF, exportPNG, exportSVG } from "../lib/exports";
import {
  exportCSS,
  exportSCSS,
  exportTailwind,
  exportJSON,
  exportFigmaTokens,
  exportCSV,
  exportTXT,
} from "../lib/advancedExports";
import { fontStack, loadFontPair, FONT_PAIRS } from "../lib/fontPairs";

function gradientCss(g: NonNullable<ReturnType<typeof useStash>["stash"]["gradient"]>) {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.hex} ${(s.position * 100).toFixed(0)}%`)
    .join(", ");
  if (g.type === "radial") return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

export function Sidebar() {
  const {
    stash,
    setName,
    setFolder,
    removeSwatch,
    clearSwatches,
    setReferenceImage,
    setGradient,
    setFontPair,
    startNewStash,
    customLogo,
    setCustomLogo,
  } = useStash();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copyAllLabel, setCopyAllLabel] = useState("Copy All");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLogoSettings, setShowLogoSettings] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 group flex items-center gap-2 bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark rounded-l-xl pl-3 pr-3.5 py-3 shadow-lift hover:pl-4 transition-all"
        aria-label="Show stash sidebar"
        title="Show stash sidebar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="font-medium text-[12px] tracking-tight">stash</span>
        <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded-full bg-canvas-light/20 dark:bg-ink-dark/20">
          {stash.swatches.length}
        </span>
      </button>
    );
  }

  const onCopyAll = async () => {
    const text = stash.swatches.map((s) => s.hex).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      setCopyAllLabel("Copied!");
      setTimeout(() => setCopyAllLabel("Copy All"), 1200);
    } catch {
      setCopyAllLabel("Failed");
      setTimeout(() => setCopyAllLabel("Copy All"), 1200);
    }
  };

  const onLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setCustomLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const fontPair = stash.fontPair
    ? FONT_PAIRS.find((p) => p.id === stash.fontPair?.pairId)
    : undefined;

  if (fontPair) loadFontPair(fontPair);

  return (
    <aside className="w-80 shrink-0 bg-surface-light/70 dark:bg-surface-dark/60 backdrop-blur-md border-l border-line-light dark:border-line-dark flex flex-col h-full">
      <div className="p-5 border-b border-line-light dark:border-line-dark">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow text-muted-light dark:text-muted-dark">
            Current Stash
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark transition-colors"
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            <span>hide</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <input
          value={stash.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled Stash"
          className="w-full bg-transparent text-ink-light dark:text-ink-dark text-lg font-display font-medium tracking-tight border-b border-transparent focus:border-line-light dark:focus:border-line-dark outline-none py-1 -mx-0.5 px-0.5"
        />
        <div className="flex items-center gap-2 mt-3">
          <select
            value={stash.folder}
            onChange={(e) => setFolder(e.target.value as FolderId)}
            className="flex-1 text-[12px] bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark rounded-md px-2 py-1.5 text-ink-light dark:text-ink-dark cursor-pointer hover:bg-surface-light dark:hover:bg-surface-dark"
          >
            {FOLDERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            onClick={startNewStash}
            className="text-[12px] px-2.5 py-1.5 rounded-md text-muted-light dark:text-muted-dark hover:bg-canvas-light dark:hover:bg-canvas-dark hover:text-ink-light dark:hover:text-ink-dark"
            title="Start a new stash"
          >
            + new
          </button>
        </div>
      </div>

      {stash.referenceImage && (
        <div className="px-4 py-3 border-b border-line-light dark:border-line-dark flex items-center gap-3 bg-canvas-light/40 dark:bg-canvas-dark/40">
          <div
            className="w-12 h-12 rounded-md bg-cover bg-center shrink-0 shadow-soft border border-line-light dark:border-line-dark"
            style={{ backgroundImage: `url(${stash.referenceImage})` }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-muted-light dark:text-muted-dark text-[9px]">
              Reference photo
            </div>
            <div className="text-[11px] text-ink-light dark:text-ink-dark mt-0.5">
              attached · prints as polaroid
            </div>
          </div>
          <button
            onClick={() => setReferenceImage(undefined)}
            className="text-muted-light dark:text-muted-dark hover:text-red-500 text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-canvas-light dark:hover:bg-canvas-dark"
            title="Remove reference photo"
            aria-label="Remove reference photo"
          >
            ×
          </button>
        </div>
      )}

      {stash.gradient && (
        <div className="px-4 py-3 border-b border-line-light dark:border-line-dark flex items-center gap-3 bg-canvas-light/40 dark:bg-canvas-dark/40">
          <div
            className="w-12 h-12 rounded-md shrink-0 shadow-soft border border-line-light dark:border-line-dark"
            style={{ background: gradientCss(stash.gradient) }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-muted-light dark:text-muted-dark text-[9px]">
              Gradient
            </div>
            <div className="text-[11px] text-ink-light dark:text-ink-dark mt-0.5">
              {stash.gradient.type} · {stash.gradient.stops.length} stops
            </div>
          </div>
          <button
            onClick={() => setGradient(undefined)}
            className="text-muted-light dark:text-muted-dark hover:text-red-500 text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-canvas-light dark:hover:bg-canvas-dark"
            title="Remove gradient"
            aria-label="Remove gradient"
          >
            ×
          </button>
        </div>
      )}

      {fontPair && (
        <div className="px-4 py-3 border-b border-line-light dark:border-line-dark flex items-center gap-3 bg-canvas-light/40 dark:bg-canvas-dark/40">
          <div
            className="w-12 h-12 rounded-md shrink-0 shadow-soft border border-line-light dark:border-line-dark bg-canvas-light dark:bg-canvas-dark flex items-center justify-center"
            aria-hidden
          >
            <span
              className="text-[20px] leading-none text-ink-light dark:text-ink-dark"
              style={{ fontFamily: fontStack(fontPair.heading.family), fontWeight: fontPair.heading.weight }}
            >
              Aa
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-muted-light dark:text-muted-dark text-[9px]">Font pair</div>
            <div className="text-[11px] text-ink-light dark:text-ink-dark mt-0.5 truncate">
              {fontPair.name}
            </div>
          </div>
          <button
            onClick={() => setFontPair(undefined)}
            className="text-muted-light dark:text-muted-dark hover:text-red-500 text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-canvas-light dark:hover:bg-canvas-dark"
            title="Remove font pair"
            aria-label="Remove font pair"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-thin">
        {stash.swatches.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-3xl opacity-20 mb-2">◇</div>
            <div className="text-sm text-muted-light dark:text-muted-dark leading-relaxed">
              Click any swatch in the app to add it here.
            </div>
          </div>
        ) : (
          <ul className="p-2.5 space-y-1">
            {stash.swatches.map((s) => (
              <li
                key={s.hex}
                className="group flex items-center gap-3 p-2 rounded-md hover:bg-canvas-light/70 dark:hover:bg-canvas-dark/70 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-md shrink-0 shadow-soft"
                  style={{ background: s.hex }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[13px] text-ink-light dark:text-ink-dark tracking-tight">
                    {s.hex}
                  </div>
                  {s.name && (
                    <div className="text-[10px] text-muted-light dark:text-muted-dark truncate">
                      {s.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeSwatch(s.hex)}
                  className="opacity-0 group-hover:opacity-100 text-muted-light dark:text-muted-dark hover:text-red-500 text-sm w-6 h-6 flex items-center justify-center rounded transition-opacity"
                  aria-label={`Remove ${s.hex}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3.5 border-t border-line-light dark:border-line-dark space-y-2">
        <button
          onClick={onCopyAll}
          disabled={stash.swatches.length === 0}
          className="w-full text-[12px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
        >
          {copyAllLabel}
        </button>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => exportPNG(stash)}
            disabled={stash.swatches.length === 0}
            className="text-[11px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
          >
            PNG
          </button>
          <button
            onClick={() => exportJPG(stash)}
            disabled={stash.swatches.length === 0}
            className="text-[11px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
          >
            JPG
          </button>
          <button
            onClick={() => exportPDF(stash, { customLogoDataUrl: customLogo })}
            disabled={stash.swatches.length === 0}
            className="text-[11px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
            title={customLogo ? "PDF (with your logo)" : "PDF"}
          >
            PDF{customLogo ? "★" : ""}
          </button>
          <button
            onClick={() => exportSVG(stash)}
            disabled={stash.swatches.length === 0}
            className="text-[11px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
          >
            SVG
          </button>
        </div>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full text-[11px] py-1.5 rounded-md text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors flex items-center justify-center gap-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          {showAdvanced ? "Hide developer formats" : "More formats"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => exportCSS(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="CSS variables"
            >
              CSS
            </button>
            <button
              onClick={() => exportSCSS(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="SCSS variables"
            >
              SCSS
            </button>
            <button
              onClick={() => exportTailwind(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="Tailwind config"
            >
              Tailwind
            </button>
            <button
              onClick={() => exportJSON(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="JSON snapshot"
            >
              JSON
            </button>
            <button
              onClick={() => exportFigmaTokens(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="Figma / W3C tokens"
            >
              Tokens
            </button>
            <button
              onClick={() => exportCSV(stash)}
              disabled={stash.swatches.length === 0}
              className="text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="CSV (Adobe-importable)"
            >
              CSV
            </button>
            <button
              onClick={() => exportTXT(stash)}
              disabled={stash.swatches.length === 0}
              className="col-span-3 text-[10px] py-1.5 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark disabled:opacity-40 transition-colors font-medium"
              title="Plain text list"
            >
              TXT
            </button>
          </div>
        )}

        <button
          onClick={() => setShowLogoSettings((v) => !v)}
          className="w-full text-[11px] py-1.5 rounded-md text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark transition-colors flex items-center justify-center gap-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showLogoSettings ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          {customLogo ? "Logo on PDF · attached" : "Add logo to PDF"}
        </button>

        {showLogoSettings && (
          <div className="space-y-2 pt-1">
            {customLogo ? (
              <div className="flex items-center gap-2 p-2 rounded-md border border-line-light dark:border-line-dark">
                <div
                  className="w-10 h-10 rounded bg-contain bg-center bg-no-repeat shrink-0 bg-canvas-light dark:bg-canvas-dark"
                  style={{ backgroundImage: `url(${customLogo})` }}
                  aria-hidden
                />
                <div className="flex-1 text-[10px] text-muted-light dark:text-muted-dark">
                  Saved · appears on PDF cover
                </div>
                <button
                  onClick={() => setCustomLogo(undefined)}
                  className="text-muted-light dark:text-muted-dark hover:text-red-500 text-xs px-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoFileRef.current?.click()}
                className="w-full text-[11px] py-2 rounded-md border border-dashed border-line-light dark:border-line-dark text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
              >
                Upload logo · PNG with transparency
              </button>
            )}
            <input
              ref={logoFileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogoFile(f);
              }}
            />
          </div>
        )}

        {confirmClear ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                clearSwatches();
                setConfirmClear(false);
              }}
              className="flex-1 text-[11px] py-2 rounded-md bg-red-500 text-white hover:bg-red-600 font-medium"
            >
              Confirm clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-3 text-[11px] py-2 rounded-md border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={stash.swatches.length === 0}
            className="w-full text-[11px] py-1.5 rounded-md text-muted-light dark:text-muted-dark hover:text-red-500 disabled:opacity-40 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  );
}
