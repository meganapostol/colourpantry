import chroma from "chroma-js";

export type HarmonyRule =
  | "random"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic"
  | "monochromatic"
  | "shades";

export const HARMONY_RULES: Array<{ id: HarmonyRule; label: string; blurb: string }> = [
  { id: "random", label: "Random", blurb: "Across-the-wheel surprise" },
  { id: "analogous", label: "Analogous", blurb: "Neighbouring hues, harmonious" },
  { id: "complementary", label: "Complementary", blurb: "Opposite hues, high tension" },
  { id: "split-complementary", label: "Split", blurb: "Base + two near-opposites" },
  { id: "triadic", label: "Triadic", blurb: "Three hues, evenly spaced" },
  { id: "tetradic", label: "Tetradic", blurb: "Four hues, two pairs" },
  { id: "monochromatic", label: "Monochromatic", blurb: "Single hue, lightness sweep" },
  { id: "shades", label: "Shades", blurb: "Light to dark of one hue" },
];

function clampInGamut(L: number, C: number, H: number): string {
  let col = chroma.oklch(L, C, H);
  if (col.clipped()) {
    let cAdj = C;
    while (cAdj > 0 && col.clipped()) {
      cAdj -= 0.005;
      col = chroma.oklch(L, cAdj, H);
    }
  }
  return col.hex().toUpperCase();
}

function randomBase(): { L: number; C: number; H: number } {
  return {
    H: Math.random() * 360,
    L: 0.45 + Math.random() * 0.3,
    C: 0.08 + Math.random() * 0.15,
  };
}

function baseFromHex(hex: string): { L: number; C: number; H: number } {
  const [L, C, H] = chroma(hex).oklch();
  return {
    L: Number.isFinite(L) ? L : 0.55,
    C: Number.isFinite(C) ? C : 0.1,
    H: Number.isFinite(H) ? H : 0,
  };
}

export interface GenerateOptions {
  rule: HarmonyRule;
  count: number;
  baseHex?: string;
  /** Indexes of swatches that are locked (won't change) */
  locked?: boolean[];
  /** Existing swatches; locked indexes are kept */
  existing?: string[];
}

export function generatePalette(opts: GenerateOptions): string[] {
  const { rule, count } = opts;
  const base = opts.baseHex ? baseFromHex(opts.baseHex) : randomBase();

  const fresh: string[] = [];

  switch (rule) {
    case "random": {
      for (let i = 0; i < count; i++) {
        const r = randomBase();
        fresh.push(clampInGamut(r.L, r.C, r.H));
      }
      break;
    }
    case "analogous": {
      const span = 60;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const H = (base.H + span * t + 360) % 360;
        const L = base.L + (Math.random() - 0.5) * 0.18;
        const C = Math.max(0.02, base.C + (Math.random() - 0.4) * 0.06);
        fresh.push(clampInGamut(L, C, H));
      }
      break;
    }
    case "complementary": {
      const compH = (base.H + 180) % 360;
      for (let i = 0; i < count; i++) {
        const H = i % 2 === 0 ? base.H : compH;
        const L = 0.3 + (i / Math.max(1, count - 1)) * 0.55;
        const C = Math.max(0.02, base.C * (0.5 + Math.random() * 0.6));
        fresh.push(clampInGamut(L, C, H));
      }
      break;
    }
    case "split-complementary": {
      const hues = [base.H, (base.H + 150) % 360, (base.H + 210) % 360];
      for (let i = 0; i < count; i++) {
        const H = hues[i % 3];
        const L = 0.32 + ((i % 4) / 4) * 0.5;
        const C = Math.max(0.02, base.C * (0.55 + Math.random() * 0.55));
        fresh.push(clampInGamut(L, C, H));
      }
      break;
    }
    case "triadic": {
      const hues = [base.H, (base.H + 120) % 360, (base.H + 240) % 360];
      for (let i = 0; i < count; i++) {
        const H = hues[i % 3];
        const L = 0.35 + ((i % 4) / 4) * 0.45;
        const C = Math.max(0.02, base.C * (0.6 + Math.random() * 0.5));
        fresh.push(clampInGamut(L, C, H));
      }
      break;
    }
    case "tetradic": {
      const hues = [base.H, (base.H + 90) % 360, (base.H + 180) % 360, (base.H + 270) % 360];
      for (let i = 0; i < count; i++) {
        const H = hues[i % 4];
        const L = 0.35 + ((i % 4) / 4) * 0.4;
        const C = Math.max(0.02, base.C * (0.6 + Math.random() * 0.5));
        fresh.push(clampInGamut(L, C, H));
      }
      break;
    }
    case "monochromatic": {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const L = 0.18 + t * 0.74;
        const peak = 1 - Math.abs(t - 0.55) * 1.6;
        const C = Math.max(0.015, base.C * (0.35 + peak * 0.7));
        fresh.push(clampInGamut(L, C, base.H));
      }
      break;
    }
    case "shades": {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const L = 0.93 - t * 0.82;
        fresh.push(clampInGamut(L, base.C, base.H));
      }
      break;
    }
  }

  if (opts.existing && opts.locked) {
    return fresh.map((c, i) =>
      opts.locked![i] && opts.existing![i] ? opts.existing![i].toUpperCase() : c,
    );
  }
  return fresh;
}

export interface ColorVariations {
  tints: string[];
  shades: string[];
  tones: string[];
  hues: string[];
  saturations: string[];
}

export function generateVariations(hex: string, steps = 9): ColorVariations {
  const { L, C, H } = baseFromHex(hex);

  const tints: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    tints.push(clampInGamut(L + (0.97 - L) * t, C * (1 - t * 0.7), H));
  }

  const shades: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    shades.push(clampInGamut(L * (1 - t * 0.95), C * (1 - t * 0.25), H));
  }

  const tones: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    tones.push(clampInGamut(L, Math.max(0, C * (1 - t)), H));
  }

  const hues: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / Math.max(1, steps - 1) - 0.5;
    hues.push(clampInGamut(L, C, (H + t * 60 + 360) % 360));
  }

  const saturations: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    saturations.push(clampInGamut(L, t * 0.32, H));
  }

  return { tints, shades, tones, hues, saturations };
}
