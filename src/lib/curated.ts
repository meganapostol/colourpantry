export interface CuratedPalette {
  id: string;
  name: string;
  hexes: string[];
  tags: string[];
}

export const MOOD_TAGS = [
  "warm",
  "cool",
  "earthy",
  "vibrant",
  "muted",
  "pastel",
  "retro",
  "modern",
  "moody",
  "fresh",
  "spring",
  "summer",
  "autumn",
  "winter",
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

/**
 * Hand-picked palettes — each one is a coherent design system, not a hue scrape.
 * Tags indicate primary mood/season/style.
 */
export const CURATED_PALETTES: CuratedPalette[] = [
  // Earthy / autumnal
  { id: "burnt-clay", name: "Burnt Clay", hexes: ["#3D2817", "#7A4226", "#C8714A", "#E8C39E", "#F2E5D0"], tags: ["earthy", "warm", "autumn", "muted"] },
  { id: "olive-grove", name: "Olive Grove", hexes: ["#2C2A1A", "#5C5731", "#8C8651", "#C2B884", "#EBE5C7"], tags: ["earthy", "muted", "autumn"] },
  { id: "harvest-moon", name: "Harvest Moon", hexes: ["#3A1E0E", "#8C4A1E", "#D9853B", "#EFC15A", "#F8E9C2"], tags: ["warm", "autumn", "vibrant"] },
  { id: "rust-belt", name: "Rust Belt", hexes: ["#1F1612", "#5E2B1B", "#A04A2C", "#D08157", "#EFE2D2"], tags: ["earthy", "warm", "moody", "autumn"] },
  { id: "forest-floor", name: "Forest Floor", hexes: ["#1A1F18", "#3D4A33", "#6E7A50", "#A8B086", "#E0DDC5"], tags: ["earthy", "cool", "muted", "autumn"] },
  { id: "terracotta", name: "Terracotta", hexes: ["#3F2017", "#94492A", "#D4825F", "#F1B895", "#FAEFE2"], tags: ["earthy", "warm", "muted"] },

  // Cool / oceanic
  { id: "deep-sea", name: "Deep Sea", hexes: ["#0A1F2E", "#194B66", "#3F88A3", "#90BFC9", "#E0EAEA"], tags: ["cool", "moody", "winter"] },
  { id: "glacier", name: "Glacier", hexes: ["#0E2733", "#284D5C", "#5A8A9A", "#A8CCD4", "#EAF2F2"], tags: ["cool", "fresh", "winter"] },
  { id: "lagoon", name: "Lagoon", hexes: ["#0F3D3E", "#2E7370", "#6BB0AA", "#B5DDD3", "#EEF6EE"], tags: ["cool", "fresh", "summer"] },
  { id: "midnight-blue", name: "Midnight Blue", hexes: ["#0A1429", "#1A2D52", "#3F5BA0", "#8FA5D4", "#E5EAF5"], tags: ["cool", "moody", "winter", "modern"] },
  { id: "arctic", name: "Arctic", hexes: ["#0A1B26", "#3D5A6E", "#7FA0B3", "#C5D7E0", "#F2F6F8"], tags: ["cool", "muted", "winter"] },
  { id: "tide-pool", name: "Tide Pool", hexes: ["#0E2F36", "#226670", "#56A8A8", "#A8D8CD", "#EAF4EE"], tags: ["cool", "fresh", "summer"] },

  // Warm / sunset
  { id: "desert-bloom", name: "Desert Bloom", hexes: ["#3A1818", "#963A30", "#E37E5A", "#F5BC8A", "#FAE6CB"], tags: ["warm", "vibrant", "summer"] },
  { id: "saffron", name: "Saffron", hexes: ["#3D1E0A", "#A14515", "#E08838", "#F3C26C", "#FAEAC2"], tags: ["warm", "vibrant", "autumn"] },
  { id: "blush-clay", name: "Blush Clay", hexes: ["#3A1F25", "#8C4A4F", "#D78785", "#F0BCB1", "#FBE7DC"], tags: ["warm", "pastel", "muted"] },
  { id: "sunset-strip", name: "Sunset Strip", hexes: ["#2D0E1A", "#7A2547", "#D54E5E", "#F09078", "#F7D4A6"], tags: ["warm", "vibrant", "retro"] },
  { id: "amber-glow", name: "Amber Glow", hexes: ["#2B1404", "#673616", "#C57437", "#EAB271", "#FAEAC0"], tags: ["warm", "muted", "autumn"] },
  { id: "tangerine", name: "Tangerine", hexes: ["#3F1A06", "#A03E14", "#E97132", "#F4A268", "#FBE3C5"], tags: ["warm", "vibrant"] },

  // Pastel
  { id: "macaron", name: "Macaron", hexes: ["#F5C5C8", "#FAD9B0", "#FAEDC1", "#C4E5C9", "#BFDDF0"], tags: ["pastel", "fresh", "spring"] },
  { id: "cotton-candy", name: "Cotton Candy", hexes: ["#FBD3E8", "#F4B5D8", "#E0B8E5", "#BFC9F2", "#B0E1EE"], tags: ["pastel", "spring"] },
  { id: "spring-meadow", name: "Spring Meadow", hexes: ["#F5F1D7", "#D8E5B8", "#A8D5B5", "#80C4C4", "#7FB0CE"], tags: ["pastel", "fresh", "spring"] },
  { id: "lavender-mist", name: "Lavender Mist", hexes: ["#EFE5F0", "#D6C5E0", "#B5A0CA", "#8B7FAE", "#5E5783"], tags: ["pastel", "muted", "spring"] },
  { id: "peach-fuzz", name: "Peach Fuzz", hexes: ["#FDE7D6", "#FBC9A4", "#F0A07A", "#D87856", "#A85638"], tags: ["pastel", "warm", "summer"] },
  { id: "mint-condition", name: "Mint Condition", hexes: ["#E8F2EA", "#BFE0CB", "#8AC7A8", "#5A9F8A", "#356B65"], tags: ["pastel", "fresh", "spring"] },

  // Vibrant / retro
  { id: "miami-vice", name: "Miami Vice", hexes: ["#0E162E", "#FF4F8B", "#5BC4E8", "#FBC55B", "#F2F2F2"], tags: ["vibrant", "retro", "summer", "modern"] },
  { id: "neon-jungle", name: "Neon Jungle", hexes: ["#0D1A0F", "#1F4D2A", "#52E078", "#FFD93D", "#FF5A6E"], tags: ["vibrant", "retro"] },
  { id: "70s-funk", name: "70s Funk", hexes: ["#3D1B12", "#A8421E", "#EFAE2C", "#5C7A33", "#3F5C73"], tags: ["retro", "warm", "muted", "autumn"] },
  { id: "candy-shop", name: "Candy Shop", hexes: ["#FF5470", "#FBC74A", "#5BC0BE", "#9D6DC4", "#2E2D4D"], tags: ["vibrant", "retro"] },
  { id: "bauhaus", name: "Bauhaus", hexes: ["#1A1A1A", "#E63946", "#F5C518", "#1D6BA8", "#F4F1EA"], tags: ["vibrant", "retro", "modern"] },
  { id: "synthwave", name: "Synthwave", hexes: ["#0F0524", "#3B0F4D", "#FF2E97", "#3FB6FF", "#FFE74C"], tags: ["vibrant", "retro", "moody"] },

  // Modern / minimal
  { id: "graphite", name: "Graphite", hexes: ["#0E0E0E", "#2C2C2C", "#666666", "#B5B5B5", "#F2F2F2"], tags: ["modern", "muted", "winter"] },
  { id: "noir-gold", name: "Noir & Gold", hexes: ["#0A0A0A", "#2D2A20", "#7A6440", "#C7A664", "#F0E5C8"], tags: ["modern", "moody", "warm"] },
  { id: "scandi", name: "Scandi", hexes: ["#FAF7F2", "#E5DED1", "#A89F8C", "#5A5547", "#1A1A1A"], tags: ["modern", "muted", "earthy"] },
  { id: "muji", name: "Muji", hexes: ["#F8F4EB", "#E0D8C5", "#BAB0A0", "#7A7468", "#2A2A2A"], tags: ["modern", "muted", "earthy"] },
  { id: "monochrome-ink", name: "Monochrome Ink", hexes: ["#000000", "#262626", "#5C5C5C", "#A6A6A6", "#FFFFFF"], tags: ["modern", "muted", "winter"] },
  { id: "off-white", name: "Off-White", hexes: ["#FAF7F2", "#E8E2D5", "#1A1A1A", "#D4A574", "#7A7468"], tags: ["modern", "muted"] },

  // Moody / dark
  { id: "wine-cellar", name: "Wine Cellar", hexes: ["#0F0508", "#3A0F18", "#7A1F2C", "#B8584A", "#E8C6A0"], tags: ["moody", "warm", "autumn"] },
  { id: "ink-well", name: "Ink Well", hexes: ["#0A0E1A", "#1F2740", "#3F4D70", "#8590B0", "#D5DCE5"], tags: ["moody", "cool", "modern", "winter"] },
  { id: "after-hours", name: "After Hours", hexes: ["#13121C", "#2A1F3D", "#5C2C68", "#C45A8C", "#FBC0CB"], tags: ["moody", "vibrant", "retro"] },
  { id: "obsidian", name: "Obsidian", hexes: ["#0A0A0E", "#1A1A24", "#2C2C40", "#525274", "#A0A0BE"], tags: ["moody", "cool", "modern"] },

  // Fresh / spring/summer
  { id: "key-lime", name: "Key Lime", hexes: ["#FAFCE8", "#E0F0A8", "#B5DA60", "#7BAE2C", "#3D6312"], tags: ["fresh", "vibrant", "spring", "summer"] },
  { id: "watermelon", name: "Watermelon", hexes: ["#FFF8F0", "#FBC1B0", "#F0746A", "#3FA56E", "#1F4F33"], tags: ["fresh", "vibrant", "summer"] },
  { id: "lemonade", name: "Lemonade", hexes: ["#FBF6E2", "#F4E294", "#F0B848", "#EE7C30", "#A83E1A"], tags: ["fresh", "warm", "summer"] },
  { id: "garden-party", name: "Garden Party", hexes: ["#F2F8E8", "#C5DCA0", "#7AB370", "#E07F90", "#A53D54"], tags: ["fresh", "vibrant", "spring"] },
  { id: "sea-salt", name: "Sea Salt", hexes: ["#F0F4F2", "#C8DCD4", "#8AB5AE", "#4D7E83", "#1F3940"], tags: ["fresh", "cool", "summer"] },
  { id: "citrus-burst", name: "Citrus Burst", hexes: ["#FBF8DC", "#F4D548", "#F09030", "#D14E2E", "#5C8A3A"], tags: ["fresh", "vibrant", "summer"] },

  // Winter
  { id: "frost-bite", name: "Frost Bite", hexes: ["#F8FAFB", "#D5E0E5", "#9AB5C2", "#5A7E92", "#1F3845"], tags: ["winter", "cool", "muted"] },
  { id: "pine-needle", name: "Pine Needle", hexes: ["#0A1810", "#1F3528", "#3D5C42", "#7A9577", "#D8E0CA"], tags: ["winter", "cool", "earthy"] },
  { id: "candle-light", name: "Candle Light", hexes: ["#0E0905", "#2D1F12", "#7A4F2A", "#D89A4E", "#F5DEAB"], tags: ["winter", "warm", "moody"] },
  { id: "snow-day", name: "Snow Day", hexes: ["#FBFCFD", "#E0E5EA", "#A0AAB5", "#5A6470", "#1F242C"], tags: ["winter", "cool", "muted", "modern"] },

  // Spring
  { id: "cherry-blossom", name: "Cherry Blossom", hexes: ["#FBE5E5", "#F4B8C5", "#E08AA8", "#7A8FBE", "#5C8554"], tags: ["spring", "pastel", "fresh"] },
  { id: "wisteria", name: "Wisteria", hexes: ["#F5F0F8", "#D5C0DC", "#A687BD", "#735794", "#3D2D5C"], tags: ["spring", "muted", "moody"] },
  { id: "wildflower", name: "Wildflower", hexes: ["#FBF8E8", "#F4D050", "#E07F90", "#9D6DC4", "#5C7A3A"], tags: ["spring", "vibrant", "fresh"] },

  // Summer
  { id: "popsicle", name: "Popsicle", hexes: ["#FBFAEF", "#FBE25A", "#F08AA0", "#5BC0BE", "#3D5A7A"], tags: ["summer", "vibrant", "retro"] },
  { id: "beach-towel", name: "Beach Towel", hexes: ["#F4D548", "#F08038", "#E04060", "#7AB5C2", "#FBF8E8"], tags: ["summer", "vibrant", "retro"] },
  { id: "linen-suit", name: "Linen Suit", hexes: ["#F5EFE0", "#E5D5B8", "#C2A57A", "#8A6E47", "#3D2D1A"], tags: ["summer", "earthy", "muted", "modern"] },

  // Earthy / muted neutrals
  { id: "sand-stone", name: "Sandstone", hexes: ["#3A2D1F", "#7A5E3A", "#C2A074", "#E5CBA0", "#F5E8CA"], tags: ["earthy", "warm", "muted"] },
  { id: "tobacco", name: "Tobacco", hexes: ["#1F1208", "#4D2F18", "#8A5A2F", "#C2925E", "#F0DDB5"], tags: ["earthy", "warm", "muted", "autumn"] },
  { id: "fog", name: "Fog", hexes: ["#1F2226", "#4D5358", "#8A9095", "#C0C5C9", "#F0F2F4"], tags: ["muted", "cool", "modern"] },
  { id: "kraft-paper", name: "Kraft Paper", hexes: ["#1F1812", "#5C4530", "#A88560", "#D8BC95", "#F4E8D0"], tags: ["earthy", "warm", "muted"] },
];

export function filterByTag(palettes: CuratedPalette[], tag: MoodTag | "all"): CuratedPalette[] {
  if (tag === "all") return palettes;
  return palettes.filter((p) => p.tags.includes(tag));
}
