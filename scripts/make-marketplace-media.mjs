import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const PHOTO = "C:/Users/kensc/Downloads/PXL_20261020_144752232.jpg";
const PLUGIN_ICON = "C:/users/kensc/OneDrive/Documents/GitHub/Stream Deck Simon Says/com.homedeck.simonsays.sdPlugin/imgs/plugin/plugin-icon@2x.png";
const OUT = "C:/Users/kensc/AppData/Local/Temp/claude/C--users-kensc-OneDrive-Documents-GitHub/c9391527-b74f-4f95-a256-95f796cb078e/scratchpad/marketplace-simonsays";

fs.mkdirSync(OUT, { recursive: true });

// --- Icon: 288x288 from the existing plugin icon ---
await sharp(PLUGIN_ICON).resize(288, 288).png().toFile(path.join(OUT, "icon-288.png"));

// --- Thumbnail + gallery 0: real device photo ---
await sharp(PHOTO).resize(1920, 960, { fit: "cover", position: "attention" }).jpeg({ quality: 90 }).toFile(path.join(OUT, "thumbnail-1920x960.jpg"));
await sharp(PHOTO).resize(1920, 960, { fit: "cover", position: "attention" }).jpeg({ quality: 92 }).toFile(path.join(OUT, "gallery-0-device-photo.jpg"));

// --- Reproduce the plugin's own key art (same code as src/game/render.ts) ---
const SIZE = 144;
const WRONG_RED = "#E53935";
const WRONG_RED_DARK = "#7A1F1B";

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function dim(hex, factor = 0.32) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}
function padWrap(fill, glow) {
  const ring = glow
    ? `<rect x="3" y="3" width="${SIZE - 6}" height="${SIZE - 6}" rx="20" fill="none" stroke="#FFFFFF" stroke-width="5" opacity="0.85"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" rx="22" fill="${dim(fill, 0.22)}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${fill}"/>
    ${ring}
  </svg>`;
}
function padIdleFrame(color) { return padWrap(dim(color), false); }
function padLitFrame(color) { return padWrap(color, true); }
function padWrongFrame() {
  const body = `<rect width="${SIZE}" height="${SIZE}" rx="22" fill="${WRONG_RED_DARK}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${WRONG_RED}"/>
    <line x1="48" y1="48" x2="96" y2="96" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
    <line x1="96" y1="48" x2="48" y2="96" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
}
const FIREWORK_PALETTE = ["#FF5252", "#FFD740", "#69F0AE", "#40C4FF", "#E040FB"];
function celebrationFrame(color, seed) {
  let bursts = "";
  for (let i = 0; i < 4; i++) {
    const angle = ((seed * 41 + i * 97) % 360) * (Math.PI / 180);
    const cx = 72 + Math.cos(angle) * 40;
    const cy = 72 + Math.sin(angle) * 40;
    const r = 6 + ((seed + i * 13) % 12);
    const c = FIREWORK_PALETTE[(seed + i) % FIREWORK_PALETTE.length];
    bursts += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${c}" opacity="0.85"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" rx="22" fill="${dim(color, 0.22)}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${color}"/>
    ${bursts}
  </svg>`;
}

const PALETTE = ["#E53935", "#1E88E5", "#43A047", "#FDD835", "#8E24AA", "#FB8C00", "#00ACC1", "#D81B60"];

// --- Gallery 1: board concept — mostly idle, one pad mid-flash ---
{
  const W = 1920, H = 960;
  const cols = 8, rows = 4, gap = 14, outerMargin = 50;
  const cellFromHeight = Math.floor((H - outerMargin * 2 - gap * (rows - 1)) / rows);
  const cellFromWidth = Math.floor((W - outerMargin * 2 - gap * (cols - 1)) / cols);
  const cell = Math.min(cellFromHeight, cellFromWidth);
  const contentW = cols * cell + (cols - 1) * gap;
  const contentH = rows * cell + (rows - 1) * gap;
  const padX = Math.round((W - contentW) / 2);
  const padY = Math.round((H - contentH) / 2);
  const litIndex = 13;
  const composites = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = PALETTE[i % PALETTE.length];
      const svg = i === litIndex ? padLitFrame(color) : padIdleFrame(color);
      composites.push({
        input: await sharp(Buffer.from(svg)).resize(cell, cell).png().toBuffer(),
        left: padX + c * (cell + gap),
        top: padY + r * (cell + gap),
      });
      i++;
    }
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#15171c" } })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT, "gallery-1-board-concept.jpg"));
}

// --- Gallery 2: all 8 pad colors, lit ---
{
  const W = 1920, H = 960;
  const cols = 8, rows = 1, gap = 30, outerMargin = 80;
  const cellFromHeight = H - outerMargin * 2;
  const cellFromWidth = Math.floor((W - outerMargin * 2 - gap * (cols - 1)) / cols);
  const cell = Math.min(cellFromHeight, cellFromWidth);
  const contentW = cols * cell + (cols - 1) * gap;
  const padX = Math.round((W - contentW) / 2);
  const padY = Math.round((H - cell) / 2);
  const composites = [];
  for (let c = 0; c < cols; c++) {
    const svg = padLitFrame(PALETTE[c]);
    composites.push({
      input: await sharp(Buffer.from(svg)).resize(cell, cell).png().toBuffer(),
      left: padX + c * (cell + gap),
      top: padY,
    });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#15171c" } })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT, "gallery-2-colors.jpg"));
}

// --- Gallery 3: sequence — idle, lit, correct press, wrong, celebration ---
{
  const W = 1920, H = 960;
  const color = PALETTE[2]; // green
  const frames = [padIdleFrame(color), padLitFrame(color), padIdleFrame(color), padWrongFrame(), celebrationFrame(color, 7)];
  const gap = 40, outerMargin = 60;
  const cellFromWidth = Math.floor((W - outerMargin * 2 - gap * (frames.length - 1)) / frames.length);
  const cellFromHeight = H - outerMargin * 2;
  const cell = Math.min(cellFromWidth, cellFromHeight);
  const contentW = frames.length * cell + (frames.length - 1) * gap;
  const padX = Math.round((W - contentW) / 2);
  const padY = Math.round((H - cell) / 2);
  const composites = [];
  for (let i = 0; i < frames.length; i++) {
    composites.push({
      input: await sharp(Buffer.from(frames[i])).resize(cell, cell).png().toBuffer(),
      left: padX + i * (cell + gap),
      top: padY,
    });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#15171c" } })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT, "gallery-3-sequence.jpg"));
}

console.log("Done:", fs.readdirSync(OUT));
