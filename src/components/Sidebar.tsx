import { useState } from "react";
import { useBible } from "../state/BibleContext";
import { FOLDERS, type FolderId } from "../lib/db";
import { exportPDF, exportPNG, exportSVG } from "../lib/exports";
import { readableTextOn } from "../lib/color";

export function Sidebar() {
  const {
    bible,
    setName,
    setFolder,
    removeSwatch,
    clearSwatches,
    startNewBible,
  } = useBible();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copyAllLabel, setCopyAllLabel] = useState("Copy All");

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-neutral-900 border border-line-light dark:border-line-dark border-r-0 rounded-l-md px-2 py-3 text-sm text-ink-light dark:text-ink-dark shadow-md"
        aria-label="Open bible sidebar"
      >
        ◀ <span className="ml-1">{bible.swatches.length}</span>
      </button>
    );
  }

  const onCopyAll = async () => {
    const text = bible.swatches.map((s) => s.hex).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      setCopyAllLabel("Copied!");
      setTimeout(() => setCopyAllLabel("Copy All"), 1200);
    } catch {
      setCopyAllLabel("Failed");
      setTimeout(() => setCopyAllLabel("Copy All"), 1200);
    }
  };

  return (
    <aside className="w-72 shrink-0 bg-canvas-light dark:bg-neutral-950 border-l border-line-light dark:border-line-dark flex flex-col h-full">
      <div className="p-4 border-b border-line-light dark:border-line-dark space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-light dark:text-muted-dark">
            Current Bible
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark text-sm"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            ▶
          </button>
        </div>
        <input
          value={bible.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled Bible"
          className="w-full bg-transparent text-ink-light dark:text-ink-dark text-base font-medium border-b border-transparent focus:border-line-light dark:focus:border-line-dark outline-none py-1"
        />
        <select
          value={bible.folder}
          onChange={(e) => setFolder(e.target.value as FolderId)}
          className="w-full text-sm bg-white dark:bg-neutral-900 border border-line-light dark:border-line-dark rounded px-2 py-1 text-ink-light dark:text-ink-dark"
        >
          {FOLDERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          onClick={startNewBible}
          className="text-xs text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
        >
          + new bible
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {bible.swatches.length === 0 ? (
          <div className="p-6 text-sm text-muted-light dark:text-muted-dark text-center">
            Click any color to add it to your bible.
          </div>
        ) : (
          <ul className="p-2">
            {bible.swatches.map((s) => (
              <li
                key={s.hex}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-neutral-900"
              >
                <div
                  className="w-8 h-8 rounded border border-line-light dark:border-line-dark shrink-0"
                  style={{ background: s.hex, color: readableTextOn(s.hex) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-ink-light dark:text-ink-dark">
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
                  className="text-muted-light dark:text-muted-dark hover:text-red-500 text-xs px-1"
                  aria-label={`Remove ${s.hex}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-line-light dark:border-line-dark space-y-1.5">
        <button
          onClick={onCopyAll}
          disabled={bible.swatches.length === 0}
          className="w-full text-xs py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-40"
        >
          {copyAllLabel}
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => exportPNG(bible)}
            disabled={bible.swatches.length === 0}
            className="text-xs py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-40"
          >
            PNG
          </button>
          <button
            onClick={() => exportPDF(bible)}
            disabled={bible.swatches.length === 0}
            className="text-xs py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-40"
          >
            PDF
          </button>
          <button
            onClick={() => exportSVG(bible)}
            disabled={bible.swatches.length === 0}
            className="text-xs py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-40"
          >
            SVG
          </button>
        </div>
        {confirmClear ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                clearSwatches();
                setConfirmClear(false);
              }}
              className="flex-1 text-xs py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Confirm clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-3 text-xs py-1.5 rounded border border-line-light dark:border-line-dark text-ink-light dark:text-ink-dark"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={bible.swatches.length === 0}
            className="w-full text-xs py-1.5 rounded text-muted-light dark:text-muted-dark hover:text-red-500 disabled:opacity-40"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  );
}
