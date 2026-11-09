// PNG versions of the rainbow icon, for phones: iOS ignores SVG icons for "Add to Home Screen", and the web
// manifest wants 192 and 512 px PNGs. Draws the same four arcs as faviconSvg() in src/icons.mjs, anti-aliased,
// on the page background (home-screen icons must be opaque). Node only (uses zlib); no dependencies.

import { deflateSync } from 'node:zlib';

// Same geometry as faviconSvg(): half circles around (30, 31) in a 60-unit box, 5.5 wide with round ends.
const CENTER = [30, 31];
const HALF_WIDTH = 2.75;
const ARCS = [
  [26, 'coral'],
  [19, 'gold'],
  [12, 'sage'],
  [5, 'sky'],
];
// The artwork spans 60 units around (30, 18); this many icon widths keep it inside the round "maskable" safe zone.
const ART = 0.72;
const ART_CENTER_Y = 18;

// Theme colours are always #rrggbb (normalizeSettings checks them).
const rgb = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

// Distance from a point to the stroke's centre line: the upper half circle, or its nearest end below it.
function distance(x, y, r) {
  const [cx, cy] = CENTER;
  if (y <= cy) return Math.abs(Math.hypot(x - cx, y - cy) - r);
  return Math.min(Math.hypot(x - (cx - r), y - cy), Math.hypot(x - (cx + r), y - cy));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** The rainbow icon as an opaque size × size PNG, in the theme's colours. */
export function iconPng(colors, size) {
  const bg = rgb(colors.bg);
  const arcs = ARCS.map(([r, key]) => [r, rgb(colors[key])]);
  const unit = 60 / (size * ART); // artwork units per pixel
  const rows = Buffer.alloc(size * (1 + size * 3));
  for (let py = 0; py < size; py++) {
    const row = py * (1 + size * 3);
    rows[row] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const x = 30 + (px + 0.5 - size / 2) * unit;
      const y = ART_CENTER_Y + (py + 0.5 - size / 2) * unit;
      let color = bg;
      for (const [r, fg] of arcs) {
        // Coverage of a one-pixel-wide edge gives smooth anti-aliasing.
        const cover = Math.min(1, Math.max(0, (HALF_WIDTH - distance(x, y, r)) / unit + 0.5));
        if (cover > 0) color = color.map((c, i) => Math.round(c + (fg[i] - c) * cover));
      }
      const at = row + 1 + px * 3;
      rows[at] = color[0];
      rows[at + 1] = color[1];
      rows[at + 2] = color[2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Sizes written by the build: the iOS home-screen icon and the two the web manifest asks for. */
export const ICON_SIZES = [180, 192, 512];
