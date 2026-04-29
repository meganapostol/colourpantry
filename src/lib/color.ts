import chroma from "chroma-js";

export interface HueFamily {
  id: string;
  name: string;
  centerHue: number;
  representativeHex: string;
}

const FAMILY_NAMES: Array<[number, string]> = [
  [0, "Crimson"],
  [15, "Scarlet"],
  [30, "Vermilion"],
  [45, "Amber"],
  [60, "Gold"],
  [75, "Citron"],
  [90, "Lime"],
  [105, "Chartreuse"],
  [120, "Leaf"],
  [135, "Fern"],
  [150, "Emerald"],
  [165, "Spring"],
  [180, "Teal"],
  [195, "Cyan"],
  [210, "Sky"],
  [225, "Azure"],
  [240, "Cobalt"],
  [255, "Indigo"],
  [270, "Violet"],
  [285, "Iris"],
  [300, "Magenta"],
  [315, "Fuchsia"],
  [330, "Rose"],
  [345, "Carmine"],
];

function pickRepresentativeHex(centerHue: number): string {
  // Find a saturated, mid-lightness in-gamut color for the family preview
  const candidates: Array<{ L: number; C: number }> = [];
  for (let L = 0.45; L <= 0.75; L += 0.05) {
    for (let C = 0.05; C <= 0.4; C += 0.02) {
      candidates.push({ L, C });
    }
  }
  let best: string | null = null;
  let bestC = -1;
  for (const { L, C } of candidates) {
    const col = chroma.oklch(L, C, centerHue);
    if (!col.clipped() && C > bestC) {
      best = col.hex();
      bestC = C;
    }
  }
  return best ?? chroma.oklch(0.6, 0.1, centerHue).hex();
}

export const HUE_FAMILIES: HueFamily[] = FAMILY_NAMES.map(([h, name]) => ({
  id: name.toLowerCase(),
  name,
  centerHue: h,
  representativeHex: pickRepresentativeHex(h),
}));

export function getFamilyById(id: string): HueFamily | undefined {
  return HUE_FAMILIES.find((f) => f.id === id);
}

export interface WaffleCell {
  hex: string;
  L: number;
  C: number;
  H: number;
}

/**
 * Generate a waffle of in-gamut swatches for a hue family at a given chroma level.
 * Hue: family center ± 7.5° at 1° steps (15 columns)
 * Lightness: 0–100% at 2% steps (50 rows, but we trim 0% black and 100% white)
 */
/**
 * Generate a 2D waffle showing every (lightness × chroma) combination at the
 * family's center hue. X axis = chroma (0 → maxC), Y axis = lightness
 * (~95% → ~5%). Out-of-gamut cells are returned with empty hex (caller hides
 * them, leaving an honest cutoff shape).
 */
export function generateFamilyAllChromas(
  centerHue: number,
  cols: number,
  rows: number,
  maxC: number,
): WaffleCell[][] {
  const out: WaffleCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const L = 0.95 - (r / Math.max(1, rows - 1)) * 0.9;
    const row: WaffleCell[] = [];
    for (let c = 0; c < cols; c++) {
      const C = (c / Math.max(1, cols - 1)) * maxC;
      const col = chroma.oklch(L, C, centerHue);
      row.push({
        hex: col.clipped() ? "" : col.hex(),
        L,
        C,
        H: centerHue,
      });
    }
    out.push(row);
  }
  return out;
}

/**
 * Find the maximum chroma value where at least one cell in the family is in-gamut.
 */
export function maxChromaForFamily(centerHue: number): number {
  // Test up to 0.4 (very saturated)
  let max = 0;
  for (let c = 0.4; c >= 0; c -= 0.005) {
    let anyIn = false;
    for (let l = 0.05; l <= 0.95; l += 0.05) {
      for (let h = -7; h <= 7; h += 2) {
        const H = (centerHue + h + 360) % 360;
        if (!chroma.oklch(l, c, H).clipped()) {
          anyIn = true;
          break;
        }
      }
      if (anyIn) break;
    }
    if (anyIn) {
      max = c;
      break;
    }
  }
  return Math.max(max, 0.05);
}

/**
 * Skin tone anchor pairs in OKLCH. Hand-calibrated to span warm/cool/neutral/olive
 * undertones at muted and saturated levels, plus a red-undertone row.
 *
 * Each pair: [lightest, darkest] as [L, C, H].
 */
export interface SkinRow {
  id: string;
  label: string;
  lightAnchor: [number, number, number];
  darkAnchor: [number, number, number];
}

export const SKIN_ROWS: SkinRow[] = [
  {
    id: "cool-muted",
    label: "Cool Muted",
    lightAnchor: [0.93, 0.022, 35],
    darkAnchor: [0.32, 0.025, 30],
  },
  {
    id: "cool-saturated",
    label: "Cool Saturated",
    lightAnchor: [0.93, 0.045, 32],
    darkAnchor: [0.3, 0.06, 28],
  },
  {
    id: "neutral-muted",
    label: "Neutral Muted",
    lightAnchor: [0.92, 0.03, 50],
    darkAnchor: [0.3, 0.035, 45],
  },
  {
    id: "neutral-saturated",
    label: "Neutral Saturated",
    lightAnchor: [0.92, 0.06, 50],
    darkAnchor: [0.3, 0.08, 45],
  },
  {
    id: "warm-muted",
    label: "Warm Muted",
    lightAnchor: [0.93, 0.04, 65],
    darkAnchor: [0.32, 0.045, 58],
  },
  {
    id: "warm-saturated",
    label: "Warm Saturated",
    lightAnchor: [0.93, 0.075, 65],
    darkAnchor: [0.3, 0.09, 58],
  },
  {
    id: "olive-muted",
    label: "Olive Muted",
    lightAnchor: [0.9, 0.035, 80],
    darkAnchor: [0.3, 0.04, 75],
  },
  {
    id: "olive-saturated",
    label: "Olive Saturated",
    lightAnchor: [0.9, 0.07, 80],
    darkAnchor: [0.28, 0.075, 75],
  },
];

export const ACCENT_GOLD = "#D4A574";

export function generateSkinRowSwatches(row: SkinRow, count = 12): string[] {
  const [l1, c1, h1] = row.lightAnchor;
  const [l2, c2, h2] = row.darkAnchor;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const L = l1 + (l2 - l1) * t;
    const C = c1 + (c2 - c1) * t;
    const H = h1 + (h2 - h1) * t;
    let col = chroma.oklch(L, C, H);
    if (col.clipped()) {
      // Pull chroma down until it fits
      let cAdj = C;
      while (cAdj > 0 && col.clipped()) {
        cAdj -= 0.005;
        col = chroma.oklch(L, cAdj, H);
      }
    }
    out.push(col.hex());
  }
  return out;
}

/**
 * Generate a neighborhood waffle for a skin row: hue band around the row's hue range,
 * stepped through lightness, at the row's chroma profile.
 */
export function generateSkinNeighborhood(row: SkinRow): WaffleCell[][] {
  const [, c1, h1] = row.lightAnchor;
  const [, c2, h2] = row.darkAnchor;
  const hueLow = Math.min(h1, h2) - 6;
  const hueHigh = Math.max(h1, h2) + 6;
  const rows: WaffleCell[][] = [];
  for (let l = 95; l >= 20; l -= 1.5) {
    const L = l / 100;
    const row: WaffleCell[] = [];
    const t = (95 - l) / (95 - 20);
    const C = c1 + (c2 - c1) * t;
    for (let h = hueLow; h <= hueHigh; h += 1) {
      const col = chroma.oklch(L, C, h);
      row.push({
        hex: col.clipped() ? "" : col.hex(),
        L,
        C,
        H: h,
      });
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Quick name-from-hex using nearest-named-color from a small built-in dictionary.
 * No external CDN, no network calls.
 */
const NAMED_COLORS: Array<[string, string]> = [
  ["#FFFFFF", "White"],
  ["#000000", "Black"],
  ["#808080", "Gray"],
  ["#C0C0C0", "Silver"],
  ["#FF0000", "Red"],
  ["#FF6347", "Tomato"],
  ["#FF7F50", "Coral"],
  ["#FFA500", "Orange"],
  ["#FFD700", "Gold"],
  ["#FFFF00", "Yellow"],
  ["#9ACD32", "Lime"],
  ["#008000", "Green"],
  ["#2E8B57", "Sea Green"],
  ["#008080", "Teal"],
  ["#00FFFF", "Cyan"],
  ["#1E90FF", "Sky"],
  ["#0000FF", "Blue"],
  ["#4B0082", "Indigo"],
  ["#8A2BE2", "Violet"],
  ["#FF00FF", "Magenta"],
  ["#FF1493", "Pink"],
  ["#DC143C", "Crimson"],
  ["#A0522D", "Sienna"],
  ["#8B4513", "Saddle Brown"],
  ["#D2B48C", "Tan"],
  ["#F5DEB3", "Wheat"],
  ["#FFE4C4", "Bisque"],
  ["#FFE4E1", "Misty Rose"],
  ["#F0E68C", "Khaki"],
  ["#BDB76B", "Olive"],
  ["#556B2F", "Dark Olive"],
  ["#FFE0BD", "Pale Peach"],
  ["#F1C27D", "Sand"],
  ["#E0AC69", "Caramel"],
  ["#C68642", "Bronze"],
  ["#8D5524", "Cocoa"],
  ["#5C3317", "Espresso"],
];

export function nameForHex(hex: string): string {
  let best = NAMED_COLORS[0][1];
  let bestDist = Infinity;
  const target = chroma(hex);
  for (const [h, n] of NAMED_COLORS) {
    const d = chroma.deltaE(target, chroma(h));
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

export function hexToRgbString(hex: string): string {
  const [r, g, b] = chroma(hex).rgb();
  return `${r}, ${g}, ${b}`;
}

export function readableTextOn(hex: string): string {
  return chroma(hex).luminance() > 0.5 ? "#1A1A1A" : "#FAF7F2";
}
