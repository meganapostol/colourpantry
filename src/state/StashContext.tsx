import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Stash,
  type FolderId,
  type Swatch,
  newStash,
  saveStash,
  getMeta,
  setMeta,
  getStash,
} from "../lib/db";
import { nameForHex } from "../lib/color";

interface StashContextValue {
  stash: Stash;
  setName: (name: string) => void;
  setFolder: (folder: FolderId) => void;
  addSwatch: (hex: string) => void;
  removeSwatch: (hex: string) => void;
  clearSwatches: () => void;
  startNewStash: () => void;
  loadStash: (id: string) => Promise<void>;
  toast: string | null;
  showToast: (msg: string) => void;
  recentlyAdded: string | null;
}

const StashContext = createContext<StashContextValue | null>(null);

const ACTIVE_STASH_KEY = "active-stash-id";

export function StashProvider({ children }: { children: ReactNode }) {
  const [stash, setStash] = useState<Stash>(() => newStash("personal"));
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const recentTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeId = await getMeta(ACTIVE_STASH_KEY);
        if (activeId) {
          const found = await getStash(activeId);
          if (found && !cancelled) {
            setStash(found);
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveStash(stash);
      setMeta(ACTIVE_STASH_KEY, stash.id);
    }, 200);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [stash, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1400);
  }, []);

  const setName = useCallback((name: string) => {
    setStash((s) => ({ ...s, name }));
  }, []);

  const setFolder = useCallback((folder: FolderId) => {
    setStash((s) => ({ ...s, folder }));
  }, []);

  const addSwatch = useCallback(
    (hex: string) => {
      const norm = hex.toUpperCase();
      setStash((s) => {
        if (s.swatches.some((sw) => sw.hex.toUpperCase() === norm)) {
          return s;
        }
        const sw: Swatch = {
          hex: norm,
          name: nameForHex(norm),
          addedAt: Date.now(),
        };
        return { ...s, swatches: [...s.swatches, sw] };
      });
      try {
        navigator.clipboard?.writeText(norm);
      } catch {
        /* noop */
      }
      setRecentlyAdded(norm);
      if (recentTimer.current) window.clearTimeout(recentTimer.current);
      recentTimer.current = window.setTimeout(() => setRecentlyAdded(null), 3000);
      showToast(`${norm} copied & saved`);
    },
    [showToast],
  );

  const removeSwatch = useCallback((hex: string) => {
    const norm = hex.toUpperCase();
    setStash((s) => ({
      ...s,
      swatches: s.swatches.filter((sw) => sw.hex.toUpperCase() !== norm),
    }));
  }, []);

  const clearSwatches = useCallback(() => {
    setStash((s) => ({ ...s, swatches: [] }));
  }, []);

  const startNewStash = useCallback(() => {
    setStash((prev) => newStash(prev.folder));
  }, []);

  const loadStash = useCallback(async (id: string) => {
    const found = await getStash(id);
    if (found) setStash(found);
  }, []);

  const value = useMemo<StashContextValue>(
    () => ({
      stash,
      setName,
      setFolder,
      addSwatch,
      removeSwatch,
      clearSwatches,
      startNewStash,
      loadStash,
      toast,
      showToast,
      recentlyAdded,
    }),
    [
      stash,
      setName,
      setFolder,
      addSwatch,
      removeSwatch,
      clearSwatches,
      startNewStash,
      loadStash,
      toast,
      showToast,
      recentlyAdded,
    ],
  );

  return <StashContext.Provider value={value}>{children}</StashContext.Provider>;
}

export function useStash(): StashContextValue {
  const v = useContext(StashContext);
  if (!v) throw new Error("useStash must be used inside StashProvider");
  return v;
}
