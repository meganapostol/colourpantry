import chroma from "chroma-js";

export type WCAGLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function contrastRatio(a: string, b: string): number {
  return chroma.contrast(a, b);
}

export function wcagLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export function levelDescription(level: WCAGLevel): string {
  switch (level) {
    case "AAA":
      return "Passes AAA (any text)";
    case "AA":
      return "Passes AA (any text)";
    case "AA Large":
      return "Passes AA only at 18pt+ or 14pt+ bold";
    case "Fail":
      return "Insufficient contrast";
  }
}

export function levelClass(level: WCAGLevel): string {
  switch (level) {
    case "AAA":
      return "text-emerald-700 dark:text-emerald-400";
    case "AA":
      return "text-emerald-600 dark:text-emerald-400";
    case "AA Large":
      return "text-amber-600 dark:text-amber-400";
    case "Fail":
      return "text-red-600 dark:text-red-400";
  }
}
