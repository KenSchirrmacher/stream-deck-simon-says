/**
 * Generates PNG icons for the Simon Says plugin (plugin, category, and action icons).
 * Run: node scripts/generate-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "com.homedeck.simonsays.sdPlugin", "imgs");

// All icon bodies below are authored on a fixed 72x72 design grid. Rendering with
// width/height = target size but viewBox always "0 0 72 72" lets SVG scale every
// coordinate (not just stroke-width) proportionally, so artwork fills the canvas
// at any requested size instead of staying pinned to its original 72px position.
const GRID = 72;

function svgIcon(body, size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${GRID} ${GRID}">
  <rect width="${GRID}" height="${GRID}" rx="${GRID * 0.18}" fill="#101014"/>
  ${body}
</svg>`);
}

async function writeIcon(dir, name, body, sizes = [72, 144]) {
  const folder = path.join(root, dir);
  fs.mkdirSync(folder, { recursive: true });
  for (const [index, size] of sizes.entries()) {
    const svg = svgIcon(body, size);
    const out = path.join(folder, `${name}${index === 1 ? "@2x" : ""}.png`);
    await sharp(svg).png().toFile(out);
  }
}

// Classic four-quadrant Simon look: a ring split into red / blue / green / yellow wedges.
const pluginBody = `
  <path d="M36 36 L36 10 A26 26 0 0 1 60.5 27 Z" fill="#E53935"/>
  <path d="M36 36 L60.5 27 A26 26 0 0 1 51.8 58.6 Z" fill="#FDD835"/>
  <path d="M36 36 L51.8 58.6 A26 26 0 0 1 20.2 58.6 Z" fill="#43A047"/>
  <path d="M36 36 L20.2 58.6 A26 26 0 0 1 36 10 Z" fill="#1E88E5"/>
  <circle cx="36" cy="36" r="10" fill="#101014"/>`;

const categoryBody = `
  <circle cx="36" cy="36" r="20" fill="none" stroke="#FFFFFF" stroke-width="4"/>
  <text x="36" y="42" fill="#FFFFFF" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" text-anchor="middle">S</text>`;

const padActionBody = `
  <rect x="12" y="12" width="48" height="48" rx="12" fill="#232661"/>
  <rect x="18" y="18" width="36" height="36" rx="9" fill="#3949AB"/>
  <rect x="21" y="21" width="30" height="30" rx="7" fill="none" stroke="#ECEFF1" stroke-width="2.5" opacity="0.6"/>`;

await writeIcon("plugin", "plugin-icon", pluginBody, [256, 512]);
await writeIcon("plugin", "category-icon", categoryBody, [28, 56]);
await writeIcon("actions/pad", "icon", padActionBody);

console.log("Icons generated in com.homedeck.simonsays.sdPlugin/imgs/");
