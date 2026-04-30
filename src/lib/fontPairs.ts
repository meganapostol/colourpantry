export interface FontPair {
  id: string;
  name: string;
  category: "editorial" | "modern" | "playful" | "tech" | "classic" | "display";
  blurb: string;
  heading: { family: string; weight: number; italic?: boolean };
  body: { family: string; weight: number };
}

export const FONT_PAIRS: FontPair[] = [
  // Editorial
  {
    id: "playfair-source",
    name: "Editorial Bold",
    category: "editorial",
    blurb: "Refined serif headlines, neutral sans body.",
    heading: { family: "Playfair Display", weight: 700 },
    body: { family: "Source Sans 3", weight: 400 },
  },
  {
    id: "fraunces-inter",
    name: "Soft Editorial",
    category: "editorial",
    blurb: "Friendly modern serif with grotesque body.",
    heading: { family: "Fraunces", weight: 600 },
    body: { family: "Inter", weight: 400 },
  },
  {
    id: "cormorant-lato",
    name: "Magazine",
    category: "editorial",
    blurb: "Display serif drama, calm body copy.",
    heading: { family: "Cormorant Garamond", weight: 700 },
    body: { family: "Lato", weight: 400 },
  },

  // Modern
  {
    id: "inter-inter",
    name: "Inter Stack",
    category: "modern",
    blurb: "Reliable, neutral, ships everywhere.",
    heading: { family: "Inter", weight: 700 },
    body: { family: "Inter", weight: 400 },
  },
  {
    id: "manrope-manrope",
    name: "Manrope Stack",
    category: "modern",
    blurb: "Geometric and tight, app-friendly.",
    heading: { family: "Manrope", weight: 700 },
    body: { family: "Manrope", weight: 400 },
  },
  {
    id: "space-grotesk-ibm",
    name: "Mono-Sans Mix",
    category: "modern",
    blurb: "Mono headers, sans body — tech editorial.",
    heading: { family: "Space Grotesk", weight: 600 },
    body: { family: "IBM Plex Sans", weight: 400 },
  },
  {
    id: "outfit-rubik",
    name: "Rounded Modern",
    category: "modern",
    blurb: "Smooth caps, geometric body.",
    heading: { family: "Outfit", weight: 700 },
    body: { family: "Rubik", weight: 400 },
  },

  // Playful
  {
    id: "dm-serif-dm-sans",
    name: "DM Pair",
    category: "playful",
    blurb: "Display serif, minimalist sans.",
    heading: { family: "DM Serif Display", weight: 400 },
    body: { family: "DM Sans", weight: 400 },
  },
  {
    id: "fredoka-nunito",
    name: "Friendly Round",
    category: "playful",
    blurb: "Pillowy headings, soft sans body.",
    heading: { family: "Fredoka", weight: 600 },
    body: { family: "Nunito", weight: 400 },
  },
  {
    id: "caveat-quicksand",
    name: "Handwritten Hero",
    category: "playful",
    blurb: "Casual script with rounded sans.",
    heading: { family: "Caveat", weight: 700 },
    body: { family: "Quicksand", weight: 400 },
  },

  // Tech
  {
    id: "jetbrains-inter",
    name: "Dev Console",
    category: "tech",
    blurb: "Mono headlines, sans body — terminal vibe.",
    heading: { family: "JetBrains Mono", weight: 700 },
    body: { family: "Inter", weight: 400 },
  },
  {
    id: "ibm-plex-mono-plex-sans",
    name: "IBM Plex",
    category: "tech",
    blurb: "Industrial pair from IBM design.",
    heading: { family: "IBM Plex Mono", weight: 600 },
    body: { family: "IBM Plex Sans", weight: 400 },
  },

  // Classic
  {
    id: "merriweather-source",
    name: "Long-form Reader",
    category: "classic",
    blurb: "Newspaper serif, humanist sans.",
    heading: { family: "Merriweather", weight: 700 },
    body: { family: "Source Sans 3", weight: 400 },
  },
  {
    id: "lora-roboto",
    name: "Lora & Roboto",
    category: "classic",
    blurb: "Calligraphic serif with workhorse body.",
    heading: { family: "Lora", weight: 700 },
    body: { family: "Roboto", weight: 400 },
  },
  {
    id: "libre-baskerville-libre",
    name: "Libre Baskerville",
    category: "classic",
    blurb: "Old-style serif, both weights.",
    heading: { family: "Libre Baskerville", weight: 700 },
    body: { family: "Libre Baskerville", weight: 400 },
  },

  // Display
  {
    id: "abril-poppins",
    name: "Editorial Display",
    category: "display",
    blurb: "Big-impact serif over geometric sans.",
    heading: { family: "Abril Fatface", weight: 400 },
    body: { family: "Poppins", weight: 400 },
  },
  {
    id: "archivo-black-archivo",
    name: "Heavy Modern",
    category: "display",
    blurb: "Black sans hero, narrow body.",
    heading: { family: "Archivo Black", weight: 400 },
    body: { family: "Archivo", weight: 400 },
  },
  {
    id: "bebas-poppins",
    name: "Tall & Thin",
    category: "display",
    blurb: "Condensed caps with rounded body.",
    heading: { family: "Bebas Neue", weight: 400 },
    body: { family: "Poppins", weight: 400 },
  },
];

const LOADED_FAMILIES = new Set<string>();

function googleFontsUrl(families: Array<{ family: string; weight: number; italic?: boolean }>): string {
  const params = families.map((f) => {
    const fam = f.family.replace(/ /g, "+");
    return `family=${fam}:wght@${f.weight}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

export function loadFontPair(pair: FontPair) {
  const key = `${pair.heading.family}-${pair.heading.weight}|${pair.body.family}-${pair.body.weight}`;
  if (LOADED_FAMILIES.has(key)) return;
  LOADED_FAMILIES.add(key);

  const id = `font-pair-${pair.id}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = googleFontsUrl([pair.heading, pair.body]);
  document.head.appendChild(link);
}

export function fontStack(family: string): string {
  return `"${family}", ui-sans-serif, system-ui, sans-serif`;
}
