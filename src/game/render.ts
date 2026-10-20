const SIZE = 144;
const WRONG_RED = "#E53935";
const WRONG_RED_DARK = "#7A1F1B";

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Darkens a color toward black, used for the "unlit" resting state of a pad. */
function dim(hex: string, factor = 0.32): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

function padWrap(fill: string, glow: boolean): string {
  const ring = glow
    ? `<rect x="3" y="3" width="${SIZE - 6}" height="${SIZE - 6}" rx="20" fill="none" stroke="#FFFFFF" stroke-width="5" opacity="0.85"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" rx="22" fill="${dim(fill, 0.22)}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${fill}"/>
    ${ring}
  </svg>`;
}

export function padIdleFrame(color: string): string {
  return toDataUri(padWrap(dim(color), false));
}

export function padLitFrame(color: string): string {
  return toDataUri(padWrap(color, true));
}

export function padWrongFrame(): string {
  const body = `<rect width="${SIZE}" height="${SIZE}" rx="22" fill="${WRONG_RED_DARK}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${WRONG_RED}"/>
    <line x1="48" y1="48" x2="96" y2="96" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
    <line x1="96" y1="48" x2="48" y2="96" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>`;
  return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`);
}

const FIREWORK_PALETTE = ["#FF5252", "#FFD740", "#69F0AE", "#40C4FF", "#E040FB"];

export function celebrationFrame(color: string, seed: number): string {
  let bursts = "";
  for (let i = 0; i < 4; i++) {
    const angle = ((seed * 41 + i * 97) % 360) * (Math.PI / 180);
    const cx = 72 + Math.cos(angle) * 40;
    const cy = 72 + Math.sin(angle) * 40;
    const r = 6 + ((seed + i * 13) % 12);
    const c = FIREWORK_PALETTE[(seed + i) % FIREWORK_PALETTE.length];
    bursts += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${c}" opacity="0.85"/>`;
  }
  return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" rx="22" fill="${dim(color, 0.22)}"/>
    <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="18" fill="${color}"/>
    ${bursts}
  </svg>`);
}
