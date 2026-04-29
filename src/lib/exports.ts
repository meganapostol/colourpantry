import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Stash } from "./db";
import { hexToRgbString, nameForHex, readableTextOn } from "./color";

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

function buildStashPoster(stash: Stash): HTMLElement {
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

  const title = document.createElement("div");
  title.style.fontSize = "32px";
  title.style.fontWeight = "500";
  title.style.letterSpacing = "-0.02em";
  title.style.marginBottom = "8px";
  title.textContent = stash.name || "Untitled Stash";

  const meta = document.createElement("div");
  meta.style.fontSize = "14px";
  meta.style.color = "#7A7468";
  meta.style.marginBottom = "32px";
  meta.textContent = `${stash.swatches.length} swatches · ${new Date(stash.updatedAt).toLocaleDateString()}`;

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(4, 1fr)";
  grid.style.gap = "8px";

  for (const s of stash.swatches) {
    const cell = document.createElement("div");
    cell.style.background = s.hex;
    cell.style.borderRadius = "6px";
    cell.style.padding = "16px";
    cell.style.aspectRatio = "1 / 1";
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.justifyContent = "flex-end";
    cell.style.color = readableTextOn(s.hex);

    const hexLabel = document.createElement("div");
    hexLabel.style.fontFamily = "ui-monospace, Consolas, monospace";
    hexLabel.style.fontSize = "16px";
    hexLabel.style.fontWeight = "600";
    hexLabel.textContent = s.hex.toUpperCase();

    const nameLabel = document.createElement("div");
    nameLabel.style.fontSize = "12px";
    nameLabel.style.opacity = "0.85";
    nameLabel.textContent = s.name || nameForHex(s.hex);

    cell.appendChild(hexLabel);
    cell.appendChild(nameLabel);
    grid.appendChild(cell);
  }

  const watermark = document.createElement("div");
  watermark.style.fontSize = "11px";
  watermark.style.color = "#9A9A9A";
  watermark.style.marginTop = "32px";
  watermark.style.textAlign = "right";
  watermark.textContent = "Made with Colour Pantry";

  wrap.appendChild(title);
  wrap.appendChild(meta);
  wrap.appendChild(grid);
  wrap.appendChild(watermark);
  return wrap;
}

export async function exportStashRaster(stash: Stash, format: RasterFormat) {
  if (stash.swatches.length === 0) return;
  const node = buildStashPoster(stash);
  document.body.appendChild(node);
  try {
    await rasterize(node, format, safeFilename(stash.name));
  } finally {
    document.body.removeChild(node);
  }
}

export const exportPNG = (stash: Stash) => exportStashRaster(stash, "png");
export const exportJPG = (stash: Stash) => exportStashRaster(stash, "jpg");

export function exportPDF(stash: Stash) {
  if (stash.swatches.length === 0) return;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text(stash.name || "Untitled Stash", W / 2, H / 2 - 20, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(new Date(stash.updatedAt).toLocaleDateString(), W / 2, H / 2 - 8, { align: "center" });
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(`${stash.swatches.length} swatches`, W / 2, H / 2, { align: "center" });
  pdf.setTextColor(160);
  pdf.text("Made with Colour Pantry", W / 2, H - 12, { align: "center" });

  const margin = 18;
  const cellW = (W - margin * 2 - 8) / 2;
  const cellH = (H - margin * 2 - 8) / 2;

  const positions: Array<[number, number]> = [
    [margin, margin],
    [margin + cellW + 8, margin],
    [margin, margin + cellH + 8],
    [margin + cellW + 8, margin + cellH + 8],
  ];

  stash.swatches.forEach((s, i) => {
    const slot = i % 4;
    if (slot === 0) pdf.addPage();
    const [x, y] = positions[slot];
    const rgb = s.hex.replace("#", "");
    const r = parseInt(rgb.slice(0, 2), 16);
    const g = parseInt(rgb.slice(2, 4), 16);
    const b = parseInt(rgb.slice(4, 6), 16);
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(x, y, cellW, cellH * 0.7, 2, 2, "F");

    pdf.setTextColor(40);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(s.hex.toUpperCase(), x, y + cellH * 0.78);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(110);
    pdf.text(s.name || nameForHex(s.hex), x, y + cellH * 0.85);
    pdf.text(`RGB ${hexToRgbString(s.hex)}`, x, y + cellH * 0.92);
  });

  pdf.save(`${safeFilename(stash.name)}.pdf`);
}

export function exportSVG(stash: Stash) {
  if (stash.swatches.length === 0) return;
  const cols = 4;
  const cell = 200;
  const gap = 8;
  const padding = 32;
  const titleH = 60;
  const rows = Math.ceil(stash.swatches.length / cols);
  const width = padding * 2 + cols * cell + (cols - 1) * gap;
  const height = padding * 2 + titleH + rows * (cell + 40) + (rows - 1) * gap;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect width="${width}" height="${height}" fill="#FAF7F2"/>`);
  parts.push(
    `<text x="${padding}" y="${padding + 28}" font-family="Jost, system-ui, sans-serif" font-size="28" font-weight="500" fill="#1A1A1A">${escapeXml(stash.name || "Untitled Stash")}</text>`,
  );
  parts.push(
    `<text x="${padding}" y="${padding + 50}" font-family="Jost, system-ui, sans-serif" font-size="12" fill="#7A7468">${stash.swatches.length} swatches</text>`,
  );

  stash.swatches.forEach((s, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = padding + c * (cell + gap);
    const y = padding + titleH + r * (cell + 40 + gap);
    parts.push(
      `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="6" fill="${s.hex}"/>`,
    );
    parts.push(
      `<text x="${x}" y="${y + cell + 22}" font-family="ui-monospace, Consolas, monospace" font-size="14" font-weight="600" fill="#1A1A1A">${s.hex.toUpperCase()}</text>`,
    );
    parts.push(
      `<text x="${x}" y="${y + cell + 36}" font-family="Jost, system-ui, sans-serif" font-size="11" fill="#7A7468">${escapeXml(s.name || nameForHex(s.hex))}</text>`,
    );
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
