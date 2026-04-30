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
  type Gradient,
  type FontPairing,
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
  addSwatch: (hex: string, opts?: { silent?: boolean }) => void;
  addManySwatches: (hexes: string[]) => void;
  replaceSwatches: (hexes: string[]) => void;
  removeSwatch: (hex: string) => void;
  clearSwatches: () => void;
  setReferenceImage: (dataUrl: string | undefined) => void;
  setGradient: (gradient: Gradient | undefined) => void;
  setFontPair: (pair: FontPairing | undefined) => void;
  startNewStash: () => void;
  loadStash: (id: string) => Promise<void>;
  toast: string | null;
  showToast: (msg: string) => void;
  recentlyAdded: string | null;
  customLogo: string | undefined;
  setCustomLogo: (dataUrl: string | undefined) => void;
}

const StashContext = createContext<StashContextValue | null>(null);

const ACTIVE_STASH_KEY = "active-stash-id";
const CUSTOM_LOGO_KEY = "custom-logo-data-url";

export function StashProvider({ children }: { children: ReactNode }) {
  const [stash, setStash] = useState<Stash>(() => newStash("personal"));
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [customLogo, setCustomLogoState] = useState<string | undefined>(undefined);
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
        const logo = await getMeta(CUSTOM_LOGO_KEY);
        if (logo && !cancelled) setCustomLogoState(logo);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCustomLogo = useCallback((dataUrl: string | undefined) => {
    setCustomLogoState(dataUrl);
    if (dataUrl) {
      setMeta(CUSTOM_LOGO_KEY, dataUrl);
    } else {
      setMeta(CUSTOM_LOGO_KEY, "");
    }
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
    (hex: string, opts?: { silent?: boolean }) => {
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
      if (opts?.silent) return;
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

  const addManySwatches = useCallback(
    (hexes: string[]) => {
      setStash((s) => {
        const existing = new Set(s.swatches.map((sw) => sw.hex.toUpperCase()));
        const additions: Swatch[] = [];
        for (const hex of hexes) {
          const norm = hex.toUpperCase();
          if (existing.has(norm)) continue;
          existing.add(norm);
          additions.push({ hex: norm, name: nameForHex(norm), addedAt: Date.now() });
        }
        if (additions.length === 0) return s;
        return { ...s, swatches: [...s.swatches, ...additions] };
      });
    },
    [],
  );

  const replaceSwatches = useCallback((hexes: string[]) => {
    setStash((s) => {
      const seen = new Set<string>();
      const out: Swatch[] = [];
      for (const hex of hexes) {
        const norm = hex.toUpperCase();
        if (seen.has(norm)) continue;
        seen.add(norm);
        out.push({ hex: norm, name: nameForHex(norm), addedAt: Date.now() });
      }
      return { ...s, swatches: out };
    });
  }, []);

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

  const setReferenceImage = useCallback((dataUrl: string | undefined) => {
    setStash((s) => ({ ...s, referenceImage: dataUrl }));
  }, []);

  const setGradient = useCallback((gradient: Gradient | undefined) => {
    setStash((s) => ({ ...s, gradient }));
  }, []);

  const setFontPair = useCallback((pair: FontPairing | undefined) => {
    setStash((s) => ({ ...s, fontPair: pair }));
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
      addManySwatches,
      replaceSwatches,
      removeSwatch,
      clearSwatches,
      setReferenceImage,
      setGradient,
      setFontPair,
      startNewStash,
      loadStash,
      toast,
      showToast,
      recentlyAdded,
      customLogo,
      setCustomLogo,
    }),
    [
      stash,
      setName,
      setFolder,
      addSwatch,
      addManySwatches,
      replaceSwatches,
      removeSwatch,
      clearSwatches,
      setReferenceImage,
      setGradient,
      setFontPair,
      startNewStash,
      loadStash,
      toast,
      showToast,
      recentlyAdded,
      customLogo,
      setCustomLogo,
    ],
  );

  return <StashContext.Provider value={value}>{children}</StashContext.Provider>;
}

export function useStash(): StashContextValue {
  const v = useContext(StashContext);
  if (!v) throw new Error("useStash must be used inside StashProvider");
  return v;
}
