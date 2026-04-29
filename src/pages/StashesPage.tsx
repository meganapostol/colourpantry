import { useEffect, useMemo, useState } from "react";
import {
  type Stash,
  FOLDERS,
  type FolderId,
  deleteStash,
  getAllStashes,
  newStash,
  saveStash,
} from "../lib/db";
import { useStash } from "../state/StashContext";
import { exportPDF, exportPNG, exportSVG } from "../lib/exports";

export function StashesPage() {
  const { stash: activeStash, loadStash, showToast } = useStash();
  const [stashes, setStashes] = useState<Stash[]>([]);
  const [folder, setFolder] = useState<FolderId>("personal");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openStash, setOpenStash] = useState<Stash | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllStashes().then((list) => {
      if (!cancelled) setStashes(list);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, activeStash.updatedAt]);

  const inFolder = useMemo(
    () => stashes.filter((s) => s.folder === folder),
    [stashes, folder],
  );

  const createNew = async () => {
    const s = newStash(folder);
    s.name = "Untitled Stash";
    await saveStash(s);
    setRefreshKey((k) => k + 1);
    showToast("New stash created");
  };

  const onDelete = async (id: string) => {
    await deleteStash(id);
    setRefreshKey((k) => k + 1);
    setOpenStash(null);
  };

  const onLoad = async (id: string) => {
    await loadStash(id);
    showToast("Loaded into sidebar");
  };

  return (
    <div className="canvas-grain min-h-full">
      <div className="px-6 pt-12 pb-16 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <span className="eyebrow text-muted-light dark:text-muted-dark">
              auto-saved · client-side only
            </span>
            <h1 className="display-tight font-display font-medium text-[clamp(2rem,5vw,3.5rem)] text-ink-light dark:text-ink-dark mt-3">
              Your stashes.
            </h1>
            <p className="mt-3 text-base text-muted-light dark:text-muted-dark max-w-2xl">
              Saved palettes organized by folder. Click to open and export, or load one back into the sidebar.
            </p>
          </div>
          <button
            onClick={createNew}
            className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
          >
            + New stash
          </button>
        </div>

        <div className="flex gap-1 border-b border-line-light dark:border-line-dark mb-6 overflow-x-auto">
          {FOLDERS.map((f) => {
            const count = stashes.filter((s) => s.folder === f.id).length;
            const active = folder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active
                    ? "border-ink-light dark:border-ink-dark text-ink-light dark:text-ink-dark"
                    : "border-transparent text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-[11px] opacity-60 font-mono">{count}</span>
              </button>
            );
          })}
        </div>

        {inFolder.length === 0 ? (
          <div className="text-center text-sm text-muted-light dark:text-muted-dark py-20 rounded-2xl border border-dashed border-line-light dark:border-line-dark">
            No stashes in this folder yet. Click swatches anywhere in the app to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {inFolder.map((s) => (
              <button
                key={s.id}
                onClick={() => setOpenStash(s)}
                className="text-left rounded-2xl border border-line-light dark:border-line-dark p-4 bg-surface-light dark:bg-surface-dark lift-hover"
              >
                <StashThumbnail stash={s} />
                <div className="mt-3 font-medium text-base text-ink-light dark:text-ink-dark truncate tracking-tight">
                  {s.name}
                </div>
                <div className="text-[11px] text-muted-light dark:text-muted-dark mt-0.5">
                  {s.swatches.length} swatch{s.swatches.length === 1 ? "" : "es"} ·{" "}
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}

        {openStash && (
          <StashModal
            stash={openStash}
            onClose={() => setOpenStash(null)}
            onLoad={() => onLoad(openStash.id)}
            onDelete={() => onDelete(openStash.id)}
          />
        )}
      </div>
    </div>
  );
}

function StashThumbnail({ stash }: { stash: Stash }) {
  const swatches = stash.swatches.slice(0, 16);
  const empty = 16 - swatches.length;
  return (
    <div className="grid grid-cols-4 gap-1 aspect-square rounded-md overflow-hidden">
      {swatches.map((s, i) => (
        <div key={`${s.hex}-${i}`} className="rounded-sm" style={{ background: s.hex }} />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <div
          key={`e-${i}`}
          className="rounded-sm bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark"
        />
      ))}
    </div>
  );
}

function StashModal({
  stash,
  onClose,
  onLoad,
  onDelete,
}: {
  stash: Stash;
  onClose: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto scroll-thin border border-line-light dark:border-line-dark shadow-lift animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-line-light dark:border-line-dark flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow text-muted-light dark:text-muted-dark text-[10px]">
              Stash
            </span>
            <div className="text-xl font-display font-medium tracking-tight text-ink-light dark:text-ink-dark mt-1">
              {stash.name}
            </div>
            <div className="text-[12px] text-muted-light dark:text-muted-dark mt-1">
              {stash.swatches.length} swatch{stash.swatches.length === 1 ? "" : "es"} · updated{" "}
              {new Date(stash.updatedAt).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark w-8 h-8 rounded-full hover:bg-canvas-light dark:hover:bg-canvas-dark flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {stash.swatches.length === 0 ? (
            <div className="text-sm text-muted-light dark:text-muted-dark text-center py-10">
              Empty stash.
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {stash.swatches.map((s) => (
                <div
                  key={s.hex}
                  className="aspect-square rounded-md"
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
            className="btn-pill bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark hover:opacity-90"
          >
            Load into sidebar
          </button>
          <button
            onClick={() => exportPNG(stash)}
            className="btn-pill border border-line-light dark:border-line-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
          >
            PNG
          </button>
          <button
            onClick={() => exportPDF(stash)}
            className="btn-pill border border-line-light dark:border-line-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
          >
            PDF
          </button>
          <button
            onClick={() => exportSVG(stash)}
            className="btn-pill border border-line-light dark:border-line-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
          >
            SVG
          </button>
          <div className="ml-auto">
            {confirmDel ? (
              <span className="flex gap-2">
                <button
                  onClick={onDelete}
                  className="btn-pill bg-red-500 text-white hover:bg-red-600"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  className="btn-pill border border-line-light dark:border-line-dark"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className="btn-pill text-muted-light dark:text-muted-dark hover:text-red-500"
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
