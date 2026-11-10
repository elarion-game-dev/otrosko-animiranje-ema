// Visual theme: self-hosted fonts, colour presets, the generated theme.css and a WCAG contrast checker.
// Fonts are served from this site (no Google Fonts request), so visitors' IP addresses are not sent to a font CDN.
// Every font here has the full Slovenian and Croatian alphabet (č š ž ć đ). For Serbian Cyrillic each font has a
// Cyrillic file (`cyr`): its own where the family has one, otherwise a similar family (Prata for DM Serif Display,
// Lora for Fraunces, Nunito for the rounded ones, Caveat for handwriting). Browsers only download it for Cyrillic text.
//
// The page design ("Vabilo", an invitation suite) lives in site.css. The theme only supplies its colours and
// fonts as CSS variables, plus colours derived from them that must stay readable (tints, darker "ink" shades,
// form borders), so any colour the owner picks keeps the page accessible.

import { isHexColor } from './util.mjs';

export const FONTS = {
  'dm-serif': {
    label: 'DM Serif Display (elegantna serifna)',
    family: 'DM Serif Display',
    fallback: "Georgia, 'Times New Roman', serif",
    faces: [
      { weight: '400', latin: 'dm-serif-display-latin-400-normal.woff2', ext: 'dm-serif-display-latin-ext-400-normal.woff2', cyr: 'prata-cyrillic-400-normal.woff2' },
      { weight: '400', style: 'italic', latin: 'dm-serif-display-latin-400-italic.woff2', ext: 'dm-serif-display-latin-ext-400-italic.woff2', cyr: 'prata-cyrillic-400-normal.woff2' },
    ],
    heading: { weight: 400, tracking: '0', scale: 1 },
  },
  'nunito-sans': {
    label: 'Nunito Sans (čista, prijazna)',
    family: 'Nunito Sans Variable',
    fallback: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    faces: [{ weight: '200 1000', latin: 'nunito-sans-latin-wght-normal.woff2', ext: 'nunito-sans-latin-ext-wght-normal.woff2', cyr: 'nunito-sans-cyrillic-wght-normal.woff2' }],
    heading: { weight: 800, tracking: '-0.01em', scale: 0.9 },
  },
  caveat: {
    label: 'Caveat (ročna pisava)',
    family: 'Caveat',
    fallback: "'Segoe Print', 'Bradley Hand', cursive",
    faces: [{ weight: '700', latin: 'caveat-latin-700-normal.woff2', ext: 'caveat-latin-ext-700-normal.woff2', cyr: 'caveat-cyrillic-700-normal.woff2' }],
    heading: { weight: 700, tracking: '0', scale: 1.15 },
  },
  fraunces: {
    label: 'Fraunces (mehka serifna)',
    family: 'Fraunces Variable',
    fallback: 'Georgia, serif',
    faces: [{ weight: '100 900', latin: 'fraunces-latin-wght-normal.woff2', ext: 'fraunces-latin-ext-wght-normal.woff2', cyr: 'lora-cyrillic-wght-normal.woff2' }],
    heading: { weight: 560, tracking: '-0.01em', scale: 0.95 },
  },
  baloo: {
    label: 'Baloo 2 (okrogla, igriva)',
    family: 'Baloo 2 Variable',
    fallback: '"Arial Rounded MT Bold", system-ui, sans-serif',
    faces: [{ weight: '400 800', latin: 'baloo-2-latin-wght-normal.woff2', ext: 'baloo-2-latin-ext-wght-normal.woff2', cyr: 'nunito-cyrillic-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '0', scale: 0.95 },
  },
  grandstander: {
    label: 'Grandstander (otroško živahna)',
    family: 'Grandstander Variable',
    fallback: '"Comic Sans MS", system-ui, sans-serif',
    faces: [{ weight: '100 900', latin: 'grandstander-latin-wght-normal.woff2', ext: 'grandstander-latin-ext-wght-normal.woff2', cyr: 'nunito-cyrillic-wght-normal.woff2' }],
    heading: { weight: 800, tracking: '-0.01em', scale: 0.85 },
  },
  comfortaa: {
    label: 'Comfortaa (mehka, zaobljena)',
    family: 'Comfortaa Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '300 700', latin: 'comfortaa-latin-wght-normal.woff2', ext: 'comfortaa-latin-ext-wght-normal.woff2', cyr: 'comfortaa-cyrillic-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '-0.01em', scale: 0.85 },
  },
  quicksand: {
    label: 'Quicksand (lahkotna)',
    family: 'Quicksand Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '300 700', latin: 'quicksand-latin-wght-normal.woff2', ext: 'quicksand-latin-ext-wght-normal.woff2', cyr: 'comfortaa-cyrillic-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '-0.01em', scale: 0.9 },
  },
  'patrick-hand': {
    label: 'Patrick Hand (ročna pisava)',
    family: 'Patrick Hand',
    fallback: '"Comic Sans MS", cursive',
    faces: [{ weight: '400', latin: 'patrick-hand-latin-400-normal.woff2', ext: 'patrick-hand-latin-ext-400-normal.woff2', cyr: 'caveat-cyrillic-700-normal.woff2' }],
    heading: { weight: 400, tracking: '0.01em', scale: 1.05 },
  },
  nunito: {
    label: 'Nunito (zaobljena, berljiva)',
    family: 'Nunito Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '200 1000', latin: 'nunito-latin-wght-normal.woff2', ext: 'nunito-latin-ext-wght-normal.woff2', cyr: 'nunito-cyrillic-wght-normal.woff2' }],
    heading: { weight: 800, tracking: '-0.01em', scale: 0.9 },
  },
  atkinson: {
    label: 'Atkinson Hyperlegible (najbolj berljiva)',
    family: 'Atkinson Hyperlegible',
    fallback: 'system-ui, sans-serif',
    faces: [
      { weight: '400', latin: 'atkinson-hyperlegible-latin-400-normal.woff2', ext: 'atkinson-hyperlegible-latin-ext-400-normal.woff2', cyr: 'nunito-sans-cyrillic-wght-normal.woff2' },
      { weight: '700', latin: 'atkinson-hyperlegible-latin-700-normal.woff2', ext: 'atkinson-hyperlegible-latin-ext-700-normal.woff2', cyr: 'nunito-sans-cyrillic-wght-normal.woff2' },
    ],
    heading: { weight: 700, tracking: '-0.01em', scale: 0.9 },
  },
  jost: {
    label: 'Jost (geometrijska)',
    family: 'Jost Variable',
    fallback: 'Futura, "Trebuchet MS", system-ui, sans-serif',
    faces: [{ weight: '100 900', latin: 'jost-latin-wght-normal.woff2', ext: 'jost-latin-ext-wght-normal.woff2', cyr: 'jost-cyrillic-wght-normal.woff2' }],
    heading: { weight: 600, tracking: '0', scale: 0.95 },
  },
  inter: {
    label: 'Inter (čista, sodobna)',
    family: 'Inter Variable',
    fallback: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    faces: [{ weight: '100 900', latin: 'inter-latin-wght-normal.woff2', ext: 'inter-latin-ext-wght-normal.woff2', cyr: 'inter-cyrillic-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '-0.02em', scale: 0.9 },
  },
  system: {
    label: 'Sistemska pisava (brez prenosa)',
    family: '',
    fallback: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    faces: [],
    heading: { weight: 750, tracking: '-0.01em', scale: 0.9 },
  },
};

export const FONT_IDS = Object.keys(FONTS);

/** Handwriting for photo captions and the signature. Always the same font, so the design keeps its voice. */
export const HAND_FONT = 'caveat';

const UNICODE_LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const UNICODE_CYRILLIC = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const UNICODE_LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const COLOR_KEYS = [
  ['bg', 'Ozadje strani (papir)'],
  ['alt', 'Ozadje pasov (krem)'],
  ['surface', 'Kartice in vabilo'],
  ['border', 'Črte in obrobe'],
  ['text', 'Besedilo (in noga strani)'],
  ['muted', 'Manj pomembno besedilo'],
  ['accent', 'Glavna barva (gumbi, poudarki)'],
  ['onAccent', 'Besedilo na gumbih'],
  ['coral', 'Mavrica 1 (koralna)'],
  ['gold', 'Mavrica 2 (zlata)'],
  ['sage', 'Mavrica 3 (zelena)'],
  ['sky', 'Mavrica 4 (modra)'],
  ['lilac', 'Mavrica 5 (lila)'],
];

/** The five soft colours of the rainbow: logo arcs, bunting, confetti, card tops and icon circles. */
export const RAINBOW = ['coral', 'gold', 'sage', 'sky', 'lilac'];

// Each preset sets the colours plus these theme keys.
export const PRESET_KEYS = ['headingFont', 'bodyFont'];

const RAINBOW_DEFAULT = { coral: '#e39a86', gold: '#ebc66f', sage: '#9cc29a', sky: '#8fb0d6', lilac: '#b9a3d6' };

export const PRESETS = {
  vabilo: {
    label: 'Vabilo',
    colors: { bg: '#fffcf7', alt: '#f8f0e3', surface: '#ffffff', border: '#e4d8c4', text: '#2c2a3a', muted: '#625c70', accent: '#3f5a8a', onAccent: '#ffffff', ...RAINBOW_DEFAULT },
    headingFont: 'dm-serif',
    bodyFont: 'nunito-sans',
  },
  malina: {
    label: 'Malinovo vabilo',
    colors: { bg: '#fffaf8', alt: '#fbefea', surface: '#ffffff', border: '#eed9d1', text: '#33242c', muted: '#6b5560', accent: '#a3365e', onAccent: '#ffffff', coral: '#ec9a8f', gold: '#efc86f', sage: '#a7c79a', sky: '#9ab8db', lilac: '#c7a3d3' },
    headingFont: 'fraunces',
    bodyFont: 'nunito-sans',
  },
  gozd: {
    label: 'Gozdno vabilo',
    colors: { bg: '#fbfcf6', alt: '#eef2e1', surface: '#ffffff', border: '#d8dfc6', text: '#25302a', muted: '#56604f', accent: '#2f6b4f', onAccent: '#ffffff', coral: '#e3a083', gold: '#e6c66a', sage: '#94c08e', sky: '#8fb6cf', lilac: '#b4a6d4' },
    headingFont: 'dm-serif',
    bodyFont: 'nunito-sans',
  },
  morje: {
    label: 'Morsko vabilo',
    colors: { bg: '#f8fbfc', alt: '#e7f1f3', surface: '#ffffff', border: '#cfe0e4', text: '#1f2f38', muted: '#4f616b', accent: '#1f6a7a', onAccent: '#ffffff', coral: '#ea9b85', gold: '#ecc66e', sage: '#93c4a2', sky: '#86b7d8', lilac: '#b2a3d8' },
    headingFont: 'dm-serif',
    bodyFont: 'nunito-sans',
  },
  igriva: {
    label: 'Igrivo vabilo',
    colors: { bg: '#fffdf5', alt: '#fff3d6', surface: '#ffffff', border: '#efdcb0', text: '#2b2340', muted: '#5f5672', accent: '#c2410c', onAccent: '#ffffff', coral: '#f29a8a', gold: '#f5c84c', sage: '#8fcb8c', sky: '#7fb3e6', lilac: '#bf9ee6' },
    headingFont: 'baloo',
    bodyFont: 'nunito',
  },
  noc: {
    label: 'Večerno vabilo (temno)',
    colors: { bg: '#1e2032', alt: '#262941', surface: '#2d3050', border: '#474b70', text: '#f4efe6', muted: '#c6c0d4', accent: '#ebc66f', onAccent: '#2c2a3a', ...RAINBOW_DEFAULT },
    headingFont: 'dm-serif',
    bodyFont: 'nunito-sans',
  },
};

/** Switches for the design's decorations. */
export const DECOR_TOGGLES = {
  garland: 'Zastavice na vrhu strani',
  confetti: 'Konfeti pikice ob fotografiji na vrhu in za obrazcem',
  scallops: 'Valoviti robovi kremnih pasov',
};

// --- text styles ------------------------------------------------------------
// Per-text overrides on top of the theme. site.css multiplies each role's font size by --k.

export const TEXT_ROLES = {
  heroTitle: { label: 'Glavni naslov na vabilu', selector: '.hero-title' },
  sectionTitles: { label: 'Naslovi razdelkov', selector: '.section-title' },
  cardTitles: { label: 'Naslovi kartic (paketi, ponudba …)', selector: '.card-title' },
  menu: { label: 'Povezave v meniju', selector: '.nav-link' },
  buttons: { label: 'Gumbi', selector: '.btn' },
};
export const TEXT_COLORS = {
  default: 'Privzeta',
  text: 'Barva besedila',
  muted: 'Manj pomembno besedilo',
  accent: 'Glavna barva',
  coral: 'Mavrica 1 (temnejša)',
  sage: 'Mavrica 3 (temnejša)',
  sky: 'Mavrica 4 (temnejša)',
  lilac: 'Mavrica 5 (temnejša)',
  custom: 'Barva po izbiri',
};
export const TEXT_CASES = { default: 'Privzeto', uppercase: 'VELIKE ČRKE', normal: 'Kot je napisano' };
export const TEXT_SHADOWS = { none: 'Brez', soft: 'Mehka senca', pop: 'Barvna senca (3D)' };
export const DEFAULT_TEXT_STYLE = { font: '', weight: 0, size: 100, case: 'default', color: 'default', customColor: '#2c2a3a', tracking: 0, shadow: 'none' };

const COLOR_VARS = { text: 'var(--ink)', muted: 'var(--ink-2)', accent: 'var(--accent)', coral: 'var(--coral-ink)', sage: 'var(--sage-ink)', sky: 'var(--sky-ink)', lilac: 'var(--lilac-ink)' };
const SHADOW_CSS = {
  soft: '0 2px 12px rgb(0 0 0 / 0.18)',
  pop: '0.05em 0.06em 0 var(--gold)',
};

function textStyleCss(styles = {}) {
  return Object.entries(TEXT_ROLES)
    .map(([id, role]) => {
      const t = styles[id];
      if (!t) return '';
      const rules = [];
      if (t.font) rules.push(`font-family: ${fontStack(t.font)};`);
      if (t.weight) rules.push(`font-weight: ${t.weight};`);
      if (t.size !== 100) rules.push(`--k: ${(t.size / 100).toFixed(2)};`);
      if (t.case !== 'default') rules.push(`text-transform: ${t.case === 'uppercase' ? 'uppercase' : 'none'};`);
      if (t.color === 'custom' && isHexColor(t.customColor)) rules.push(`color: ${t.customColor};`);
      else if (COLOR_VARS[t.color]) rules.push(`color: ${COLOR_VARS[t.color]};`);
      if (t.tracking) rules.push(`letter-spacing: ${(t.tracking / 100).toFixed(2)}em;`);
      if (SHADOW_CSS[t.shadow]) rules.push(`text-shadow: ${SHADOW_CSS[t.shadow]};`);
      return rules.length ? `:root ${role.selector} {\n  ${rules.join('\n  ')}\n}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

// --- colour maths -------------------------------------------------------

function channel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  if (!isHexColor(hex)) return 0;
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function isDark(hex) {
  return luminance(hex) < 0.2;
}

/** Mix two hex colours (amount 0–1 of b). */
export function mix(a, b, amount) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - amount) + ((pb >> shift) & 255) * amount);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function toHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h, s, l) {
  const hue = (p, q, t) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const rgb = s === 0 ? [l, l, l] : [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
  return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The same hue, made darker (or lighter on a dark background) until it is readable as text on `bg`.
 * Used for times, "thank you" notes and other coloured text, so soft pastels stay accessible.
 */
export function readableShade(color, bg, min = 5.6) {
  if (contrast(color, bg) >= min) return color;
  const [h, s, l] = toHsl(color);
  const lighten = isDark(bg);
  for (let i = 1; i <= 100; i++) {
    const nl = lighten ? l + (1 - l) * (i / 100) : l * (1 - i / 100);
    const candidate = fromHsl(h, s, nl);
    if (contrast(candidate, bg) >= min) return candidate;
  }
  return lighten ? '#ffffff' : '#000000';
}

/** Border colour for form fields: at least 3:1 against both the page and the cards (WCAG 1.4.11). */
function fieldBorder(c) {
  for (let i = 0; i <= 50; i++) {
    const candidate = mix(c.border, c.text, i / 50);
    if (contrast(candidate, c.surface) >= 3 && contrast(candidate, c.bg) >= 3) return candidate;
  }
  return c.text;
}

/** WCAG checks the admin shows next to the colour pickers. */
export function contrastReport(colors) {
  const checks = [
    { label: 'Besedilo na ozadju', a: colors.text, b: colors.bg, min: 4.5 },
    { label: 'Besedilo na kremnih pasovih', a: colors.text, b: colors.alt, min: 4.5 },
    { label: 'Besedilo na karticah', a: colors.text, b: colors.surface, min: 4.5 },
    { label: 'Manj pomembno besedilo na ozadju', a: colors.muted, b: colors.bg, min: 4.5 },
    { label: 'Manj pomembno besedilo na kremnih pasovih', a: colors.muted, b: colors.alt, min: 4.5 },
    { label: 'Manj pomembno besedilo na karticah', a: colors.muted, b: colors.surface, min: 4.5 },
    { label: 'Besedilo na gumbih', a: colors.onAccent, b: colors.accent, min: 4.5 },
    { label: 'Glavna barva na karticah (povezave, podpis)', a: colors.accent, b: colors.surface, min: 4.5 },
    { label: 'Glavna barva na kremnih pasovih', a: colors.accent, b: colors.alt, min: 3 },
  ];
  return checks.map((c) => {
    const ratio = contrast(c.a, c.b);
    return { ...c, ratio, pass: ratio >= c.min };
  });
}

/** Error red that stays readable on the page background and on cards. */
function dangerColor(c) {
  const [first, second] = isDark(c.bg) ? ['#ff8f85', '#b42318'] : ['#b3261e', '#ff8f85'];
  return [first, second].find((red) => contrast(red, c.bg) >= 4.5 && contrast(red, c.surface) >= 4.5) ?? c.text;
}

/** Every colour variable of the page, derived from the ten-plus colours the owner can change. */
export function themeColors(c) {
  const dark = isDark(c.bg);
  const vars = {
    '--paper': c.bg,
    '--cream': c.alt,
    '--cream-2': mix(c.alt, c.text, dark ? 0.08 : 0.05),
    '--card': c.surface,
    '--rule': c.border,
    '--rule-2': mix(c.border, c.text, dark ? 0.12 : 0.08),
    '--field': fieldBorder(c),
    '--ink': c.text,
    '--ink-2': c.muted,
    '--accent': c.accent,
    '--accent-hover': mix(c.accent, dark ? '#ffffff' : '#000000', dark ? 0.16 : 0.2),
    '--on-accent': c.onAccent,
    '--danger': dangerColor(c),
  };
  for (const key of RAINBOW) {
    vars[`--${key}`] = c[key];
    vars[`--${key}-50`] = mix(c[key], c.surface, dark ? 0.72 : 0.6);
    vars[`--${key}-ink`] = readableShade(c[key], c.surface);
  }
  // The footer is a dark band: the text colour on light themes, a deeper shade of the page on dark ones.
  const footer = dark ? mix(c.bg, '#000000', 0.35) : c.text;
  const onFooter = dark ? c.text : mix(c.bg, c.text, 0.05);
  vars['--footer'] = footer;
  vars['--on-footer'] = onFooter;
  vars['--on-footer-2'] = [0.22, 0.16, 0.1, 0.04, 0].map((k) => mix(onFooter, footer, k)).find((x) => contrast(x, footer) >= 4.5) ?? onFooter;
  return vars;
}

// --- theme.css ------------------------------------------------------------

export function fontFaces(fontId, fontBase = '/assets/fonts/') {
  const font = FONTS[fontId];
  if (!font || !font.family) return '';
  return font.faces
    .map((face) =>
      [
        ['cyr', UNICODE_CYRILLIC],
        ['ext', UNICODE_LATIN_EXT],
        ['latin', UNICODE_LATIN],
      ]
        .filter(([key]) => face[key])
        .map(
          ([key, range]) => `@font-face {
  font-family: '${font.family}';
  font-style: ${face.style ?? 'normal'};
  font-display: swap;
  font-weight: ${face.weight};
  src: url('${fontBase}${face[key]}') format('woff2');
  unicode-range: ${range};
}`
        )
        .join('\n')
    )
    .join('\n');
}

export function fontStack(fontId) {
  const font = FONTS[fontId] ?? FONTS.system;
  return font.family ? `'${font.family}', ${font.fallback}` : font.fallback;
}

/**
 * The font file to <link rel="preload"> for headings, so the invitation renders without a font swap flash.
 * `subset`: 'cyrillic' on the Serbian pages, 'latin' everywhere else.
 */
export function preloadFont(fontId, subset = 'latin') {
  const face = FONTS[fontId]?.faces?.[0];
  return face ? (subset === 'cyrillic' ? face.cyr : face.latin) ?? '' : '';
}

/**
 * theme.css for the given theme. `fontBase` is where the font files are served from.
 */
export function themeCss(theme, { fontBase = '/assets/fonts/', textStyles, logoHeight = 44 } = {}) {
  const c = theme.colors;
  const heading = FONTS[theme.headingFont] ?? FONTS.system;
  const textFonts = Object.values(textStyles ?? {})
    .map((t) => t.font)
    .filter(Boolean);
  const faces = [...new Set([theme.headingFont, theme.bodyFont, HAND_FONT, ...textFonts])].map((id) => fontFaces(id, fontBase)).filter(Boolean);
  const colors = Object.entries(themeColors(c)).map(([k, v]) => `${k}: ${v};`);

  const vars = [
    `color-scheme: ${isDark(c.bg) ? 'dark' : 'light'};`,
    ...colors,
    `--font-display: ${fontStack(theme.headingFont)};`,
    `--font-body: ${fontStack(theme.bodyFont)};`,
    `--font-hand: ${fontStack(HAND_FONT)};`,
    `--heading-weight: ${heading.heading.weight};`,
    `--heading-tracking: ${heading.heading.tracking};`,
    `--heading-scale: ${heading.heading.scale};`,
    `--base-size: ${theme.baseSize}px;`,
    `--logo-h: ${logoHeight}px;`,
  ];

  return `/* Generated from content/site.json by the build. Edit colours and fonts in the admin page, not here. */
${faces.join('\n')}
:root {
  ${vars.join('\n  ')}
}
${textStyleCss(textStyles)}
`;
}
