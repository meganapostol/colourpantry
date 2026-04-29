# Colour Pantry

Every hex code, in cubes, in your browser. Free.

A no-account color tool where every shade is a discrete clickable swatch. Stock your own pantry of palettes, organize by project, export as PNG, PDF, or SVG. Includes the most comprehensive free skin-tone reference online.

## Features

- **Home** — 24 hue families, each a 15° slice of the sRGB hue wheel.
- **Family deep-dive** — virtualized waffle of every in-gamut shade in a family, with a chroma slider to walk through saturation levels.
- **Skin tones** — 9 undertone rows × 12 depth steps, hand-calibrated in OKLCH. Expand any row for the full neighborhood waffle.
- **Image extract** — drop an image, get its dominant palette.
- **Bibles** — save palettes into folders (Personal / Client / Commission / Fun). Auto-saves to IndexedDB.
- **Exports** — PNG poster, A4 PDF, and clean SVG.
- **Theme** — light by default, with a dark toggle that persists.

No accounts, no payment, no backend. Everything is client-side.

## Tech

- Vite + React 19 + TypeScript
- Tailwind CSS (class-based dark mode)
- React Router
- chroma-js (OKLCH color math)
- react-window (virtualized waffle grids)
- idb (IndexedDB wrapper)
- colorthief (image palette extraction)
- html2canvas + jsPDF (exports)

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Deployed automatically to Vercel on push to `main`.
