// Renders every public page from the settings object. Used by the build (Node) and by the admin's live
// preview (browser), so what the owner sees in the preview is exactly what gets published.
//
// Every page exists once per language. Slovenian lives at the site root, the others under /en/ and /sh/.
// All links start with the site's base path ("/otrosko-animiranje-ema" on GitHub Pages, "" on a domain).

import { brandIcon, faviconSvg, serviceIcon, uiIcon } from './icons.mjs';
import { ANCHORS, FIELD_KEYS, FIELD_LABELS, FIELD_PLACEHOLDERS, LANG_INFO, LANGS, pagePath, ui, WEEKDAYS } from './i18n.mjs';
import { markdown, plain } from './markdown.mjs';
import { privacyBody } from './policy.mjs';
import { resolveProvider } from './providers.mjs';
import { DAYS, enabledLangs, FORM_FIELDS, SECTION_IDS, SOCIAL_PLATFORMS } from './settings.mjs';
import { DECORATIONS, preloadFont, themeCss } from './themes.mjs';
import { basePath, esc, phoneDigits, tr } from './util.mjs';

export { faviconSvg };

// --- small helpers -----------------------------------------------------------------

const T = (ctx, field) => tr(field, ctx.lang);

/**
 * In the admin preview, marks a text so clicking it opens its field in the editor. Texts not yet translated
 * into the previewed language show the Slovenian original with a dashed outline.
 */
function ed(ctx, path, field) {
  if (!ctx.preview) return '';
  const missing = field && ctx.lang !== 'sl' && field.sl?.trim() && !field[ctx.lang]?.trim();
  return ` data-edit="${esc(path)}" title="${missing ? 'Še ni prevedeno. Kliknite za urejanje.' : 'Kliknite za urejanje'}"${missing ? ' data-missing' : ''}`;
}

const external = (href) => (/^https?:/.test(href) ? ' rel="noopener" target="_blank"' : '');
const anchor = (id, lang) => ANCHORS[id]?.[lang] ?? id;

/** Link for a home page section: just "#kontakt" on the home page, the full address elsewhere. */
function sectionHref(ctx, id) {
  const hash = `#${anchor(id, ctx.lang)}`;
  return ctx.page === 'home' ? hash : `${ctx.url(pagePath('home', ctx.lang))}${hash}`;
}

function isVisible(settings, id) {
  return settings.sections.some((s) => s.id === id && s.enabled);
}

/**
 * Where a button or link goes: a section of the home page, a phone call, WhatsApp, Viber, email or any URL.
 * Returns null when it can't go anywhere yet (e.g. "call" without a phone number), so the button is left out.
 */
export function targetHref(settings, ctx, target, url = '') {
  const c = settings.contact;
  const digits = phoneDigits(c.phone);
  switch (target) {
    case 'phone':
      return digits ? `tel:+${digits}` : null;
    case 'whatsapp':
      return digits ? `https://wa.me/${digits}` : null;
    case 'viber':
      return digits ? `viber://chat?number=%2B${digits}` : null;
    case 'email':
      return c.email ? `mailto:${c.email}` : null;
    case 'url':
      return url ? (url.startsWith('/') ? ctx.url(url) : url) : null;
    default:
      return SECTION_IDS.includes(target) && isVisible(settings, target) ? sectionHref(ctx, target) : null;
  }
}

function targetIcon(target) {
  if (target === 'phone') return uiIcon('phone');
  if (target === 'whatsapp' || target === 'viber') return brandIcon(target);
  if (target === 'email') return uiIcon('mail');
  return '';
}

function btn(settings, ctx, b, path, cls) {
  const href = targetHref(settings, ctx, b.target, b.url);
  const label = T(ctx, b.label);
  if (!label || !href) return ctx.preview && label ? `<span class="btn ${cls} is-placeholder"${ed(ctx, `${path}.label`, b.label)}>${esc(label)}</span>` : '';
  return `<a class="btn ${cls}" href="${esc(href)}"${external(href)}${ed(ctx, `${path}.label`, b.label)}>${targetIcon(b.target)}<span>${esc(label)}</span></a>`;
}

// --- pages ------------------------------------------------------------------------

const PAGE_IDS = ['home', 'privacy', 'terms', 'thanks'];
const PAGE_LABELS = { home: 'Domača stran', privacy: 'Politika zasebnosti', terms: 'Pogoji poslovanja', thanks: 'Zahvala po povpraševanju', notfound: 'Stran ne obstaja (404)' };

/** Everything the layout needs to know about one page in one language. */
export function pageInfo(settings, id, lang) {
  if (id === 'notfound') return { id, path: '/404.html', file: '404.html', title: ui('notFoundTitle', 'sl'), noindex: true };
  if (!PAGE_IDS.includes(id)) return null;
  const path = pagePath(id, lang);
  const titles = { privacy: ui('privacyPolicy', lang), terms: tr(settings.terms.title, lang), thanks: tr(settings.thanks.title, lang) };
  return { id, path, file: `${path.slice(1)}index.html`, title: titles[id] ?? '', noindex: id === 'thanks' };
}

/** [pageId, lang] pairs that exist on the live site. */
export function livePages(settings) {
  const pages = [];
  for (const lang of enabledLangs(settings)) {
    pages.push(['home', lang], ['privacy', lang], ['thanks', lang]);
    if (settings.terms.enabled) pages.push(['terms', lang]);
  }
  pages.push(['notfound', 'sl']);
  return pages;
}

/** Every page the admin can preview, including ones that are switched off on the live site. */
export function previewPages(settings) {
  return [...PAGE_IDS, 'notfound'].map((id) => ({ id, label: PAGE_LABELS[id], hidden: id === 'terms' && !settings.terms.enabled }));
}

/** Page and language for a path inside the site, such as "/en/privacy/" (base path already removed). */
export function pageForPath(pathname) {
  const clean = pathname.replace(/index\.html$/, '');
  for (const lang of LANGS) for (const id of PAGE_IDS) if (pagePath(id, lang) === clean || pagePath(id, lang) === `${clean}/`) return { id, lang };
  return null;
}

// --- shared building blocks ----------------------------------------------------------

function contentSecurityPolicy(provider) {
  const sends = provider.ready && provider.responds === 'json' ? provider.origin : "'none'";
  const posts = provider.ready ? (provider.responds === 'mailto' ? ' mailto:' : provider.origin ? ` ${provider.origin}` : '') : '';
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${sends}`,
    `form-action 'self'${posts}`,
    "manifest-src 'self'",
    "base-uri 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function brand(settings, ctx, cls = 'brand') {
  const h = settings.header;
  const logo = h.logo ? `<img class="brand-logo" src="${esc(ctx.img(h.logo))}" alt="${h.showName ? '' : esc(settings.site.name)}">` : '';
  const name = h.showName || !h.logo ? `<span class="brand-name">${esc(settings.site.name)}</span>` : '';
  return `<a class="${cls}" href="${esc(ctx.url(pagePath('home', ctx.lang)))}">${logo}${name}</a>`;
}

function langSwitch(settings, ctx) {
  const langs = ctx.langs;
  if (langs.length < 2) return '';
  const label = (l) => (l === 'sl' ? LANG_INFO.sl.short : settings.languages[l].short);
  const name = (l) => (l === 'sl' ? LANG_INFO.sl.name : settings.languages[l].label);
  const target = ctx.page === 'notfound' ? 'home' : ctx.page;
  const items = langs.map((l) => {
    const current = l === ctx.lang;
    return `<li><a href="${esc(ctx.url(pagePath(target, l)))}" hreflang="${l === 'sh' ? 'sh' : l}" lang="${l}" title="${esc(name(l))}"${current ? ' aria-current="true"' : ''}>${esc(label(l))}</a></li>`;
  });
  return `<nav class="lang-switch" aria-label="${esc(ui('language', ctx.lang))}"><ul>${items.join('')}</ul></nav>`;
}

function announcement(settings, ctx) {
  const a = settings.announcement;
  if (!a.enabled || !T(ctx, a.text)) return '';
  const href = targetHref(settings, ctx, a.target, a.url);
  const label = T(ctx, a.linkLabel);
  return `<div class="announce announce-${a.style}">
  <p class="container">${uiIcon('megaphone')}<span${ed(ctx, 'announcement.text', a.text)}>${esc(T(ctx, a.text))}</span>${href && label ? ` <a href="${esc(href)}"${external(href)}>${esc(label)} ${uiIcon('arrow', 'icon icon-sm')}</a>` : ''}</p>
</div>`;
}

function header(settings, ctx) {
  const h = settings.header;
  const items = settings.sections
    .filter((s) => s.enabled && s.inMenu && sectionHasContent(settings, ctx, s.id))
    .map((s) => `<li><a class="nav-link" href="${esc(sectionHref(ctx, s.id))}"${ed(ctx, `sections.${settings.sections.indexOf(s)}.menuLabel`, s.menuLabel)}>${esc(T(ctx, s.menuLabel) || T(ctx, s.heading))}</a></li>`);
  const cta = h.cta.enabled ? btn(settings, ctx, h.cta, 'header.cta', 'btn-primary btn-sm header-cta') : '';
  return `<header class="site-header${h.sticky ? ' is-sticky' : ''}" data-header>
  <div class="container header-inner">
    ${brand(settings, ctx)}
    <nav class="nav" id="site-menu" aria-label="${esc(ui('mainNav', ctx.lang))}">
      ${items.length ? `<ul class="nav-links">${items.join('')}</ul>` : ''}
      ${cta ? `<div class="nav-cta">${cta}</div>` : ''}
      <a class="menu-close" href="#" aria-label="${esc(ui('closeMenu', ctx.lang))}">${uiIcon('close')}</a>
    </nav>
    <div class="header-actions">
      ${langSwitch(settings, ctx)}
      ${cta}
      ${items.length || cta ? `<a class="menu-toggle" href="#site-menu" aria-controls="site-menu" aria-expanded="false" aria-label="${esc(ui('menu', ctx.lang))}">${uiIcon('menu')}</a>` : ''}
    </div>
  </div>
</header>`;
}

function socialLinks(settings, ctx, cls) {
  const items = settings.socials
    .filter((s) => s.url || ctx.preview)
    .map((s) => {
      const name = s.label || SOCIAL_PLATFORMS[s.platform] || 'Link';
      if (!s.url) return `<li><a href="#" class="is-placeholder" aria-label="${esc(name)}" title="${esc(name)}: povezava še ni vpisana">${brandIcon(s.platform)}</a></li>`;
      return `<li><a href="${esc(s.url)}"${external(s.url)} aria-label="${esc(name)}" title="${esc(name)}">${brandIcon(s.platform)}</a></li>`;
    });
  return items.length ? `<ul class="${cls}" aria-label="${esc(ui('social', ctx.lang))}">${items.join('')}</ul>` : '';
}

function contactList(settings, ctx, cls) {
  const c = settings.contact;
  const digits = phoneDigits(c.phone);
  const rows = [
    digits ? `<li><a href="tel:+${digits}">${uiIcon('phone')}<span>${esc(c.phone)}</span></a></li>` : '',
    c.email ? `<li><a href="mailto:${esc(c.email)}">${uiIcon('mail')}<span>${esc(c.email)}</span></a></li>` : '',
    T(ctx, c.area) ? `<li>${uiIcon('pin')}<span${ed(ctx, 'contact.area', c.area)}>${esc(T(ctx, c.area))}</span></li>` : '',
  ].filter(Boolean);
  return rows.length ? `<ul class="${cls}">${rows.join('')}</ul>` : '';
}

function businessDetails(settings, ctx) {
  const b = settings.business;
  if (!b.name) return '';
  const rows = [
    `<strong>${esc(b.name)}</strong>`,
    b.address ? esc(b.address).replace(/\n/g, ', ') : '',
    b.registration ? `${esc(ui('registration', ctx.lang))}: ${esc(b.registration)}` : '',
    b.taxNumber ? `${esc(ui('taxNumber', ctx.lang))}: ${esc(b.taxNumber)}` : '',
    b.vatId ? `${esc(ui('vatId', ctx.lang))}: ${esc(b.vatId)}` : '',
  ].filter(Boolean);
  return `<p class="footer-business">${rows.join('<br>')}</p>`;
}

function footer(settings, ctx) {
  const f = settings.footer;
  const s = settings;
  const links = [
    `<a href="${esc(ctx.url(pagePath('privacy', ctx.lang)))}">${esc(ui('privacyPolicy', ctx.lang))}</a>`,
    s.terms.enabled ? `<a href="${esc(ctx.url(pagePath('terms', ctx.lang)))}">${esc(T(ctx, s.terms.title))}</a>` : '',
  ].filter(Boolean);
  const text = T(ctx, f.text);
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-col">
      ${brand(settings, ctx, 'brand brand-footer')}
      ${text ? `<p class="footer-text"${ed(ctx, 'footer.text', f.text)}>${esc(text)}</p>` : ''}
      ${f.showSocials ? socialLinks(settings, ctx, 'socials') : ''}
    </div>
    ${f.showContact ? `<div class="footer-col">${contactList(settings, ctx, 'contact-list')}</div>` : ''}
    ${f.showBusiness ? `<div class="footer-col">${businessDetails(settings, ctx)}</div>` : ''}
  </div>
  <div class="container footer-bottom">
    <p>© ${ctx.year} ${esc(s.business.name || s.site.name)}</p>
    <nav class="footer-nav" aria-label="${esc(ui('privacyPolicy', ctx.lang))}">${links.join('')}</nav>
  </div>
</footer>`;
}

function floatingButton(settings, ctx) {
  const f = settings.floating;
  if (!f.enabled || ctx.page === 'notfound') return '';
  const href = f.action === 'contact' ? targetHref(settings, ctx, 'contact') : targetHref(settings, ctx, f.action);
  if (!href) return '';
  const icon = f.action === 'contact' ? uiIcon('mail') : targetIcon(f.action);
  return `<a class="float-btn float-${f.side} float-${f.where}" href="${esc(href)}"${external(href)}>${icon}<span${ed(ctx, 'floating.label', f.label)}>${esc(T(ctx, f.label))}</span></a>`;
}

/** Structured data for search engines (schema.org), on the home page. */
function jsonLd(settings, ctx) {
  const s = settings;
  const c = s.contact;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EntertainmentBusiness',
    name: s.business.name || s.site.name,
    url: s.site.url + pagePath('home', ctx.lang),
    description: T(ctx, s.seo.description),
    ...(c.phone ? { telephone: `+${phoneDigits(c.phone)}` } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(s.seo.ogImage ? { image: s.site.url + s.seo.ogImage } : s.header.logo ? { image: s.site.url + s.header.logo } : {}),
    ...(s.seo.areaServed ? { areaServed: s.seo.areaServed } : {}),
    ...(s.seo.priceRange ? { priceRange: s.seo.priceRange } : {}),
    ...(s.business.address ? { address: { '@type': 'PostalAddress', streetAddress: s.business.address.replace(/\n/g, ', '), addressCountry: 'SI' } } : {}),
    ...(s.socials.some((x) => /^https:/.test(x.url)) ? { sameAs: s.socials.filter((x) => /^https:/.test(x.url)).map((x) => x.url) } : {}),
  };
  // A data block, not a script: browsers never run it, so it is not affected by the Content Security Policy.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n`;
}

function layout(settings, ctx, info, main) {
  const s = settings;
  const t = s.theme;
  const lang = ctx.lang;
  const home = info.id === 'home';
  const title = home ? T(ctx, s.seo.title) : `${info.title} | ${s.site.name}`;
  const description = T(ctx, s.seo.description);
  const noindex = !s.seo.indexable || info.noindex;
  const canonical = s.site.url + info.path;
  const ogImage = s.seo.ogImage ? s.site.url + s.seo.ogImage : '';
  const v = ctx.version ? `?v=${esc(ctx.version)}` : '';
  const favicon = t.favicon ? ctx.img(t.favicon) : ctx.url(`/assets/img/favicon.svg${v}`);
  const font = ctx.preview ? '' : preloadFont(t.headingFont);
  const alternates =
    info.id === 'notfound' || ctx.langs.length < 2
      ? ''
      : ctx.langs
          .flatMap((l) => LANG_INFO[l].hreflang.map((code) => `<link rel="alternate" hreflang="${code}" href="${esc(s.site.url + pagePath(info.id, l))}">`))
          .concat(`<link rel="alternate" hreflang="x-default" href="${esc(s.site.url + pagePath(info.id, 'sl'))}">`)
          .join('\n') + '\n';
  const attrs = [
    `lang="${lang}"`,
    `data-buttons="${t.buttonStyle}"`,
    `data-cards="${t.cardStyle}"`,
    `data-divider="${t.divider}"`,
    `data-motion="${t.animations ? 'on' : 'off'}"`,
    ctx.preview ? 'data-preview' : '',
  ].filter(Boolean);

  return `<!doctype html>
<html ${attrs.join(' ')}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ctx.preview ? '' : `<meta http-equiv="Content-Security-Policy" content="${esc(contentSecurityPolicy(ctx.provider))}">\n`}<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">
${info.id === 'notfound' ? '' : `<link rel="canonical" href="${esc(canonical)}">\n`}${alternates}<meta name="theme-color" content="${t.colors.bg}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(s.site.name)}">
<meta property="og:locale" content="${LANG_INFO[lang].og}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta property="og:image:alt" content="${esc(T(ctx, s.seo.ogImageAlt))}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${esc(favicon)}">
<link rel="manifest" href="${esc(ctx.url('/site.webmanifest'))}">
${font ? `<link rel="preload" href="${esc(ctx.url(`/assets/fonts/${font}`))}" as="font" type="font/woff2" crossorigin>\n` : ''}<link rel="stylesheet" href="${esc(ctx.themeHref ?? ctx.url(`/assets/css/theme.css${v}`))}">
<link rel="stylesheet" href="${esc(ctx.url(`/assets/css/site.css${v}`))}">
${ctx.preview ? '' : `<script type="module" src="${esc(ctx.url(`/assets/js/site.js${v}`))}"></script>\n`}${home ? jsonLd(s, ctx) : ''}</head>
<body class="page-${info.id}">
<a class="skip-link" href="#main">${esc(ui('skip', lang))}</a>
${announcement(s, ctx)}
${header(s, ctx)}
<main id="main" tabindex="-1">
${main}
</main>
${footer(s, ctx)}
${floatingButton(s, ctx)}
</body>
</html>
`;
}

// --- decorations -------------------------------------------------------------------------
// Drawn with currentColor and coloured from theme.css through classes, because inline styles are not allowed.

const BALLOON = '<path d="M30 2C14.5 2 4 14 4 28c0 16 13 30 26 30s26-14 26-30C56 14 45.5 2 30 2z"/><path d="m26 57-3 6h14l-3-6z"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M30 63c0 8-6 10-6 18s6 10 6 18"/><ellipse cx="19" cy="20" rx="5" ry="9" fill="#fff" fill-opacity=".35" transform="rotate(25 19 20)"/>';
const STAR = '<path d="M12 1.5 15 8.5l7.5.7-5.7 5 1.7 7.4L12 17.8l-6.5 3.8 1.7-7.4-5.7-5L9 8.5z"/>';

function decoration(kind) {
  if (!DECORATIONS[kind] || kind === 'none') return '';
  const pieces = {
    balloons: () => Array.from({ length: 5 }, (_, i) => `<svg class="deco deco-${i + 1}" viewBox="0 0 60 100" fill="currentColor">${BALLOON}</svg>`),
    confetti: () => Array.from({ length: 14 }, (_, i) => `<span class="deco deco-${i + 1} ${i % 3 === 0 ? 'is-dot' : 'is-strip'}"></span>`),
    bubbles: () => Array.from({ length: 8 }, (_, i) => `<span class="deco deco-${i + 1}"></span>`),
    stars: () => Array.from({ length: 8 }, (_, i) => `<svg class="deco deco-${i + 1}" viewBox="0 0 24 24" fill="currentColor">${STAR}</svg>`),
  };
  return `<div class="hero-deco deco-${kind}" aria-hidden="true">${pieces[kind]().join('')}</div>`;
}

/** Shown in place of a hero photo until one is uploaded: a bunch of balloons in the theme colours. */
const HERO_ART = `<svg class="hero-art" viewBox="0 0 400 420" aria-hidden="true">
  <g class="art-strings" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M130 236c10 50 40 90 70 150"/><path d="M200 196c-6 60 6 120 0 190"/><path d="M276 228c-16 56-46 100-76 158"/></g>
  <g class="art-balloon art-a"><path d="M130 40c-50 0-80 40-80 86 0 52 42 110 80 110s80-58 80-110c0-46-30-86-80-86z"/><path d="m120 234-8 14h36l-8-14z"/><ellipse cx="96" cy="94" rx="14" ry="26" fill="#fff" fill-opacity=".35" transform="rotate(25 96 94)"/></g>
  <g class="art-balloon art-c"><path d="M276 30c-48 0-76 38-76 82 0 50 40 116 76 116s76-66 76-116c0-44-28-82-76-82z"/><path d="m266 226-8 14h36l-8-14z"/><ellipse cx="246" cy="80" rx="13" ry="24" fill="#fff" fill-opacity=".35" transform="rotate(25 246 80)"/></g>
  <g class="art-balloon art-b"><path d="M200 0c-52 0-84 42-84 90 0 54 44 106 84 106s84-52 84-106C284 42 252 0 200 0z"/><path d="m190 194-8 14h36l-8-14z"/><ellipse cx="164" cy="56" rx="15" ry="27" fill="#fff" fill-opacity=".35" transform="rotate(25 164 56)"/></g>
  <g class="art-stars"><path d="M44 300l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"/><path d="M346 290l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/><circle cx="330" cy="370" r="7"/><circle cx="76" cy="378" r="5"/></g>
</svg>`;

// --- home page sections ---------------------------------------------------------------------

function heroSection(settings, ctx) {
  const h = settings.hero;
  const t = settings.theme;
  const img = h.image ? `<img src="${esc(ctx.img(h.image))}" alt="${esc(T(ctx, h.imageAlt))}" fetchpriority="high">` : '';
  const cover = h.layout === 'cover' && img;
  const media = cover ? '' : `<div class="hero-media${img ? ` shape-${h.imageShape}` : ''}"${ctx.preview ? ' data-edit="hero.image" title="Kliknite za urejanje"' : ''}>${img || HERO_ART}</div>`;
  const badge = T(ctx, h.badge);
  const text = T(ctx, h.text);
  const actions = [btn(settings, ctx, h.primary, 'hero.primary', 'btn-primary btn-lg'), btn(settings, ctx, h.secondary, 'hero.secondary', 'btn-ghost btn-lg')].filter(Boolean);
  return `<section class="hero hero-${cover ? 'cover' : h.layout}" id="top">
  ${cover ? `<div class="hero-cover" aria-hidden="true">${img.replace('<img ', '<img class="hero-cover-img" ')}</div>` : ''}
  ${cover ? '' : decoration(t.decoration)}
  <div class="container hero-inner">
    <div class="hero-copy">
      ${badge ? `<p class="hero-badge"${ed(ctx, 'hero.badge', h.badge)}>${esc(badge)}</p>` : ''}
      <h1 class="hero-title"${ed(ctx, 'hero.title', h.title)}>${esc(T(ctx, h.title))}</h1>
      ${text ? `<div class="hero-text"${ed(ctx, 'hero.text', h.text)}>${markdown(text, { base: ctx.base })}</div>` : ''}
      ${actions.length ? `<div class="hero-actions">${actions.join('')}</div>` : ''}
    </div>
    ${media}
  </div>
</section>`;
}

function servicesContent(settings, ctx) {
  const sv = settings.services;
  const contact = isVisible(settings, 'contact') && settings.form.provider !== 'none';
  const items = sv.items
    .map((s, i) => [s, i])
    .filter(([s]) => T(ctx, s.title))
    .map(([s, i]) => {
      const p = `services.items.${i}`;
      const media = s.image
        ? `<div class="card-media"><img src="${esc(ctx.img(s.image))}" alt="" loading="lazy" decoding="async"></div>`
        : s.icon
          ? `<span class="icon-bubble">${serviceIcon(s.icon, 'icon icon-lg')}</span>`
          : '';
      const ask =
        sv.showInquiry && contact
          ? `<a class="link-arrow" href="${esc(sectionHref(ctx, 'contact'))}" data-service="${esc(T(ctx, s.title))}">${esc(ui('inquire', ctx.lang))} ${uiIcon('arrow', 'icon icon-sm')}</a>`
          : '';
      return `<li class="card service-card${s.image ? ' has-media' : ''}">
        ${media}
        <h3 class="card-title"${ed(ctx, `${p}.title`, s.title)}>${esc(T(ctx, s.title))}</h3>
        ${T(ctx, s.text) ? `<p${ed(ctx, `${p}.text`, s.text)}>${esc(T(ctx, s.text))}</p>` : ''}
        ${ask}
      </li>`;
    });
  return items.length ? `<ul class="card-grid services">${items.join('')}</ul>` : '';
}

function stepsContent(settings, ctx) {
  const items = settings.steps.items
    .map((s, i) => [s, i])
    .filter(([s]) => T(ctx, s.title))
    .map(
      ([s, i], n) => `<li class="step">
        <span class="step-num" aria-hidden="true">${n + 1}</span>
        ${s.icon ? `<span class="icon-bubble">${serviceIcon(s.icon, 'icon icon-lg')}</span>` : ''}
        <h3 class="card-title"${ed(ctx, `steps.items.${i}.title`, s.title)}>${esc(T(ctx, s.title))}</h3>
        ${T(ctx, s.text) ? `<p${ed(ctx, `steps.items.${i}.text`, s.text)}>${esc(T(ctx, s.text))}</p>` : ''}
      </li>`
    );
  return items.length ? `<ol class="steps">${items.join('')}</ol>` : '';
}

function packagesContent(settings, ctx) {
  const pk = settings.packages;
  const contact = isVisible(settings, 'contact') && settings.form.provider !== 'none';
  const items = pk.items
    .map((p, i) => [p, i])
    .filter(([p]) => T(ctx, p.name))
    .map(([p, i]) => {
      const path = `packages.items.${i}`;
      const features = T(ctx, p.features)
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
      const price = T(ctx, p.price);
      const badge = p.highlight && T(ctx, p.badge) ? `<p class="package-badge"${ed(ctx, `${path}.badge`, p.badge)}>${esc(T(ctx, p.badge))}</p>` : '';
      return `<article class="card package${p.highlight ? ' is-featured' : ''}">
        ${badge}
        <h3 class="card-title"${ed(ctx, `${path}.name`, p.name)}>${esc(T(ctx, p.name))}</h3>
        <p class="package-price"${ed(ctx, `${path}.price`, p.price)}>${esc(price || ui('priceOnRequest', ctx.lang))}</p>
        ${T(ctx, p.duration) ? `<p class="package-duration"${ed(ctx, `${path}.duration`, p.duration)}>${uiIcon('clock', 'icon icon-sm')}<span>${esc(T(ctx, p.duration))}</span></p>` : ''}
        ${features.length ? `<ul class="package-features"${ed(ctx, `${path}.features`, p.features)}>${features.map((f) => `<li>${uiIcon('check', 'icon icon-sm')}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
        ${contact ? `<a class="btn ${p.highlight ? 'btn-primary' : 'btn-ghost'}" href="${esc(sectionHref(ctx, 'contact'))}" data-service="${esc(T(ctx, p.name))}">${esc(T(ctx, pk.buttonLabel))}</a>` : ''}
      </article>`;
    });
  if (!items.length) return '';
  const note = T(ctx, pk.note);
  return `<div class="card-grid packages">${items.join('')}</div>
    ${note ? `<div class="section-note prose"${ed(ctx, 'packages.note', pk.note)}>${markdown(note, { base: ctx.base })}</div>` : ''}`;
}

function scheduleContent(settings, ctx) {
  const sc = settings.schedule;
  const items = sc.items
    .map((s, i) => [s, i])
    .filter(([s]) => T(ctx, s.title))
    .map(([s, i]) => {
      const p = `schedule.items.${i}`;
      const day = s.day === 'custom' ? T(ctx, s.when) : WEEKDAYS[ctx.lang][DAYS.indexOf(s.day)];
      return `<li class="card schedule-row">
        <div class="schedule-when">${day ? `<strong${s.day === 'custom' ? ed(ctx, `${p}.when`, s.when) : ''}>${esc(day)}</strong>` : ''}${s.time ? `<span>${esc(s.time)}</span>` : ''}</div>
        <div class="schedule-info">
          <h3 class="card-title"${ed(ctx, `${p}.title`, s.title)}>${esc(T(ctx, s.title))}</h3>
          ${T(ctx, s.place) ? `<p class="schedule-place"${ed(ctx, `${p}.place`, s.place)}>${uiIcon('pin', 'icon icon-sm')}<span>${esc(T(ctx, s.place))}</span></p>` : ''}
          ${T(ctx, s.note) ? `<p class="schedule-note"${ed(ctx, `${p}.note`, s.note)}>${esc(T(ctx, s.note))}</p>` : ''}
        </div>
      </li>`;
    });
  if (!items.length) return '';
  const note = T(ctx, sc.note);
  return `<ul class="schedule">${items.join('')}</ul>
    ${note ? `<div class="section-note prose"${ed(ctx, 'schedule.note', sc.note)}>${markdown(note, { base: ctx.base })}</div>` : ''}`;
}

function aboutContent(settings, ctx) {
  const a = settings.about;
  const text = T(ctx, a.text);
  const stats = a.stats.filter((x) => x.value && T(ctx, x.label));
  if (!text && !a.photo && !stats.length) return '';
  return `<div class="about${a.photo ? ' has-photo' : ''}">
      ${a.photo ? `<div class="about-media shape-${a.photoShape}"><img src="${esc(ctx.img(a.photo))}" alt="${esc(T(ctx, a.photoAlt))}" loading="lazy" decoding="async"></div>` : ''}
      <div class="about-copy">
        ${text ? `<div class="prose"${ed(ctx, 'about.text', a.text)}>${markdown(text, { base: ctx.base })}</div>` : ''}
        ${stats.length ? `<ul class="stats">${stats.map((x) => `<li><strong>${esc(x.value)}</strong><span>${esc(T(ctx, x.label))}</span></li>`).join('')}</ul>` : ''}
      </div>
    </div>`;
}

function galleryContent(settings, ctx) {
  const g = settings.gallery;
  const images = g.images.filter((i) => i.src);
  if (!images.length) {
    return ctx.preview ? `<p class="preview-empty" data-edit="gallery.images" title="Kliknite za urejanje">Galerija je prazna. Na spletni strani se ta razdelek ne prikaže, dokler ne dodate slik.</p>` : '';
  }
  return `<ul class="gallery gallery-${g.layout}" data-gallery>${images
    .map(
      (i) =>
        `<li><a href="${esc(ctx.img(i.src))}" data-lightbox aria-label="${esc(ui('enlarge', ctx.lang))}${T(ctx, i.alt) ? `: ${esc(T(ctx, i.alt))}` : ''}"><img src="${esc(ctx.img(i.src))}" alt="${esc(T(ctx, i.alt))}" loading="lazy" decoding="async"></a></li>`
    )
    .join('')}</ul>`;
}

function stars(n, lang) {
  return `<p class="stars" role="img" aria-label="${esc(ui('rating', lang, { n }))}">${Array.from({ length: 5 }, (_, i) => `<svg class="icon${i < n ? ' is-on' : ''}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${STAR}</svg>`).join('')}</p>`;
}

function testimonialsContent(settings, ctx) {
  const r = settings.testimonials;
  const items = r.items
    .map((x, i) => [x, i])
    .filter(([x]) => T(ctx, x.quote));
  if (!items.length) {
    return ctx.preview ? `<p class="preview-empty" data-edit="testimonials.items" title="Kliknite za urejanje">Tukaj bodo mnenja staršev. Na spletni strani se razdelek ne prikaže, dokler jih ne dodate.</p>` : '';
  }
  return `<div class="card-grid testimonials">${items
    .map(
      ([x, i]) => `<figure class="card testimonial">
        ${r.showStars && x.rating ? stars(x.rating, ctx.lang) : ''}
        <blockquote${ed(ctx, `testimonials.items.${i}.quote`, x.quote)}>${markdown(T(ctx, x.quote), { base: ctx.base })}</blockquote>
        ${x.name || T(ctx, x.detail) ? `<figcaption>${x.name ? `<strong>${esc(x.name)}</strong>` : ''}${T(ctx, x.detail) ? `<span>${esc(T(ctx, x.detail))}</span>` : ''}</figcaption>` : ''}
      </figure>`
    )
    .join('')}</div>`;
}

function faqContent(settings, ctx) {
  const items = settings.faq.items
    .map((x, i) => [x, i])
    .filter(([x]) => T(ctx, x.q));
  return items.length
    ? `<div class="faq">${items
        .map(
          ([x, i]) => `<details class="faq-item card">
        <summary><span${ed(ctx, `faq.items.${i}.q`, x.q)}>${esc(T(ctx, x.q))}</span>${uiIcon('down', 'icon faq-chevron')}</summary>
        <div class="prose"${ed(ctx, `faq.items.${i}.a`, x.a)}>${markdown(T(ctx, x.a), { base: ctx.base })}</div>
      </details>`
        )
        .join('')}</div>`
    : '';
}

function formField(settings, ctx, id) {
  const f = settings.form.fields[id];
  if (!f.show) return '';
  const label = T(ctx, f.label) || FIELD_LABELS[id][ctx.lang];
  const name = FIELD_KEYS[id];
  const fid = `f-${id}`;
  const req = f.required ? ' required' : '';
  const reqMark = f.required ? ` <span class="req" aria-hidden="true">*</span>` : '';
  const placeholder = FIELD_PLACEHOLDERS[id] ? ` placeholder="${esc(FIELD_PLACEHOLDERS[id][ctx.lang])}"` : '';
  const wide = ['name', 'location', 'service', 'message'].includes(id) ? ' field-wide' : '';
  let control;
  switch (id) {
    case 'message':
      control = `<textarea class="input" id="${fid}" name="${name}" rows="4" maxlength="3000"${placeholder}${req}></textarea>`;
      break;
    case 'service': {
      const opt = (v) => `<option>${esc(v)}</option>`;
      const services = settings.services.items.map((s) => T(ctx, s.title)).filter(Boolean);
      const packages = isVisible(settings, 'packages') ? settings.packages.items.map((p) => T(ctx, p.name)).filter(Boolean) : [];
      const group = (label, list) => (list.length ? `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>` : '');
      control = `<select class="input" id="${fid}" name="${name}"${req}>
          <option value="">${esc(ui('chooseService', ctx.lang))}</option>
          ${packages.length ? group(T(ctx, settings.sections.find((s) => s.id === 'services').heading), services) + group(T(ctx, settings.sections.find((s) => s.id === 'packages').heading), packages) : services.map(opt).join('')}
          <option>${esc(ui('otherService', ctx.lang))}</option>
        </select>`;
      break;
    }
    default: {
      const types = { email: 'email', phone: 'tel', date: 'date', time: 'time', children: 'number' };
      const auto = { name: 'name', email: 'email', phone: 'tel' };
      const extra = id === 'children' ? ' min="1" max="200" inputmode="numeric"' : id === 'email' ? ' autocapitalize="off" spellcheck="false"' : '';
      control = `<input class="input" id="${fid}" name="${name}" type="${types[id] ?? 'text'}"${auto[id] ? ` autocomplete="${auto[id]}"` : ' autocomplete="off"'} maxlength="200"${extra}${placeholder}${req}>`;
    }
  }
  return `<div class="field${wide}" data-field="${id}">
        <label class="field-label" for="${fid}"${ed(ctx, `form.fields.${id}.label`, f.label)}>${esc(label)}${reqMark}</label>
        ${control}
        <p class="field-error" data-error hidden></p>
      </div>`;
}

function inquiryForm(settings, ctx) {
  const fm = settings.form;
  const p = ctx.provider;
  if (fm.provider === 'none') return '';
  if (!p.ready && !ctx.preview) return `<div class="card form-closed"><p>${esc(ui('formClosed', ctx.lang))}</p></div>`;
  const privacyLink = `<a href="${esc(ctx.url(pagePath('privacy', ctx.lang)))}">${esc(ui('privacyInSentence', ctx.lang))}</a>`;
  const note = esc(T(ctx, fm.privacyNote)).replace('{privacy}', privacyLink);
  const hidden = Object.entries(p.ready ? p.hidden : {})
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join('');
  const msgs = ['errRequired', 'errEmail', 'errPhone', 'errContact', 'errDate', 'errTooMany', 'errNetwork', 'sending']
    .map((k) => ` data-msg-${k.replace(/^err/, '').toLowerCase()}="${esc(ui(k, ctx.lang))}"`)
    .join('');
  const action = p.ready ? p.action : '#';
  const mailto = p.responds === 'mailto';
  return `<form class="card inquiry-form" method="post" action="${esc(action)}"${mailto ? ' enctype="text/plain"' : ''} accept-charset="utf-8" data-inquiry data-responds="${p.ready ? p.responds : 'none'}" data-require-contact="${fm.requireContact}" data-subject="${esc(`${ui('mailtoSubject', ctx.lang)} (${settings.site.name})`)}"${msgs}>
      ${hidden}
      <input type="hidden" name="_subject" value="${esc(`${ui('mailtoSubject', ctx.lang)} (${settings.site.name})`)}">
      <input type="hidden" name="jezik" value="${LANG_INFO[ctx.lang].name}">
      <div class="form-grid">
      ${FORM_FIELDS.map((id) => formField(settings, ctx, id)).join('')}
      </div>
      <div class="hp-field" aria-hidden="true">
        <label for="f-website">${esc(ui('honeypot', ctx.lang))}</label>
        <input id="f-website" type="text" name="website" tabindex="-1" autocomplete="off" data-honeypot>
      </div>
      ${note ? `<p class="form-note"${ed(ctx, 'form.privacyNote', fm.privacyNote)}>${note}</p>` : ''}
      ${mailto ? `<p class="form-note">${esc(ui('mailtoNote', ctx.lang))}</p>` : ''}
      <button class="btn btn-primary btn-lg btn-submit" type="submit"${ed(ctx, 'form.buttonLabel', fm.buttonLabel)}>${uiIcon('send')}<span class="btn-label">${esc(T(ctx, fm.buttonLabel))}</span></button>
      <p class="form-status" role="status" aria-live="polite" data-status></p>
    </form>
    <div class="card form-success" data-success${ctx.previewSuccess ? '' : ' hidden'} tabindex="-1">
      <span class="icon-bubble">${uiIcon('check', 'icon icon-lg')}</span>
      <h3 class="card-title" data-success-title${ed(ctx, 'form.successTitle', fm.successTitle)}>${esc(T(ctx, fm.successTitle))}</h3>
      <div class="prose" data-success-body${ed(ctx, 'form.successBody', fm.successBody)}>${markdown(T(ctx, fm.successBody), { base: ctx.base })}</div>
      ${mailto ? `<template data-mailto-title>${esc(ui('mailtoDoneTitle', ctx.lang))}</template><template data-mailto-body>${esc(ui('mailtoDoneBody', ctx.lang))}</template>` : ''}
    </div>`;
}

function contactContent(settings, ctx) {
  const c = settings.contact;
  const digits = phoneDigits(c.phone);
  const buttons = [
    digits ? `<a class="btn btn-primary" href="tel:+${digits}">${uiIcon('phone')}<span>${esc(c.phone)}</span></a>` : '',
    digits && c.whatsapp ? `<a class="btn btn-ghost btn-whatsapp" href="https://wa.me/${digits}" rel="noopener" target="_blank">${brandIcon('whatsapp')}<span>WhatsApp</span></a>` : '',
    digits && c.viber ? `<a class="btn btn-ghost btn-viber" href="viber://chat?number=%2B${digits}">${brandIcon('viber')}<span>Viber</span></a>` : '',
    c.email ? `<a class="btn btn-ghost" href="mailto:${esc(c.email)}">${uiIcon('mail')}<span>${esc(c.email)}</span></a>` : '',
  ].filter(Boolean);
  const details = [
    T(ctx, c.area) ? [ui('area', ctx.lang), `<span${ed(ctx, 'contact.area', c.area)}>${esc(T(ctx, c.area))}</span>`, 'pin'] : null,
    c.address ? [ui('address', ctx.lang), esc(c.address).replace(/\n/g, '<br>'), 'pin'] : null,
    T(ctx, c.hours) ? [ui('hours', ctx.lang), `<span${ed(ctx, 'contact.hours', c.hours)}>${esc(T(ctx, c.hours)).replace(/\n/g, '<br>')}</span>`, 'clock'] : null,
  ].filter(Boolean);
  const info =
    buttons.length || details.length || c.mapUrl
      ? `<div class="contact-info">
      ${buttons.length ? `<div class="contact-buttons">${buttons.join('')}</div>` : ''}
      ${details.length ? `<dl class="contact-details">${details.map(([dt, dd, icon]) => `<div>${uiIcon(icon)}<dt>${esc(dt)}</dt><dd>${dd}</dd></div>`).join('')}</dl>` : ''}
      ${c.mapUrl ? `<p><a class="link-arrow" href="${esc(c.mapUrl)}" rel="noopener" target="_blank">${esc(ui('map', ctx.lang))} ${uiIcon('arrow', 'icon icon-sm')}</a></p>` : ''}
      ${socialLinks(settings, ctx, 'socials')}
    </div>`
      : ctx.preview
        ? `<div class="contact-info"><p class="preview-empty" data-edit="contact.phone" title="Kliknite za urejanje">Tu se prikažejo telefon, WhatsApp, Viber in e-pošta, ko jih vpišete.</p></div>`
        : '';
  const form = inquiryForm(settings, ctx);
  if (!info && !form) return '';
  return `<div class="contact${form && info ? ' has-form' : ''}">
      ${info}
      ${form ? `<div class="contact-form">${form}</div>` : ''}
    </div>`;
}

const CONTENT = {
  services: servicesContent,
  steps: stepsContent,
  packages: packagesContent,
  schedule: scheduleContent,
  about: aboutContent,
  gallery: galleryContent,
  testimonials: testimonialsContent,
  faq: faqContent,
  contact: contactContent,
};

/** Whether a section has anything to show (empty sections are left out of the page and the menu). */
function sectionHasContent(settings, ctx, id) {
  if (ctx.preview) return true;
  const c = { ...ctx, preview: false };
  return Boolean(CONTENT[id](settings, c));
}

function homePage(settings, ctx) {
  let n = 0;
  const sections = settings.sections
    .map((s, index) => {
      if (!s.enabled) return '';
      const content = CONTENT[s.id](settings, ctx);
      if (!content) return '';
      const alt = settings.theme.alternate && n++ % 2 === 0;
      const id = anchor(s.id, ctx.lang);
      const intro = T(ctx, s.intro);
      return `<section class="section section-${s.id}${alt ? ' is-alt' : ''}" id="${id}" aria-labelledby="${id}-title">
  ${settings.theme.divider !== 'none' ? '<div class="divider" aria-hidden="true"></div>' : ''}
  <div class="container">
    <header class="section-head">
      <h2 class="section-title" id="${id}-title"${ed(ctx, `sections.${index}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
      ${intro ? `<p class="section-intro"${ed(ctx, `sections.${index}.intro`, s.intro)}>${esc(intro)}</p>` : ''}
    </header>
    ${content}
  </div>
</section>`;
    })
    .filter(Boolean);
  return [heroSection(settings, ctx), ...sections].join('\n');
}

// --- other pages ----------------------------------------------------------------------

function simplePage(title, body, cls = '', editAttrs = '') {
  return `<section class="page ${cls}">
  <div class="container narrow">
    <h1 class="page-title"${editAttrs}>${esc(title)}</h1>
    ${body}
  </div>
</section>`;
}

function termsPage(settings, ctx) {
  const t = settings.terms;
  return simplePage(T(ctx, t.title), `<div class="prose"${ed(ctx, 'terms.body', t.body)}>${markdown(T(ctx, t.body), { base: ctx.base })}</div>`, 'page-legal', ed(ctx, 'terms.title', t.title));
}

function thanksPage(settings, ctx) {
  const t = settings.thanks;
  return `<section class="page page-center">
  <div class="container narrow">
    <span class="icon-bubble icon-bubble-lg">${uiIcon('check', 'icon icon-xl')}</span>
    <h1 class="page-title"${ed(ctx, 'thanks.title', t.title)}>${esc(T(ctx, t.title))}</h1>
    <div class="prose lead"${ed(ctx, 'thanks.body', t.body)}>${markdown(T(ctx, t.body), { base: ctx.base })}</div>
    <p class="actions"><a class="btn btn-primary" href="${esc(ctx.url(pagePath('home', ctx.lang)))}">${esc(ui('backHome', ctx.lang))}</a></p>
  </div>
</section>`;
}

/** One 404 page for the whole site, in every language, because the server doesn't know which one was meant. */
function notFoundPage(settings, ctx) {
  const langs = ctx.langs;
  return `<section class="page page-center">
  <div class="container narrow">
    <span class="icon-bubble icon-bubble-lg">${uiIcon('hourglass', 'icon icon-xl')}</span>
    ${langs
      .map(
        (l, i) => `<div class="notfound" lang="${l}">
      ${i === 0 ? `<h1 class="page-title">${esc(ui('notFoundTitle', l))}</h1>` : `<h2>${esc(ui('notFoundTitle', l))}</h2>`}
      <p>${esc(ui('notFoundText', l))} <a href="${esc(ctx.url(pagePath('home', l)))}">${esc(ui('backHome', l))}</a></p>
    </div>`
      )
      .join('\n')}
  </div>
</section>`;
}

// --- public API -------------------------------------------------------------------------

function context(settings, page, lang, opts) {
  const base = opts.base ?? basePath(settings.site.url);
  const now = opts.now ?? new Date();
  return {
    page,
    lang,
    base,
    url: (path) => base + path,
    img: opts.resolveImage ?? ((src) => base + src),
    preview: Boolean(opts.preview),
    previewSuccess: Boolean(opts.previewSuccess),
    provider: resolveProvider(settings.form, settings.contact.email),
    // The preview offers every language so the owner can translate before switching one on.
    langs: opts.preview ? ['sl', 'en', 'sh'] : enabledLangs(settings),
    version: opts.version ?? '',
    themeHref: opts.themeHref,
    year: now.getUTCFullYear(),
    now,
  };
}

/** Render one page to an HTML string (also used for the admin preview). Unknown ids render the 404 page. */
export function renderPage(settings, pageId, lang = 'sl', opts = {}) {
  const info = pageInfo(settings, pageId, lang) ?? pageInfo(settings, 'notfound', 'sl');
  const ctx = context(settings, info.id, info.id === 'notfound' ? 'sl' : lang, opts);
  const bodies = {
    home: () => homePage(settings, ctx),
    privacy: () => simplePage(ui('privacyPolicy', ctx.lang), privacyBody(settings, ctx.lang, ctx), 'page-legal'),
    terms: () => termsPage(settings, ctx),
    thanks: () => thanksPage(settings, ctx),
    notfound: () => notFoundPage(settings, ctx),
  };
  return layout(settings, ctx, info, bodies[info.id]());
}

/** Extra CSS variables for theme.css that come from outside the theme settings. */
export const themeExtras = (settings) => ({ textStyles: settings.textStyles, heroOverlay: settings.hero.overlay, logoHeight: settings.header.logoHeight });

/** Render every generated file of the site: { "path/in/dist": "contents" }. */
export function renderSite(settings, opts = {}) {
  const s = settings;
  const base = opts.base ?? basePath(s.site.url);
  const files = {};
  const pages = livePages(s);
  for (const [id, lang] of pages) files[pageInfo(s, id, lang).file] = renderPage(s, id, lang, opts);

  files['assets/css/theme.css'] = themeCss(s.theme, { fontBase: `${base}/assets/fonts/`, ...themeExtras(s) });
  files['assets/img/favicon.svg'] = faviconSvg(s.theme.colors);

  const today = (opts.now ?? new Date()).toISOString().slice(0, 10);
  const langs = enabledLangs(s);
  const urls = pages
    .filter(([id]) => id === 'home' || id === 'privacy' || id === 'terms')
    .map(([id, lang]) => {
      const alts = langs.length > 1 ? langs.map((l) => `<xhtml:link rel="alternate" hreflang="${LANG_INFO[l].hreflang[0]}" href="${esc(s.site.url + pagePath(id, l))}"/>`).join('') : '';
      return `  <url><loc>${esc(s.site.url + pagePath(id, lang))}</loc><lastmod>${today}</lastmod>${alts}</url>`;
    });
  files['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  // Search engines only read robots.txt at the root of a domain, so this one matters once the site has its own.
  files['robots.txt'] = s.seo.indexable ? `User-agent: *\nAllow: /\nDisallow: ${base}/admin/\n\nSitemap: ${s.site.url}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n';

  files['site.webmanifest'] = JSON.stringify(
    {
      name: s.site.name,
      short_name: s.site.name,
      description: tr(s.seo.description, 'sl'),
      start_url: `${base}/`,
      display: 'browser',
      background_color: s.theme.colors.bg,
      theme_color: s.theme.colors.bg,
      icons: [s.theme.favicon ? { src: base + s.theme.favicon, sizes: 'any' } : { src: `${base}/assets/img/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }],
    },
    null,
    2
  );
  return files;
}
