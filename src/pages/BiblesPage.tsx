import { useEffect, useMemo, useState } from "react";
import {
  type Bible,
  FOLDERS,
  type FolderId,
  deleteBible,
  getAllBibles,
  saveBible,
} from "../lib/db";
import { useBible } from "../state/BibleContext";
import { newBible } from "../lib/db";
import { exportPDF, exportPNG, exportSVG } from "../lib/exports";

export function BiblesPage() {
  const { bible: activeBible, loadBible, showToast } = useBible();
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [folder, setFolder] = useState<FolderId>("personal");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openBible, setOpenBible] = useState<Bible | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllBibles().then((list) => {
      if (!cancelled) setBibles(list);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, activeBible.updatedAt]);

  const inFolder = useMemo(
    () => bibles.filter((b) => b.folder === folder),
    [bibles, folder],
  );

  const createNew = async () => {
    const b = newBible(folder);
    b.name = "Untitled Bible";
    await saveBible(b);
    setRefreshKey((k) => k + 1);
    showToast("New bible created");
  };

  const onDelete = async (id: string) => {
    await deleteBible(id);
    setRefreshKey((k) => k + 1);
    setOpenBible(null);
  };

  const onLoad = async (id: string) => {
    await loadBible(id);
    showToast("Loaded into sidebar");
  };

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-light dark:text-ink-dark">
            Bibles
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Saved palettes organized by folder. Click to open, or load into the sidebar.
          </p>
        </div>
        <button
          onClick={createNew}
          className="text-xs px-3 py-1.5 rounded bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
        >
          + New Bible
        </button>
      </div>

      <div className="flex gap-1 border-b border-line-light dark:border-line-dark mb-4">
        {FOLDERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFolder(f.id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              folder === f.id
                ? "border-ink-light dark:border-ink-dark text-ink-light dark:text-ink-dark"
                : "border-transparent text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
            }`}
          >
            {f.label}{" "}
            <span className="text-xs opacity-60">
              ({bibles.filter((b) => b.folder === f.id).length})
            </span>
          </button>
        ))}
      </div>

      {inFolder.length === 0 ? (
        <div className="text-center text-sm text-muted-light dark:text-muted-dark py-12">
          No bibles in this folder yet. Click swatches anywhere in the app to start one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {inFolder.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpenBible(b)}
              className="text-left rounded-md border border-line-light dark:border-line-dark p-3 bg-white dark:bg-neutral-900 hover:border-ink-light dark:hover:border-ink-dark transition-colors"
            >
              <BibleThumbnail bible={b} />
              <div className="mt-2 font-medium text-sm text-ink-light dark:text-ink-dark truncate">
                {b.name}
              </div>
              <div className="text-[11px] text-muted-light dark:text-muted-dark">
                {b.swatches.length} swatches · {new Date(b.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {openBible && (
        <BibleModal
          bible={openBible}
          onClose={() => setOpenBible(null)}
          onLoad={() => onLoad(openBible.id)}
          onDelete={() => onDelete(openBible.id)}
        />
      )}
    </div>
  );
}

function BibleThumbnail({ bible }: { bible: Bible }) {
  const swatches = bible.swatches.slice(0, 16);
  const empty = 16 - swatches.length;
  return (
    <div className="grid grid-cols-4 gap-0.5 aspect-square rounded overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {swatches.map((s, i) => (
        <div key={`${s.hex}-${i}`} style={{ background: s.hex }} />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <div key={`e-${i}`} className="bg-neutral-200 dark:bg-neutral-800" />
      ))}
    </div>
  );
}

function BibleModal({
  bible,
  onClose,
  onLoad,
  onDelete,
}: {
  bible: Bible;
  onClose: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-canvas-light dark:bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto scroll-thin border border-line-light dark:border-line-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-line-light dark:border-line-dark flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-ink-light dark:text-ink-dark">
              {bible.name}
            </div>
            <div className="text-xs text-muted-light dark:text-muted-dark">
              {bible.swatches.length} swatches · updated {new Date(bible.updatedAt).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {bible.swatches.length === 0 ? (
            <div className="text-sm text-muted-light dark:text-muted-dark text-center py-8">
              Empty bible.
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {bible.swatches.map((s) => (
                <div
                  key={s.hex}
                  className="aspect-square rounded border border-line-light dark:border-line-dark"
                  style={{ background: s.hex }}
                  title={`${s.hex} · ${s.name ?? ""}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line-light dark:border-line-dark flex flex-wrap gap-2">
          <button
            onClick={onLoad}
            className="text-xs px-3 py-1.5 rounded bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
          >
            Load into sidebar
          </button>
          <button
            onClick={() => exportPNG(bible)}
            className="text-xs px-3 py-1.5 rounded border border-line-light dark:border-line-dark hover:bg-white dark:hover:bg-neutral-800"
          >
            Export PNG
          </button>
          <button
            onClick={() => exportPDF(bible)}
            className="text-xs px-3 py-1.5 rounded border border-line-light dark:border-line-dark hover:bg-white dark:hover:bg-neutral-800"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportSVG(bible)}
            className="text-xs px-3 py-1.5 rounded border border-line-light dark:border-line-dark hover:bg-white dark:hover:bg-neutral-800"
          >
            Export SVG
          </button>
          <div className="ml-auto">
            {confirmDel ? (
              <span className="flex gap-2">
                <button
                  onClick={onDelete}
                  className="text-xs px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  className="text-xs px-3 py-1.5 rounded border border-line-light dark:border-line-dark"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className="text-xs px-3 py-1.5 rounded text-muted-light dark:text-muted-dark hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
