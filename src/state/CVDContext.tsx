import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CVDMode =
  | "none"
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "achromatopsia"
  | "achromatomaly";

export const CVD_MODES: Array<{
  id: CVDMode;
  label: string;
  hint: string;
}> = [
  { id: "none", label: "Normal vision", hint: "no simulation" },
  { id: "deuteranomaly", label: "Deuteranomaly", hint: "green-weak · ~5% of men" },
  { id: "deuteranopia", label: "Deuteranopia", hint: "green-blind · ~1% of men" },
  { id: "protanomaly", label: "Protanomaly", hint: "red-weak · ~1% of men" },
  { id: "protanopia", label: "Protanopia", hint: "red-blind · ~1% of men" },
  { id: "tritanomaly", label: "Tritanomaly", hint: "blue-weak · rare" },
  { id: "tritanopia", label: "Tritanopia", hint: "blue-blind · rare" },
  { id: "achromatomaly", label: "Achromatomaly", hint: "partial color loss · rare" },
  { id: "achromatopsia", label: "Achromatopsia", hint: "no color · ~0.003%" },
];

const CVDContext = createContext<{
  mode: CVDMode;
  setMode: (m: CVDMode) => void;
} | null>(null);

const STORAGE_KEY = "colour-pantry-cvd";

function isCVDMode(v: string | null): v is CVDMode {
  return (
    !!v &&
    [
      "none",
      "protanopia",
      "protanomaly",
      "deuteranopia",
      "deuteranomaly",
      "tritanopia",
      "tritanomaly",
      "achromatopsia",
      "achromatomaly",
    ].includes(v)
  );
}

export function CVDProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CVDMode>(() => {
    if (typeof window === "undefined") return "none";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isCVDMode(saved) ? saved : "none";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <CVDContext.Provider value={{ mode, setMode }}>{children}</CVDContext.Provider>
  );
}

export function useCVD() {
  const v = useContext(CVDContext);
  if (!v) throw new Error("useCVD must be used inside CVDProvider");
  return v;
}
