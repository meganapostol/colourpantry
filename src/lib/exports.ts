import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Stash } from "./db";
import { nameForHex, readableTextOn } from "./color";

export type RasterFormat = "png" | "jpg";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "stash";
}

/**
 * Render a DOM node to a canvas at 2x for crisp output, then ship as PNG or JPG blob.
 */
async function rasterize(
  node: HTMLElement,
  format: RasterFormat,
  filename: string,
) {
  const canvas = await html2canvas(node, {
    backgroundColor: "#FAF7F2",
    scale: 2,
    useCORS: true,
  });
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  const ext = format === "jpg" ? "jpg" : "png";
  await new Promise<void>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, `${filename}.${ext}`);
        resolve();
      },
      mime,
      0.92,
    );
  });
}

async function buildStashPoster(
  stash: Stash,
  posterOptions: { customLogoDataUrl?: string } = {},
): Promise<HTMLElement> {
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.left = "-10000px";
  wrap.style.top = "0";
  wrap.style.width = "1080px";
  wrap.style.padding = "48px";
  wrap.style.background = "#FAF7F2";
  wrap.style.fontFamily = "Jost, ui-sans-serif, system-ui, sans-serif";
  wrap.style.color = "#1A1A1A";
  wrap.style.boxSizing = "border-box";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "flex-start";
  header.style.justifyContent = "space-between";
  header.style.gap = "24px";
  header.style.marginBottom = "32px";

  const headerText = document.createElement("div");
  headerText.style.minWidth = "0";

  const title = document.createElement("div");
  title.style.fontSize = "32px";
  title.style.fontWeight = "500";
  title.style.letterSpacing = "-0.02em";
  title.style.marginBottom = "8px";
  title.textContent = stash.name || "Untitled Stash";

  const meta = document.createElement("div");
  meta.style.fontSize = "14px";
  meta.style.color = "#7A7468";
  meta.textContent = `${stash.swatches.length} swatch${stash.swatches.length === 1 ? "" : "es"} · ${new Date(stash.updatedAt).toLocaleDateString()}`;

  headerText.appendChild(title);
  headerText.appendChild(meta);
  header.appendChild(headerText);

  if (posterOptions.customLogoDataUrl) {
    const logo = document.createElement("img");
    logo.src = posterOptions.customLogoDataUrl;
    logo.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      if (logo.complete && logo.naturalHeight !== 0) return resolve();
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
    // Compute dimensions explicitly from the natural aspect ratio so html2canvas
    // doesn't squish the logo. Fit within a 180x80 box without upscaling.
    const maxW = 180;
    const maxH = 80;
    const natW = logo.naturalWidth || 1;
    const natH = logo.naturalHeight || 1;
    const scale = Math.min(maxW / natW, maxH / natH, 1);
    const finalW = Math.max(1, Math.round(natW * scale));
    const finalH = Math.max(1, Math.round(natH * scale));
    logo.style.width = `${finalW}px`;
    logo.style.height = `${finalH}px`;
    logo.style.display = "block";
    logo.style.flexShrink = "0";
    header.appendChild(logo);
  }

  wrap.appendChild(header);

  // Polaroid for reference image (when present)
  if (stash.referenceImage) {
    // Load to get natural dimensions so the polaroid matches the photo's aspect
    // ratio — no cropping, no downsampling beyond rasterization scale.
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.src = stash.referenceImage;
    await new Promise<void>((resolve) => {
      if (probe.complete && probe.naturalHeight !== 0) return resolve();
      probe.onload = () => resolve();
      probe.onerror = () => resolve();
    });

    const natW = probe.naturalWidth || 800;
    const natH = probe.naturalHeight || 600;
    // Poster inner width is 1080 - 96 padding = 984. Cap both axes at 880 and
    // don't upscale tiny images beyond their natural size.
    const MAX_DIM = 880;
    let innerW = Math.min(MAX_DIM, natW);
    let innerH = Math.round(innerW * (natH / natW));
    if (innerH > MAX_DIM) {
      innerH = Math.min(MAX_DIM, natH);
      innerW = Math.round(innerH * (natW / natH));
    }

    const polaroidWrap = document.createElement("div");
    polaroidWrap.style.display = "flex";
    polaroidWrap.style.justifyContent = "center";
    polaroidWrap.style.marginBottom = "36px";

    const polaroid = document.createElement("div");
    polaroid.style.background = "#FFFFFF";
    polaroid.style.padding = "20px 20px 64px 20px";
    polaroid.style.boxShadow =
      "0 2px 8px rgba(20, 14, 0, 0.06), 0 12px 32px rgba(20, 14, 0, 0.10)";
    polaroid.style.borderRadius = "2px";
    polaroid.style.position = "relative";
    polaroid.style.boxSizing = "content-box";
    polaroid.style.width = `${innerW}px`;

    const img = document.createElement("img");
    img.src = stash.referenceImage;
    img.crossOrigin = "anonymous";
    img.style.width = `${innerW}px`;
    img.style.height = `${innerH}px`;
    img.style.display = "block";
    img.style.background = "#f3efe6";
    // No object-fit — width/height match the natural aspect, so nothing is cropped.

    await new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight !== 0) return resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    polaroid.appendChild(img);

    const caption = document.createElement("div");
    caption.style.position = "absolute";
    caption.style.bottom = "20px";
    caption.style.left = "20px";
    caption.style.right = "20px";
    caption.style.textAlign = "center";
    caption.style.fontSize = "16px";
    caption.style.color = "#7A7468";
    caption.style.fontStyle = "italic";
    caption.style.fontFamily = "Jost, ui-sans-serif, system-ui, sans-serif";
    caption.textContent = stash.name || "Untitled Stash";
    polaroid.appendChild(caption);

    polaroidWrap.appendChild(polaroid);
    wrap.appendChild(polaroidWrap);
  }

  const count = stash.swatches.length;
  // Multi-row grid keeps cells wide enough that hex codes and names don't
  // collide with each other. Cap at ~10 columns per row, then wrap.
  const maxCols = 10;
  const rows = Math.max(1, Math.ceil(count / maxCols));
  const cols = Math.max(1, Math.ceil(count / rows));
  const showName = count <= 30;
  const hexSize = cols <= 6 ? 16 : cols <= 8 ? 14 : 13;
  const nameSize = cols <= 6 ? 12 : 11;
  const cellPad = cols <= 6 ? "14px" : "10px";
  const rowHeight = showName ? 130 : 90;

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  grid.style.gridAutoRows = `${rowHeight}px`;
  grid.style.gap = "6px";

  for (const s of stash.swatches) {
    const cell = document.createElement("div");
    cell.style.background = s.hex;
    cell.style.borderRadius = "6px";
    cell.style.padding = cellPad;
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.justifyContent = "flex-end";
    cell.style.color = readableTextOn(s.hex);
    cell.style.minWidth = "0";
    cell.style.overflow = "hidden";

    const hexLabel = document.createElement("div");
    hexLabel.style.fontFamily = "ui-monospace, Consolas, monospace";
    hexLabel.style.fontSize = `${hexSize}px`;
    hexLabel.style.fontWeight = "600";
    hexLabel.style.letterSpacing = "-0.01em";
    hexLabel.style.lineHeight = "1.1";
    hexLabel.textContent = s.hex.toUpperCase();
    cell.appendChild(hexLabel);

    if (showName) {
      const nameLabel = document.createElement("div");
      nameLabel.style.fontSize = `${nameSize}px`;
      nameLabel.style.opacity = "0.85";
      nameLabel.style.marginTop = "3px";
      nameLabel.style.lineHeight = "1.2";
      nameLabel.style.wordBreak = "break-word";
      nameLabel.textContent = s.name || nameForHex(s.hex);
      cell.appendChild(nameLabel);
    }

    grid.appendChild(cell);
  }

  const watermark = document.createElement("div");
  watermark.style.fontSize = "11px";
  watermark.style.color = "#9A9A9A";
  watermark.style.marginTop = "32px";
  watermark.style.textAlign = "right";
  watermark.textContent = "Made with Colour Pantry";

  wrap.appendChild(grid);
  wrap.appendChild(watermark);
  return wrap;
}

export async function exportStashRaster(stash: Stash, format: RasterFormat) {
  if (stash.swatches.length === 0) return;
  const node = await buildStashPoster(stash);
  document.body.appendChild(node);
  try {
    await rasterize(node, format, safeFilename(stash.name));
  } finally {
    document.body.removeChild(node);
  }
}

export const exportPNG = (stash: Stash) => exportStashRaster(stash, "png");
export const exportJPG = (stash: Stash) => exportStashRaster(stash, "jpg");

export interface PDFOptions {
  customLogoDataUrl?: string;
}

export async function exportPDF(stash: Stash, options: PDFOptions = {}) {
  if (stash.swatches.length === 0) return;
  const node = await buildStashPoster(stash, {
    customLogoDataUrl: options.customLogoDataUrl,
  });
  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, {
      backgroundColor: "#FAF7F2",
      scale: 2,
      useCORS: true,
    });
    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const orientation = w > h ? "landscape" : "portrait";
    const pdf = new jsPDF({ unit: "px", format: [w, h], orientation });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
    pdf.save(`${safeFilename(stash.name)}.pdf`);
  } finally {
    document.body.removeChild(node);
  }
}

export function exportSVG(stash: Stash) {
  if (stash.swatches.length === 0) return;
  const count = stash.swatches.length;
  const padding = 40;
  const titleH = 70;
  const gap = 6;
  const stripH = count <= 14 ? 220 : count <= 22 ? 180 : 140;
  const stripW = Math.max(960, count * 96);
  const cellW = (stripW - (count - 1) * gap) / count;
  const width = padding * 2 + stripW;
  const height = padding * 2 + titleH + stripH;
  const showName = count <= 12;
  const hexSize = count <= 14 ? 16 : count <= 22 ? 13 : 11;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect width="${width}" height="${height}" fill="#FAF7F2"/>`);
  parts.push(
    `<text x="${padding}" y="${padding + 30}" font-family="Jost, system-ui, sans-serif" font-size="32" font-weight="500" letter-spacing="-0.02em" fill="#1A1A1A">${escapeXml(stash.name || "Untitled Stash")}</text>`,
  );
  parts.push(
    `<text x="${padding}" y="${padding + 54}" font-family="Jost, system-ui, sans-serif" font-size="13" fill="#7A7468">${count} swatch${count === 1 ? "" : "es"}</text>`,
  );

  const stripY = padding + titleH;
  stash.swatches.forEach((s, i) => {
    const x = padding + i * (cellW + gap);
    parts.push(
      `<rect x="${x}" y="${stripY}" width="${cellW}" height="${stripH}" rx="6" fill="${s.hex}"/>`,
    );
    const ink = readableTextOn(s.hex);
    const labelPad = count <= 14 ? 14 : 10;
    parts.push(
      `<text x="${x + labelPad}" y="${stripY + stripH - (showName ? 26 : 12)}" font-family="ui-monospace, Consolas, monospace" font-size="${hexSize}" font-weight="600" fill="${ink}">${s.hex.toUpperCase()}</text>`,
    );
    if (showName) {
      parts.push(
        `<text x="${x + labelPad}" y="${stripY + stripH - 12}" font-family="Jost, system-ui, sans-serif" font-size="11" fill="${ink}" fill-opacity="0.85">${escapeXml(s.name || nameForHex(s.hex))}</text>`,
      );
    }
  });

  parts.push(`</svg>`);
  const blob = new Blob([parts.join("\n")], { type: "image/svg+xml" });
  downloadBlob(blob, `${safeFilename(stash.name)}.svg`);
}

/* -------------------- Extract page composition export -------------------- */

async function buildExtractComposition(
  imgUrl: string,
  hexes: string[],
): Promise<HTMLElement> {
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.left = "-10000px";
  wrap.style.top = "0";
  wrap.style.width = "1200px";
  wrap.style.background = "#FAF7F2";
  wrap.style.fontFamily = "Jost, ui-sans-serif, system-ui, sans-serif";
  wrap.style.boxSizing = "border-box";
  wrap.style.borderRadius = "12px";
  wrap.style.overflow = "hidden";
  wrap.style.border = "1px solid #E8E2D5";

  const imgWrap = document.createElement("div");
  imgWrap.style.width = "100%";
  imgWrap.style.height = "720px";
  imgWrap.style.background = "#f3efe6";
  imgWrap.style.display = "flex";
  imgWrap.style.alignItems = "center";
  imgWrap.style.justifyContent = "center";
  imgWrap.style.overflow = "hidden";

  const img = document.createElement("img");
  img.src = imgUrl;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.objectFit = "contain";
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve) => {
    if (img.complete && img.naturalHeight !== 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  imgWrap.appendChild(img);

  const strip = document.createElement("div");
  strip.style.display = "grid";
  strip.style.gridTemplateColumns = `repeat(${hexes.length}, 1fr)`;
  strip.style.height = "140px";

  for (const hex of hexes) {
    const cell = document.createElement("div");
    cell.style.background = hex;
    cell.style.padding = "16px";
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.justifyContent = "flex-end";
    cell.style.color = readableTextOn(hex);
    cell.style.minWidth = "0";

    const hexLabel = document.createElement("div");
    hexLabel.style.fontFamily = "ui-monospace, Consolas, monospace";
    hexLabel.style.fontSize = "14px";
    hexLabel.style.fontWeight = "600";
    hexLabel.style.letterSpacing = "-0.01em";
    hexLabel.textContent = hex.toUpperCase();

    const nameLabel = document.createElement("div");
    nameLabel.style.fontSize = "11px";
    nameLabel.style.opacity = "0.85";
    nameLabel.style.marginTop = "4px";
    nameLabel.textContent = nameForHex(hex);

    cell.appendChild(hexLabel);
    cell.appendChild(nameLabel);
    strip.appendChild(cell);
  }

  wrap.appendChild(imgWrap);
  wrap.appendChild(strip);
  return wrap;
}

export async function exportExtractRaster(
  imgUrl: string,
  hexes: string[],
  format: RasterFormat,
) {
  if (!imgUrl || hexes.length === 0) return;
  const node = await buildExtractComposition(imgUrl, hexes);
  document.body.appendChild(node);
  try {
    await rasterize(node, format, "extract");
  } finally {
    document.body.removeChild(node);
  }
}

export async function exportExtractPDF(imgUrl: string, hexes: string[]) {
  if (!imgUrl || hexes.length === 0) return;
  const node = await buildExtractComposition(imgUrl, hexes);
  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, {
      backgroundColor: "#FAF7F2",
      scale: 2,
      useCORS: true,
    });
    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const orientation = w > h ? "landscape" : "portrait";
    const pdf = new jsPDF({ unit: "px", format: [w, h], orientation });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
    pdf.save("extract.pdf");
  } finally {
    document.body.removeChild(node);
  }
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}
