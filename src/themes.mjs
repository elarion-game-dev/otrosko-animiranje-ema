// Visual theme: self-hosted fonts, colour presets, the generated theme.css and a WCAG contrast checker.
// Fonts are served from this site (no Google Fonts request), so visitors' IP addresses are not sent to a font CDN.
// Every font here has the full Slovenian and Serbo-Croatian alphabet (č š ž ć đ).

import { isHexColor } from './util.mjs';

export const FONTS = {
  baloo: {
    label: 'Baloo 2 (okrogla, igriva)',
    family: 'Baloo 2 Variable',
    fallback: '"Arial Rounded MT Bold", system-ui, sans-serif',
    faces: [{ weight: '400 800', latin: 'baloo-2-latin-wght-normal.woff2', ext: 'baloo-2-latin-ext-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '0', scale: 1.05 },
  },
  grandstander: {
    label: 'Grandstander (otroško živahna)',
    family: 'Grandstander Variable',
    fallback: '"Comic Sans MS", system-ui, sans-serif',
    faces: [{ weight: '100 900', latin: 'grandstander-latin-wght-normal.woff2', ext: 'grandstander-latin-ext-wght-normal.woff2' }],
    heading: { weight: 800, tracking: '-0.01em', scale: 0.95 },
  },
  comfortaa: {
    label: 'Comfortaa (mehka, zaobljena)',
    family: 'Comfortaa Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '300 700', latin: 'comfortaa-latin-wght-normal.woff2', ext: 'comfortaa-latin-ext-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '-0.01em', scale: 0.95 },
  },
  quicksand: {
    label: 'Quicksand (lahkotna)',
    family: 'Quicksand Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '300 700', latin: 'quicksand-latin-wght-normal.woff2', ext: 'quicksand-latin-ext-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '-0.01em', scale: 1 },
  },
  'patrick-hand': {
    label: 'Patrick Hand (ročna pisava)',
    family: 'Patrick Hand',
    fallback: '"Comic Sans MS", cursive',
    faces: [{ weight: '400', latin: 'patrick-hand-latin-400-normal.woff2', ext: 'patrick-hand-latin-ext-400-normal.woff2' }],
    heading: { weight: 400, tracking: '0.01em', scale: 1.15 },
  },
  nunito: {
    label: 'Nunito (zaobljena, berljiva)',
    family: 'Nunito Variable',
    fallback: 'system-ui, sans-serif',
    faces: [{ weight: '200 1000', latin: 'nunito-latin-wght-normal.woff2', ext: 'nunito-latin-ext-wght-normal.woff2' }],
    heading: { weight: 800, tracking: '-0.01em', scale: 1 },
  },
  atkinson: {
    label: 'Atkinson Hyperlegible (najbolj berljiva)',
    family: 'Atkinson Hyperlegible',
    fallback: 'system-ui, sans-serif',
    faces: [
      { weight: '400', latin: 'atkinson-hyperlegible-latin-400-normal.woff2', ext: 'atkinson-hyperlegible-latin-ext-400-normal.woff2' },
      { weight: '700', latin: 'atkinson-hyperlegible-latin-700-normal.woff2', ext: 'atkinson-hyperlegible-latin-ext-700-normal.woff2' },
    ],
    heading: { weight: 700, tracking: '-0.01em', scale: 1 },
  },
  fraunces: {
    label: 'Fraunces (mehka serifna)',
    family: 'Fraunces Variable',
    fallback: 'Georgia, serif',
    faces: [{ weight: '100 900', latin: 'fraunces-latin-wght-normal.woff2', ext: 'fraunces-latin-ext-wght-normal.woff2' }],
    heading: { weight: 650, tracking: '-0.01em', scale: 1 },
  },
  jost: {
    label: 'Jost (geometrijska)',
    family: 'Jost Variable',
    fallback: 'Futura, "Trebuchet MS", system-ui, sans-serif',
    faces: [{ weight: '100 900', latin: 'jost-latin-wght-normal.woff2', ext: 'jost-latin-ext-wght-normal.woff2' }],
    heading: { weight: 700, tracking: '0', scale: 1 },
  },
  inter: {
    label: 'Inter (čista, sodobna)',
    family: 'Inter Variable',
    fallback: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    faces: [{ weight: '100 900', latin: 'inter-latin-wght-normal.woff2', ext: 'inter-latin-ext-wght-normal.woff2' }],
    heading: { weight: 750, tracking: '-0.02em', scale: 1 },
  },
  system: {
    label: 'Sistemska pisava (brez prenosa)',
    family: '',
    fallback: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    faces: [],
    heading: { weight: 750, tracking: '-0.01em', scale: 1 },
  },
};

export const FONT_IDS = Object.keys(FONTS);

const UNICODE_LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const UNICODE_LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const COLOR_KEYS = [
  ['bg', 'Ozadje strani'],
  ['alt', 'Ozadje izmeničnih razdelkov'],
  ['surface', 'Kartice'],
  ['border', 'Obrobe'],
  ['text', 'Besedilo'],
  ['muted', 'Manj pomembno besedilo'],
  ['accent', 'Glavna barva (gumbi)'],
  ['onAccent', 'Besedilo na gumbih'],
  ['accent2', 'Druga barva (ikone, poudarki)'],
  ['accent3', 'Tretja barva (okraski)'],
];

// Each preset sets the colours plus these theme keys.
export const PRESET_KEYS = ['headingFont', 'bodyFont', 'buttonStyle', 'cardStyle', 'radius', 'divider', 'pattern', 'decoration'];

export const PRESETS = {
  rainbow: {
    label: 'Mavrica',
    colors: { bg: '#fffaf3', alt: '#fff0e1', surface: '#ffffff', border: '#f0dcc4', text: '#2b2340', muted: '#5c5372', accent: '#d6336c', onAccent: '#ffffff', accent2: '#1c6fc7', accent3: '#fcc419' },
    headingFont: 'baloo',
    bodyFont: 'nunito',
    buttonStyle: 'toy',
    cardStyle: 'shadow',
    radius: 22,
    divider: 'wave',
    pattern: 'confetti',
    decoration: 'balloons',
  },
  icecream: {
    label: 'Sladoled',
    colors: { bg: '#fdf8fc', alt: '#f2efff', surface: '#ffffff', border: '#e7dcf0', text: '#35264a', muted: '#65577a', accent: '#6741d9', onAccent: '#ffffff', accent2: '#d6336c', accent3: '#63e6be' },
    headingFont: 'comfortaa',
    bodyFont: 'nunito',
    buttonStyle: 'pill',
    cardStyle: 'flat',
    radius: 28,
    divider: 'curve',
    pattern: 'dots',
    decoration: 'bubbles',
  },
  jungle: {
    label: 'Džungla',
    colors: { bg: '#f7fbf3', alt: '#e8f4dd', surface: '#ffffff', border: '#cfe3c0', text: '#1d3324', muted: '#4a6352', accent: '#237032', onAccent: '#ffffff', accent2: '#c25e00', accent3: '#ffd43b' },
    headingFont: 'grandstander',
    bodyFont: 'nunito',
    buttonStyle: 'toy',
    cardStyle: 'sticker',
    radius: 16,
    divider: 'clouds',
    pattern: 'none',
    decoration: 'confetti',
  },
  sea: {
    label: 'Morje',
    colors: { bg: '#f4f9fd', alt: '#e2f1fb', surface: '#ffffff', border: '#cce3f2', text: '#12324a', muted: '#475f74', accent: '#1864ab', onAccent: '#ffffff', accent2: '#087f5b', accent3: '#ffa94d' },
    headingFont: 'baloo',
    bodyFont: 'atkinson',
    buttonStyle: 'pill',
    cardStyle: 'outline',
    radius: 20,
    divider: 'wave',
    pattern: 'dots',
    decoration: 'bubbles',
  },
  circus: {
    label: 'Cirkus',
    colors: { bg: '#fffbf0', alt: '#fff2d1', surface: '#ffffff', border: '#eed8a6', text: '#2a1e12', muted: '#665641', accent: '#c92a2a', onAccent: '#ffffff', accent2: '#1864ab', accent3: '#fab005' },
    headingFont: 'grandstander',
    bodyFont: 'nunito',
    buttonStyle: 'toy',
    cardStyle: 'sticker',
    radius: 12,
    divider: 'zigzag',
    pattern: 'stars',
    decoration: 'confetti',
  },
  candy: {
    label: 'Bonbon',
    colors: { bg: '#fff6fa', alt: '#ffe6f0', surface: '#ffffff', border: '#f5cfdf', text: '#3b1530', muted: '#704a65', accent: '#b8205a', onAccent: '#ffffff', accent2: '#6741d9', accent3: '#ffd43b' },
    headingFont: 'comfortaa',
    bodyFont: 'nunito',
    buttonStyle: 'pill',
    cardStyle: 'shadow',
    radius: 24,
    divider: 'scallop',
    pattern: 'dots',
    decoration: 'balloons',
  },
  sunflower: {
    label: 'Sončnica',
    colors: { bg: '#fffcec', alt: '#fff3c4', surface: '#ffffff', border: '#f1df9c', text: '#2d2410', muted: '#655634', accent: '#fab005', onAccent: '#2d2410', accent2: '#c2410c', accent3: '#4dabf7' },
    headingFont: 'patrick-hand',
    bodyFont: 'nunito',
    buttonStyle: 'toy',
    cardStyle: 'sticker',
    radius: 14,
    divider: 'clouds',
    pattern: 'confetti',
    decoration: 'stars',
  },
  night: {
    label: 'Pravljična noč (temna)',
    colors: { bg: '#15173b', alt: '#1d204e', surface: '#24285c', border: '#383e7c', text: '#f5f3ff', muted: '#bdb9e0', accent: '#ffd43b', onAccent: '#1d1a05', accent2: '#ff8fab', accent3: '#74c0fc' },
    headingFont: 'baloo',
    bodyFont: 'nunito',
    buttonStyle: 'pill',
    cardStyle: 'outline',
    radius: 20,
    divider: 'wave',
    pattern: 'stars',
    decoration: 'stars',
  },
};

export const BUTTON_STYLES = { toy: 'Igračasti (3D, s senco spodaj)', pill: 'Zaobljeni', rounded: 'Rahlo zaobljeni', outline: 'Obrobljeni' };
export const CARD_STYLES = { shadow: 'Mehka senca', flat: 'Ploščate', outline: 'Obroba', sticker: 'Nalepke (debela obroba, barvna senca)' };
export const DIVIDERS = { none: 'Brez (ravna črta)', wave: 'Val', curve: 'Lok', zigzag: 'Cikcak', scallop: 'Polkrogi', clouds: 'Oblački' };
export const PATTERNS = { none: 'Brez', dots: 'Pikice', confetti: 'Konfeti', stars: 'Zvezdice' };
export const DECORATIONS = { none: 'Brez', balloons: 'Baloni', confetti: 'Konfeti', bubbles: 'Mehurčki', stars: 'Zvezdice' };

// --- text styles ------------------------------------------------------------
// Per-text overrides on top of the theme. site.css multiplies each role's font size by --k.

export const TEXT_ROLES = {
  heroTitle: { label: 'Glavni naslov na vrhu', selector: '.hero-title' },
  sectionTitles: { label: 'Naslovi razdelkov', selector: '.section-title' },
  cardTitles: { label: 'Naslovi kartic (storitve, paketi …)', selector: '.card-title' },
  menu: { label: 'Povezave v meniju', selector: '.nav-link' },
  buttons: { label: 'Gumbi', selector: '.btn' },
};
export const TEXT_COLORS = { default: 'Privzeta', text: 'Barva besedila', muted: 'Manj pomembno besedilo', accent: 'Glavna barva', accent2: 'Druga barva', accent3: 'Tretja barva', custom: 'Barva po izbiri' };
export const TEXT_CASES = { default: 'Privzeto', uppercase: 'VELIKE ČRKE', normal: 'Kot je napisano' };
export const TEXT_SHADOWS = { none: 'Brez', soft: 'Mehka senca', pop: 'Barvna senca (3D)' };
export const DEFAULT_TEXT_STYLE = { font: '', weight: 0, size: 100, case: 'default', color: 'default', customColor: '#2b2340', tracking: 0, shadow: 'none' };

const COLOR_VARS = { text: 'var(--text)', muted: 'var(--muted)', accent: 'var(--accent)', accent2: 'var(--accent-2)', accent3: 'var(--accent-3)' };
const SHADOW_CSS = {
  soft: '0 2px 12px rgb(0 0 0 / 0.18)',
  pop: '0.05em 0.06em 0 var(--accent-3)',
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

/** WCAG checks the admin shows next to the colour pickers. */
export function contrastReport(colors) {
  const checks = [
    { label: 'Besedilo na ozadju', a: colors.text, b: colors.bg, min: 4.5 },
    { label: 'Besedilo na izmeničnem ozadju', a: colors.text, b: colors.alt, min: 4.5 },
    { label: 'Besedilo na karticah', a: colors.text, b: colors.surface, min: 4.5 },
    { label: 'Manj pomembno besedilo na ozadju', a: colors.muted, b: colors.bg, min: 4.5 },
    { label: 'Manj pomembno besedilo na izmeničnem ozadju', a: colors.muted, b: colors.alt, min: 4.5 },
    { label: 'Besedilo na gumbih', a: colors.onAccent, b: colors.accent, min: 4.5 },
    { label: 'Ikone in poudarki na karticah', a: colors.accent2, b: colors.surface, min: 3 },
  ];
  return checks.map((c) => {
    const ratio = contrast(c.a, c.b);
    return { ...c, ratio, pass: ratio >= c.min };
  });
}

/** Mix two hex colours (amount 0–1 of b). Used for darker button edges and soft tints. */
export function mix(a, b, amount) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - amount) + ((pb >> shift) & 255) * amount);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

// --- patterns and dividers ------------------------------------------------------
// Small SVGs turned into data: URLs. Colours are written in directly, because CSS variables don't reach into them.

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}")`;

function patternSvg(kind, c, strength) {
  const o = (strength / 100).toFixed(2);
  if (kind === 'dots') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="4" cy="4" r="2" fill="${c.accent2}" fill-opacity="${o}"/><circle cx="18" cy="18" r="2" fill="${c.accent3}" fill-opacity="${o}"/></svg>`;
  }
  if (kind === 'confetti') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" fill-opacity="${o}"><rect x="14" y="20" width="12" height="5" rx="2.5" fill="${c.accent}" transform="rotate(30 20 22)"/><circle cx="70" cy="18" r="4" fill="${c.accent3}"/><rect x="118" y="40" width="12" height="5" rx="2.5" fill="${c.accent2}" transform="rotate(-25 124 42)"/><circle cx="40" cy="92" r="3.5" fill="${c.accent2}"/><rect x="84" y="88" width="12" height="5" rx="2.5" fill="${c.accent3}" transform="rotate(60 90 90)"/><circle cx="140" cy="120" r="4" fill="${c.accent}"/><rect x="20" y="140" width="12" height="5" rx="2.5" fill="${c.accent3}" transform="rotate(-40 26 142)"/><circle cx="100" cy="150" r="3" fill="${c.accent2}"/></svg>`;
  }
  if (kind === 'stars') {
    const star = (x, y, s, fill) =>
      `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" d="M0-10 2.9-3.1 10-2.4 4.6 2.4 6.2 9.5 0 5.8-6.2 9.5-4.6 2.4-10-2.4-2.9-3.1z"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" fill-opacity="${o}">${star(24, 28, 0.7, c.accent3)}${star(96, 54, 0.5, c.accent2)}${star(50, 108, 0.6, c.accent)}${star(124, 122, 0.4, c.accent3)}</svg>`;
  }
  return '';
}

const DIVIDER_SHAPES = {
  wave: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 34C150 4 300 4 450 26s300 34 450 14S1100 6 1200 22V60H0z"/></svg>', size: '100% 100%', repeat: 'no-repeat', height: 48 },
  curve: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 60Q600-30 1200 60z"/></svg>', size: '100% 100%', repeat: 'no-repeat', height: 44 },
  zigzag: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><path d="M0 20 20 2l20 18z"/></svg>', size: '40px 100%', repeat: 'repeat-x', height: 20 },
  scallop: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24"><path d="M0 24a24 22 0 0 1 48 0z"/></svg>', size: '48px 100%', repeat: 'repeat-x', height: 22 },
  clouds: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M0 40V30c6-12 22-14 30-6 4-14 24-18 32-6 8-10 26-8 30 4 10-8 26-2 28 8v10z"/></svg>', size: '120px 100%', repeat: 'repeat-x', height: 34 },
};

// --- theme.css ------------------------------------------------------------

export function fontFaces(fontId, fontBase = '/assets/fonts/') {
  const font = FONTS[fontId];
  if (!font || !font.family) return '';
  return font.faces
    .map((face) =>
      [
        ['ext', UNICODE_LATIN_EXT],
        ['latin', UNICODE_LATIN],
      ]
        .map(
          ([key, range]) => `@font-face {
  font-family: '${font.family}';
  font-style: normal;
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

/** The font file to <link rel="preload"> for headings, so the hero renders without a font swap flash. */
export function preloadFont(fontId) {
  const face = FONTS[fontId]?.faces?.[0];
  return face ? face.latin : '';
}

/** Error red that stays readable on the page background. */
function dangerColor(c) {
  const [first, second] = isDark(c.bg) ? ['#ff8f85', '#b42318'] : ['#b42318', '#ff8f85'];
  return [first, second].find((red) => contrast(red, c.bg) >= 4.5) ?? c.text;
}

/**
 * theme.css for the given theme. `fontBase` is where the font files are served from.
 */
export function themeCss(theme, { fontBase = '/assets/fonts/', textStyles, heroOverlay = 50, logoHeight = 44 } = {}) {
  const c = theme.colors;
  const heading = FONTS[theme.headingFont] ?? FONTS.system;
  const textFonts = Object.values(textStyles ?? {})
    .map((t) => t.font)
    .filter(Boolean);
  const faces = [...new Set([theme.headingFont, theme.bodyFont, ...textFonts])].map((id) => fontFaces(id, fontBase)).filter(Boolean);
  const pattern = theme.pattern !== 'none' ? patternSvg(theme.pattern, c, theme.patternStrength) : '';
  const divider = DIVIDER_SHAPES[theme.divider];
  const dark = isDark(c.bg);

  const vars = [
    `color-scheme: ${dark ? 'dark' : 'light'};`,
    `--bg: ${c.bg};`,
    `--alt: ${c.alt};`,
    `--surface: ${c.surface};`,
    `--border: ${c.border};`,
    `--text: ${c.text};`,
    `--muted: ${c.muted};`,
    `--accent: ${c.accent};`,
    `--on-accent: ${c.onAccent};`,
    `--accent-2: ${c.accent2};`,
    `--accent-3: ${c.accent3};`,
    // A darker edge under "toy" buttons and a soft tint for icon bubbles.
    `--accent-edge: ${mix(c.accent, '#000000', 0.28)};`,
    `--accent-2-soft: ${mix(c.surface, c.accent2, dark ? 0.28 : 0.14)};`,
    `--accent-3-soft: ${mix(c.surface, c.accent3, dark ? 0.3 : 0.22)};`,
    `--danger: ${dangerColor(c)};`,
    `--font-heading: ${fontStack(theme.headingFont)};`,
    `--font-body: ${fontStack(theme.bodyFont)};`,
    `--heading-weight: ${heading.heading.weight};`,
    `--heading-tracking: ${heading.heading.tracking};`,
    `--heading-scale: ${heading.heading.scale};`,
    `--base-size: ${theme.baseSize}px;`,
    `--radius: ${theme.radius}px;`,
    `--hero-overlay: ${(heroOverlay / 100).toFixed(2)};`,
    `--logo-h: ${logoHeight}px;`,
    `--pattern: ${pattern ? svgUrl(pattern) : 'none'};`,
  ];
  if (divider) {
    vars.push(`--divider: ${svgUrl(divider.svg)};`, `--divider-size: ${divider.size};`, `--divider-repeat: ${divider.repeat};`, `--divider-h: ${divider.height}px;`);
  }

  return `/* Generated from content/site.json by the build. Edit colours and fonts in the admin page, not here. */
${faces.join('\n')}
:root {
  ${vars.join('\n  ')}
}
${textStyleCss(textStyles)}
`;
}

