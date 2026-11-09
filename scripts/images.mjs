// Finds the smaller copies of photos ("renditions", see src/util.mjs) in the built site, so the pages can
// offer them with srcset. The width of each photo is read from its file header, without any dependencies.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { RENDITION_WIDTHS, renditionPath } from '../src/util.mjs';

/** Width in pixels of a WebP, JPEG, PNG or GIF image, or 0 when the header can't be read. */
export function imageWidth(b) {
  const ascii = (start, end) => b.toString('latin1', start, end);
  if (b.length < 30) return 0;
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
    if (chunk === 'VP8L') return 1 + (((b[22] & 0x3f) << 8) | b[21]);
    if (chunk === 'VP8X') return 1 + b.readUIntLE(24, 3);
    return 0;
  }
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return b.readUInt32BE(16);
  if (ascii(0, 4) === 'GIF8') return b.readUInt16LE(6);
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: walk the segments to the frame header (SOF0–SOF15, except DHT, JPG and DAC).
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return 0;
      const marker = b[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return b.readUInt16BE(i + 7);
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return 0;
}

const PHOTO = /\.(webp|jpe?g|png)$/i;
const RENDITION = /-\d+w\.[A-Za-z0-9]+$/;

/**
 * Every photo under dist/assets that has renditions next to it:
 * { "/assets/uploads/a.webp": [["/assets/uploads/a-480w.webp", 480], ["/assets/uploads/a.webp", 1200]] },
 * smallest first. The photo itself is the last candidate.
 */
export async function findRenditions(dist) {
  const files = new Set((await readdir(path.join(dist, 'assets'), { recursive: true })).map((f) => `/assets/${f.split(path.sep).join('/')}`));
  const sets = {};
  for (const file of files) {
    if (!PHOTO.test(file) || RENDITION.test(file)) continue;
    const smaller = RENDITION_WIDTHS.filter((w) => files.has(renditionPath(file, w)));
    if (!smaller.length) continue;
    const width = imageWidth(await readFile(path.join(dist, file)));
    if (!width) continue;
    sets[file] = [...smaller.filter((w) => w < width).map((w) => [renditionPath(file, w), w]), [file, width]];
  }
  return sets;
}
