import { useEffect, useMemo, useRef, useState } from "react";
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
import { exportJPG, exportPDF, exportPNG, exportSVG } from "../lib/exports";

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
    <div className="canvas-grain h-full overflow-y-auto scroll-thin">
      <div className="px-6 pt-8 pb-10 max-w-[1400px] mx-auto">
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
              <StashCard
                key={s.id}
                stash={s}
                onOpen={() => setOpenStash(s)}
                onLoad={() => onLoad(s.id)}
                onDelete={() => onDelete(s.id)}
              />
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

function StashCard({
  stash,
  onOpen,
  onLoad,
  onDelete,
}: {
  stash: Stash;
  onOpen: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDel(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setConfirmDel(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative text-left rounded-2xl border border-line-light dark:border-line-dark p-4 bg-surface-light dark:bg-surface-dark lift-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink-light dark:focus:ring-ink-dark"
    >
      <StashThumbnail stash={stash} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-base text-ink-light dark:text-ink-dark truncate tracking-tight">
            {stash.name}
          </div>
          <div className="text-[11px] text-muted-light dark:text-muted-dark mt-0.5">
            {stash.swatches.length} swatch{stash.swatches.length === 1 ? "" : "es"} ·{" "}
            {new Date(stash.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0" onClick={stop}>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setMenuOpen((v) => !v);
              setConfirmDel(false);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`More actions for ${stash.name}`}
            title="More actions"
            className="w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-full text-muted-light dark:text-muted-dark hover:text-ink-light dark:hover:text-ink-dark hover:bg-canvas-light dark:hover:bg-canvas-dark transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-9 right-0 z-20 w-48 rounded-xl border border-line-light dark:border-line-dark bg-canvas-light dark:bg-canvas-dark shadow-lift overflow-hidden p-1"
              onClick={stop}
            >
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  onOpen();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
              >
                Open
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  onLoad();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-ink-light dark:text-ink-dark hover:bg-surface-light dark:hover:bg-surface-dark"
              >
                Load into sidebar
              </button>
              <div className="my-1 border-t border-line-light dark:border-line-dark" />
              {confirmDel ? (
                <div className="flex gap-1 p-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setMenuOpen(false);
                      setConfirmDel(false);
                      onDelete();
                    }}
                    className="flex-1 px-2 py-1.5 rounded-md bg-red-500 text-white text-[12px] font-medium hover:bg-red-600"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setConfirmDel(false);
                    }}
                    className="px-2 py-1.5 rounded-md border border-line-light dark:border-line-dark text-[12px] text-ink-light dark:text-ink-dark"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    stop(e);
                    setConfirmDel(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  Delete stash
                </button>
              )}
            </div>
          )}
        </div>
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
            onClick={() => exportJPG(stash)}
            className="btn-pill border border-line-light dark:border-line-dark hover:bg-canvas-light dark:hover:bg-canvas-dark"
          >
            JPG
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
