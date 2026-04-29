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
  type Bible,
  type FolderId,
  type Swatch,
  newBible,
  saveBible,
  getMeta,
  setMeta,
  getBible,
} from "../lib/db";
import { nameForHex } from "../lib/color";

interface BibleContextValue {
  bible: Bible;
  setName: (name: string) => void;
  setFolder: (folder: FolderId) => void;
  addSwatch: (hex: string) => void;
  removeSwatch: (hex: string) => void;
  clearSwatches: () => void;
  startNewBible: () => void;
  loadBible: (id: string) => Promise<void>;
  toast: string | null;
  showToast: (msg: string) => void;
}

const BibleContext = createContext<BibleContextValue | null>(null);

const ACTIVE_BIBLE_KEY = "active-bible-id";

export function BibleProvider({ children }: { children: ReactNode }) {
  const [bible, setBible] = useState<Bible>(() => newBible("personal"));
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  // hydrate from IndexedDB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeId = await getMeta(ACTIVE_BIBLE_KEY);
        if (activeId) {
          const found = await getBible(activeId);
          if (found && !cancelled) {
            setBible(found);
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

  // debounced auto-save on every change after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveBible(bible);
      setMeta(ACTIVE_BIBLE_KEY, bible.id);
    }, 200);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [bible, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1400);
  }, []);

  const setName = useCallback((name: string) => {
    setBible((b) => ({ ...b, name }));
  }, []);

  const setFolder = useCallback((folder: FolderId) => {
    setBible((b) => ({ ...b, folder }));
  }, []);

  const addSwatch = useCallback(
    (hex: string) => {
      const norm = hex.toUpperCase();
      setBible((b) => {
        if (b.swatches.some((s) => s.hex.toUpperCase() === norm)) {
          return b;
        }
        const sw: Swatch = {
          hex: norm,
          name: nameForHex(norm),
          addedAt: Date.now(),
        };
        return { ...b, swatches: [...b.swatches, sw] };
      });
      // Copy to clipboard
      try {
        navigator.clipboard?.writeText(norm);
      } catch {
        /* noop */
      }
      showToast(`${norm} copied & saved`);
    },
    [showToast],
  );

  const removeSwatch = useCallback((hex: string) => {
    const norm = hex.toUpperCase();
    setBible((b) => ({
      ...b,
      swatches: b.swatches.filter((s) => s.hex.toUpperCase() !== norm),
    }));
  }, []);

  const clearSwatches = useCallback(() => {
    setBible((b) => ({ ...b, swatches: [] }));
  }, []);

  const startNewBible = useCallback(() => {
    setBible((prev) => newBible(prev.folder));
  }, []);

  const loadBible = useCallback(async (id: string) => {
    const found = await getBible(id);
    if (found) setBible(found);
  }, []);

  const value = useMemo<BibleContextValue>(
    () => ({
      bible,
      setName,
      setFolder,
      addSwatch,
      removeSwatch,
      clearSwatches,
      startNewBible,
      loadBible,
      toast,
      showToast,
    }),
    [
      bible,
      setName,
      setFolder,
      addSwatch,
      removeSwatch,
      clearSwatches,
      startNewBible,
      loadBible,
      toast,
      showToast,
    ],
  );

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
}

export function useBible(): BibleContextValue {
  const v = useContext(BibleContext);
  if (!v) throw new Error("useBible must be used inside BibleProvider");
  return v;
}
