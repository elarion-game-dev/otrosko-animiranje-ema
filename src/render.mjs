// Renders every public page from the settings object. Used by the build (Node) and by the admin's live
// preview (browser), so what the owner sees in the preview is exactly what gets published.
//
// The design is "Vabilo": the page is an invitation suite. The hero is an invitation card, the programme a
// menu card, packages are place cards, the sports classes a ticket, reviews thank-you notes and the booking
// form an RSVP card. Cream bands with scalloped edges alternate with white paper; each band draws its own
// edges, so sections can be switched off and reordered freely.
//
// Every page exists once per language. Slovenian lives at the site root, the others under /en/ and /sh/.
// All links start with the site's base path ("/otrosko-animiranje-ema" on GitHub Pages, "" on a domain).
// No inline styles anywhere (the Content Security Policy forbids them): variants are classes in site.css.

import { flagIcons, flagSprite } from './flags.mjs';
import { brandIcon, faviconSvg, illustration, rainbowMark, serviceIcon, uiIcon } from './icons.mjs';
import { AGES, ANCHORS, FORM_KEYS, ft, LANG_INFO, LANGS, pagePath, ui, WEEKDAYS_ON } from './i18n.mjs';
import { inline, markdown } from './markdown.mjs';
import { privacyBody } from './policy.mjs';
import { resolveProvider } from './providers.mjs';
import { DAYS, enabledLangs, formTopics, isVisible, SECTION_IDS, SOCIAL_PLATFORMS, termsLive } from './settings.mjs';
import { preloadFont, themeCss } from './themes.mjs';
import { basePath, esc, phoneDigits, tr } from './util.mjs';

export { faviconSvg };

// --- small helpers -----------------------------------------------------------------

/**
 * Slovenian typesetting: a one-letter word (v, z, s, k, o, a, i, u) never ends a line, and a number stays
 * with the word after it ("10 otrok", "150 €"). Applied to everything the visitor reads.
 */
export function typo(text) {
  const once = (s) => s.replace(/(^|[\s(„"])([vzskoaiuVZSKOAIU]) /g, '$1$2\u00A0');
  return once(once(String(text ?? ''))).replace(/(\d) (?=[^\s\d])/g, '$1\u00A0');
}

/** A text in the page's language, typeset for reading. */
const T = (ctx, field) => typo(tr(field, ctx.lang));
/** The same text as typed, for values sent with the form. */
const raw = (ctx, field) => tr(field, ctx.lang).trim();
const cap = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);

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

/** Link for a home page section: just "#rezervacija" on the home page, the full address elsewhere. */
function sectionHref(ctx, id) {
  const hash = `#${anchor(id, ctx.lang)}`;
  return ctx.page === 'home' ? hash : `${ctx.url(pagePath('home', ctx.lang))}${hash}`;
}

/** Whether the booking form is on the page (a "Check a date" button can land on it). */
function canBook(settings) {
  return isVisible(settings, 'contact') && settings.form.provider !== 'none';
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
  if (target === 'phone') return uiIcon('phone', 'i');
  if (target === 'whatsapp' || target === 'viber') return brandIcon(target, 'i');
  if (target === 'email') return uiIcon('mail', 'i');
  return '';
}

/** A button from the settings ({ label, target, url }). Buttons to the booking form preset the party topic. */
function btn(settings, ctx, b, path, cls, { arrow = false } = {}) {
  const href = targetHref(settings, ctx, b.target, b.url);
  const label = T(ctx, b.label);
  if (!label || !href) return ctx.preview && label ? `<span class="btn ${cls} is-placeholder"${ed(ctx, `${path}.label`, b.label)}>${esc(label)}</span>` : '';
  const topic = b.target === 'contact' ? ' data-topic="party"' : '';
  return `<a class="btn ${cls}" href="${esc(href)}"${external(href)}${topic}${ed(ctx, `${path}.label`, b.label)}>${targetIcon(b.target)}<span>${esc(label)}</span>${arrow ? uiIcon('arrow', 'i i-arrow') : ''}</a>`;
}

/** A section's kicker, heading and intro, either centred above the content or as a sticky side column. */
function sectionHead(ctx, s, index, { side = false, extra = '', introHtml } = {}) {
  const id = anchor(s.id, ctx.lang);
  const kicker = T(ctx, s.kicker);
  const intro = introHtml ?? (T(ctx, s.intro) ? esc(T(ctx, s.intro)) : '');
  const p = `sections.${index}`;
  return `<${side ? 'div class="side-head"' : 'header class="sec-head"'} data-reveal>
      ${kicker ? `<span class="kicker"${ed(ctx, `${p}.kicker`, s.kicker)}>${esc(kicker)}</span>` : ''}
      <h2 class="section-title" id="${id}-title"${ed(ctx, `${p}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
      ${intro ? `<p class="sub"${ed(ctx, `${p}.intro`, s.intro)}>${intro}</p>` : ''}
      ${extra}
    </${side ? 'div' : 'header'}>`;
}

/** A list of stamps: short lines with an icon, like rubber stamps on the stationery. */
function stamps(ctx, items, path, cls = 'stamps') {
  const rows = items.map((x, i) => [x, i]).filter(([x]) => T(ctx, x.text));
  if (!rows.length) return '';
  return `<ul class="${cls}">${rows
    .map(([x, i]) => `<li class="stamp"${ed(ctx, `${path}.${i}.text`, x.text)}>${x.icon ? serviceIcon(x.icon, 'i') : ''}<span>${esc(T(ctx, x.text))}</span></li>`)
    .join('')}</ul>`;
}

/** A photo, or a soft illustration with a "Photo" tag (the tag only in the admin preview) until one is uploaded. */
function photo(ctx, src, alt, { ill = 'balloons', tone = 'coral', eager = false, mono = '' } = {}) {
  if (src) return `<div class="ph"><img src="${esc(ctx.img(src))}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;
  const art = mono ? `<span class="mono" aria-hidden="true">${esc(mono)}</span>` : illustration(ill);
  return `<div class="ph ph--empty ph--${tone}">${art}${ctx.preview ? `<span class="tag">${uiIcon('camera', 'i')}${esc(ui('photo', ctx.lang))}</span>` : ''}</div>`;
}

const editImage = (ctx, path) => (ctx.preview ? ` data-edit="${esc(path)}" title="Kliknite za urejanje"` : '');

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
    if (termsLive(settings)) pages.push(['terms', lang]);
  }
  pages.push(['notfound', 'sl']);
  return pages;
}

/** Every page the admin can preview, including ones that are switched off on the live site. */
export function previewPages(settings) {
  return [...PAGE_IDS, 'notfound'].map((id) => ({ id, label: PAGE_LABELS[id], hidden: id === 'terms' && !termsLive(settings) }));
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

/** The site name as a wordmark. Long names set the last word large: "Otroško animiranje / Ema". */
function wordmark(name) {
  const words = name.trim().split(/\s+/);
  if (name.length > 14 && words.length > 1) return `<span class="logo-name is-split"><small>${esc(words.slice(0, -1).join(' '))}</small>${esc(words.at(-1))}</span>`;
  return `<span class="logo-name">${esc(name)}</span>`;
}

function brand(settings, ctx, cls = 'logo') {
  const h = settings.header;
  const mark = h.logo ? `<img class="logo-img" src="${esc(ctx.img(h.logo))}" alt="${h.showName ? '' : esc(settings.site.name)}">` : rainbowMark('logo-mark');
  const name = h.showName || !h.logo ? wordmark(settings.site.name) : '';
  return `<a class="${cls}" href="${esc(ctx.url(pagePath('home', ctx.lang)))}">${mark}${name}<span class="sr-only">, ${esc(ui('home', ctx.lang))}</span></a>`;
}

const langFlags = (settings, l) => (l === 'sh' ? settings.languages.sh.flags : LANG_INFO[l].flags);
const langName = (settings, l) => (l === 'sl' ? LANG_INFO.sl.name : settings.languages[l].label);
const langShort = (settings, l) => (l === 'sl' ? LANG_INFO.sl.short : settings.languages[l].short);

/** Links to this page in every language: [{ l, href, current }]. */
function langLinks(ctx) {
  const target = ctx.page === 'notfound' ? 'home' : ctx.page;
  return ctx.langs.map((l) => ({ l, href: ctx.url(pagePath(target, l)), current: l === ctx.lang }));
}

const langAttrs = (l, current) => `hreflang="${l}" lang="${l}"${current ? ' aria-current="true"' : ''}`;

/** The language menu in the header: the current flag and code; opens a list of languages with their flags. */
function langSwitch(settings, ctx) {
  if (ctx.langs.length < 2) return '';
  const now = ctx.lang;
  const items = langLinks(ctx).map(
    ({ l, href, current }) =>
      `<li><a href="${esc(href)}" ${langAttrs(l, current)}>${flagIcons(langFlags(settings, l))}<span class="lang-name">${esc(langName(settings, l))}</span><small>${esc(langShort(settings, l))}</small></a></li>`
  );
  return `<details class="lang lang-switch">
        <summary>${flagIcons(langFlags(settings, now))}<span class="lang-short">${esc(langShort(settings, now))}</span><span class="sr-only">, ${esc(ui('languageNow', now, { name: langName(settings, now) }))}</span>${uiIcon('down', 'i i-chev')}</summary>
        <ul>${items.join('')}</ul>
      </details>`;
}

/** Languages as pills with flags, in the phone menu. */
function langPills(settings, ctx) {
  if (ctx.langs.length < 2) return '';
  return `<div class="lang-pills" role="group" aria-label="${esc(ui('language', ctx.lang))}">${langLinks(ctx)
    .map(({ l, href, current }) => `<a href="${esc(href)}" ${langAttrs(l, current)}>${flagIcons(langFlags(settings, l))}<span>${esc(langName(settings, l))}</span></a>`)
    .join('')}</div>`;
}

function announcement(settings, ctx) {
  const a = settings.announcement;
  if (!a.enabled || !T(ctx, a.text)) return '';
  const href = targetHref(settings, ctx, a.target, a.url);
  const label = T(ctx, a.linkLabel);
  return `<div class="announce announce-${a.style}">
  <p class="wrap">${uiIcon('megaphone', 'i')}<span${ed(ctx, 'announcement.text', a.text)}>${esc(T(ctx, a.text))}</span>${href && label ? ` <a href="${esc(href)}"${external(href)}${a.target === 'contact' ? ' data-topic="party"' : ''}>${esc(label)}${uiIcon('arrow', 'i')}</a>` : ''}</p>
</div>`;
}

/** Sections that appear in the menu: switched on, marked for the menu and with something to show. */
function menuSections(settings, ctx) {
  return settings.sections.filter((s) => s.enabled && s.inMenu && sectionHasContent(settings, ctx, s.id));
}

function header(settings, ctx) {
  const h = settings.header;
  const items = menuSections(settings, ctx).map(
    (s) => `<a class="nav-link" href="${esc(sectionHref(ctx, s.id))}"${ed(ctx, `sections.${settings.sections.indexOf(s)}.menuLabel`, s.menuLabel)}>${esc(T(ctx, s.menuLabel) || T(ctx, s.heading))}</a>`
  );
  const cta = h.cta.enabled ? btn(settings, ctx, h.cta, 'header.cta', 'btn-primary hdr-cta') : '';
  const menu = items.length || ctx.langs.length > 1 || cta;
  return `<header class="site-header${h.sticky ? ' is-sticky' : ''}" data-header>
  <div class="wrap hdr">
    ${brand(settings, ctx)}
    ${items.length ? `<nav class="nav" aria-label="${esc(ui('mainNav', ctx.lang))}">${items.join('')}</nav>` : ''}
    <div class="hdr-actions">
      ${langSwitch(settings, ctx)}
      ${cta}
      ${
        menu
          ? `<a class="menu-toggle" href="#site-menu" role="button" aria-controls="site-menu" aria-expanded="false"><span></span><span></span><span></span><b class="sr-only">${esc(ui('menu', ctx.lang))}</b></a>
      <a class="menu-close" href="#" aria-label="${esc(ui('closeMenu', ctx.lang))}">${uiIcon('close', 'i')}</a>`
          : ''
      }
    </div>
  </div>
</header>`;
}

/** The phone menu: grows out of the menu button as a cream circle (site.css), big links, languages, contact. */
function mobileMenu(settings, ctx) {
  const h = settings.header;
  const items = menuSections(settings, ctx).map((s) => `<a href="${esc(sectionHref(ctx, s.id))}">${esc(T(ctx, s.menuLabel) || T(ctx, s.heading))}</a>`);
  const cta = h.cta.enabled ? btn(settings, ctx, h.cta, 'header.cta', 'btn-primary') : '';
  const digits = phoneDigits(settings.contact.phone);
  const call = digits ? `<a class="btn btn-line" href="tel:+${digits}">${uiIcon('phone', 'i')}<span>${esc(ui('callNumber', ctx.lang, { phone: settings.contact.phone }))}</span></a>` : '';
  return `<div class="mnav" id="site-menu">
  ${items.length ? `<nav aria-label="${esc(ui('menu', ctx.lang))}">${items.join('')}</nav>` : ''}
  ${langPills(settings, ctx)}
  ${cta || call ? `<div class="mnav-contact">${cta}${call}</div>` : ''}
</div>`;
}

function businessLine(settings, ctx) {
  const b = settings.business;
  if (!settings.footer.showBusiness || !b.name) return '';
  return [
    esc(b.name),
    b.address ? esc(b.address).replace(/\n/g, ', ') : '',
    b.registration ? `${esc(ui('registration', ctx.lang))}: ${esc(b.registration)}` : '',
    b.taxNumber ? `${esc(ui('taxNumber', ctx.lang))}: ${esc(b.taxNumber)}` : '',
    b.vatId ? `${esc(ui('vatId', ctx.lang))}: ${esc(b.vatId)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function footer(settings, ctx) {
  const f = settings.footer;
  const s = settings;
  const c = s.contact;
  const digits = phoneDigits(c.phone);
  const text = T(ctx, f.text);
  const contactRows = f.showContact
    ? [
        digits ? `<li><a href="tel:+${digits}">${uiIcon('phone', 'i')}<span>${esc(c.phone)}</span></a></li>` : '',
        c.email ? `<li><a href="mailto:${esc(c.email)}">${uiIcon('mail', 'i')}<span>${esc(c.email)}</span></a></li>` : '',
        digits && c.viber ? `<li><a href="viber://chat?number=%2B${digits}">${brandIcon('viber', 'i')}<span>Viber</span></a></li>` : '',
        digits && c.whatsapp ? `<li><a href="https://wa.me/${digits}" rel="noopener" target="_blank">${brandIcon('whatsapp', 'i')}<span>WhatsApp</span></a></li>` : '',
        T(ctx, c.area) ? `<li><span class="foot-line"${ed(ctx, 'contact.area', c.area)}>${uiIcon('pin', 'i')}<span>${esc(T(ctx, c.area))}</span></span></li>` : '',
        c.address ? `<li><span class="foot-line">${uiIcon('pin', 'i')}<span>${esc(c.address).replace(/\n/g, ', ')}</span></span></li>` : '',
        c.mapUrl ? `<li><a href="${esc(c.mapUrl)}" rel="noopener" target="_blank">${uiIcon('arrow', 'i')}<span>${esc(ui('map', ctx.lang))}</span></a></li>` : '',
      ].filter(Boolean)
    : [];
  const pages = menuSections(settings, ctx).map((x) => `<li><a href="${esc(sectionHref(ctx, x.id))}">${esc(T(ctx, x.menuLabel) || T(ctx, x.heading))}</a></li>`);
  const socials = f.showSocials
    ? s.socials
        .filter((x) => x.url || ctx.preview)
        .map((x) => {
          const name = x.label || SOCIAL_PLATFORMS[x.platform] || 'Link';
          if (!x.url) return `<li><a href="#" class="is-placeholder" title="${esc(name)}: povezava še ni vpisana">${brandIcon(x.platform, 'i')}<span>${esc(name)}</span></a></li>`;
          return `<li><a href="${esc(x.url)}"${external(x.url)}>${brandIcon(x.platform, 'i')}<span>${esc(name)}</span></a></li>`;
        })
    : [];
  const legal = [
    `<a href="${esc(ctx.url(pagePath('privacy', ctx.lang)))}">${esc(ui('privacyPolicy', ctx.lang))}</a>`,
    termsLive(s) ? `<a href="${esc(ctx.url(pagePath('terms', ctx.lang)))}">${esc(T(ctx, s.terms.title))}</a>` : '',
    ...langLinks(ctx)
      .filter((x) => !x.current)
      .map(({ l, href }) => `<a href="${esc(href)}" hreflang="${l}" lang="${l}">${flagIcons(langFlags(settings, l))}${esc(langName(settings, l))}</a>`),
  ].filter(Boolean);
  const business = businessLine(settings, ctx);
  return `<footer class="site-footer">
  <div class="wrap foot">
    <div class="foot-brand">
      ${brand(settings, ctx, 'logo logo-foot')}
      ${text ? `<p${ed(ctx, 'footer.text', f.text)}>${esc(text)}</p>` : ''}
    </div>
    ${contactRows.length ? `<div><h2>${esc(ui('footContact', ctx.lang))}</h2><ul>${contactRows.join('')}</ul></div>` : ''}
    ${pages.length ? `<div><h2>${esc(ui('footPages', ctx.lang))}</h2><ul>${pages.join('')}</ul></div>` : ''}
    ${socials.length ? `<div><h2>${esc(ui('footFollow', ctx.lang))}</h2><ul aria-label="${esc(ui('social', ctx.lang))}">${socials.join('')}</ul></div>` : ''}
  </div>
  <div class="wrap foot-base">
    <p>© ${ctx.year} ${esc(s.business.name || s.site.name)}${business && business !== esc(s.business.name) ? `<span class="foot-business"> · ${business.replace(`${esc(s.business.name)} · `, '')}</span>` : ''}</p>
    <nav class="foot-links" aria-label="${esc(ui('privacyPolicy', ctx.lang))}">${legal.join('')}</nav>
  </div>
</footer>`;
}

/** Bar at the bottom of phone screens: call, Viber and "Check a date". Appears once the hero's buttons scroll away. */
function quickBar(settings, ctx) {
  const f = settings.floating;
  if (!f.enabled || ctx.page === 'notfound') return '';
  const c = settings.contact;
  const digits = phoneDigits(c.phone);
  const book = canBook(settings) ? sectionHref(ctx, 'contact') : '';
  const parts = [
    digits ? `<a class="btn icon-btn" href="tel:+${digits}">${uiIcon('phone', 'i')}<span class="sr-only">${esc(ui('call', ctx.lang))}</span></a>` : '',
    digits && c.viber ? `<a class="btn icon-btn viber" href="viber://chat?number=%2B${digits}">${brandIcon('viber', 'i')}<span class="sr-only">${esc(ui('writeViber', ctx.lang))}</span></a>` : '',
    book ? `<a class="btn btn-primary" href="${esc(book)}" data-topic="party"${ed(ctx, 'floating.label', f.label)}>${esc(T(ctx, f.label))}</a>` : '',
  ].filter(Boolean);
  return parts.length ? `<aside class="mbar" aria-label="${esc(ui('quickBar', ctx.lang))}" data-quickbar>${parts.join('')}</aside>` : '';
}

/** Structured data for search engines (schema.org), on the home page. */
function jsonLd(settings, ctx) {
  const s = settings;
  const c = s.contact;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EntertainmentBusiness',
    name: s.site.name,
    ...(s.business.name && s.business.name !== s.site.name ? { legalName: s.business.name } : {}),
    url: s.site.url + pagePath('home', ctx.lang),
    description: tr(s.seo.description, ctx.lang),
    ...(c.phone ? { telephone: `+${phoneDigits(c.phone)}` } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(s.seo.ogImage ? { image: s.site.url + s.seo.ogImage } : s.header.logo ? { image: s.site.url + s.header.logo } : {}),
    ...(s.seo.areaServed ? { areaServed: s.seo.areaServed } : {}),
    ...(s.seo.priceRange ? { priceRange: s.seo.priceRange } : {}),
    ...(s.business.taxNumber ? { taxID: s.business.taxNumber } : {}),
    ...(s.business.vatId ? { vatID: s.business.vatId } : {}),
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
  const title = home ? tr(s.seo.title, lang) : `${info.title} | ${s.site.name}`;
  const description = tr(s.seo.description, lang);
  const noindex = !s.seo.indexable || info.noindex;
  const canonical = s.site.url + info.path;
  const ogImage = s.seo.ogImage ? s.site.url + s.seo.ogImage : '';
  const v = ctx.version ? `?v=${esc(ctx.version)}` : '';
  const favicon = t.favicon ? ctx.img(t.favicon) : ctx.url(`/assets/img/favicon.svg${v}`);
  // iOS ignores SVG icons for "Add to Home Screen": an uploaded PNG icon, or the PNG the build draws.
  const touchIcon = drawnIcons(s) ? ctx.url(`/assets/img/icon-180.png${v}`) : /\.png$/i.test(t.favicon) ? ctx.img(t.favicon) : '';
  const font = ctx.preview ? '' : preloadFont(t.headingFont);
  const alternates =
    info.id === 'notfound' || ctx.langs.length < 2
      ? ''
      : ctx.langs
          .flatMap((l) => LANG_INFO[l].hreflang.map((code) => `<link rel="alternate" hreflang="${code}" href="${esc(s.site.url + pagePath(info.id, l))}">`))
          .concat(`<link rel="alternate" hreflang="x-default" href="${esc(s.site.url + pagePath(info.id, 'sl'))}">`)
          .join('\n') + '\n';
  const attrs = [`lang="${lang}"`, `data-motion="${t.animations ? 'on' : 'off'}"`, `data-edges="${t.scallops ? 'scallop' : 'plain'}"`, ctx.preview ? 'data-preview' : ''].filter(Boolean);
  const flags = ctx.langs.length > 1 ? flagSprite(ctx.langs.flatMap((l) => langFlags(s, l))) : '';

  return `<!doctype html>
<html ${attrs.join(' ')}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta property="og:image:alt" content="${esc(tr(s.seo.ogImageAlt, lang))}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="icon" href="${esc(favicon)}">
${touchIcon ? `<link rel="apple-touch-icon" href="${esc(touchIcon)}">\n` : ''}<link rel="manifest" href="${esc(ctx.url('/site.webmanifest'))}">
${font ? `<link rel="preload" href="${esc(ctx.url(`/assets/fonts/${font}`))}" as="font" type="font/woff2" crossorigin>\n` : ''}<link rel="stylesheet" href="${esc(ctx.themeHref ?? ctx.url(`/assets/css/theme.css${v}`))}">
<link rel="stylesheet" href="${esc(ctx.url(`/assets/css/site.css${v}`))}">
${ctx.preview ? '' : `<script type="module" src="${esc(ctx.url(`/assets/js/site.js${v}`))}"></script>\n`}${home ? jsonLd(s, ctx) : ''}</head>
<body class="page-${info.id}">
${flags}<a class="skip" href="#main">${esc(ui('skip', lang))}</a>
${announcement(s, ctx)}
${header(s, ctx)}
${mobileMenu(s, ctx)}
<main id="main" tabindex="-1">
${main}
</main>
${footer(s, ctx)}
${quickBar(s, ctx)}
</body>
</html>
`;
}

// --- hero: the invitation ------------------------------------------------------------------

// Bunting across the top of the hero: pennants along a curve, coloured in turn, dropping in from the middle out.
const PENNANTS = [
  'M8.9 15.3L46.5 20.7L22.1 57.6Z', 'M64.2 23.1L101.9 28.0L77.9 65.2Z', 'M119.6 30.2L157.3 34.7L133.7 72.1Z', 'M175.0 36.7L212.7 40.7L189.6 78.5Z',
  'M230.3 42.5L268.1 46.2L245.4 84.2Z', 'M285.7 47.8L323.5 51.0L301.2 89.2Z', 'M341.1 52.4L378.9 55.1L357.1 93.6Z', 'M396.4 56.3L434.3 58.7L412.9 97.4Z',
  'M451.8 59.7L489.7 61.6L468.7 100.6Z', 'M507.2 62.4L545.1 63.9L524.6 103.1Z', 'M562.5 64.5L600.5 65.6L580.4 105.0Z', 'M617.9 66.0L655.9 66.6L636.2 106.3Z',
  'M673.3 66.8L711.3 67.0L692.1 106.9Z', 'M728.7 67.0L766.7 66.8L747.9 106.9Z', 'M784.1 66.6L822.1 66.0L803.8 106.3Z', 'M839.5 65.6L877.5 64.5L859.6 105.0Z',
  'M894.9 63.9L932.8 62.4L915.4 103.1Z', 'M950.3 61.6L988.2 59.7L971.3 100.6Z', 'M1005.7 58.7L1043.6 56.3L1027.1 97.4Z', 'M1061.1 55.1L1098.9 52.4L1082.9 93.6Z',
  'M1116.5 51.0L1154.3 47.8L1138.8 89.2Z', 'M1171.9 46.2L1209.7 42.5L1194.6 84.2Z', 'M1227.3 40.7L1265.0 36.7L1250.4 78.5Z', 'M1282.7 34.7L1320.4 30.2L1306.3 72.1Z',
  'M1338.1 28.0L1375.8 23.1L1362.1 65.2Z', 'M1393.5 20.7L1431.1 15.3L1417.9 57.6Z',
];
const TONES = ['coral', 'gold', 'sage', 'sky', 'lilac'];

function garland() {
  const flags = PENNANTS.map((d, i) => `<g class="pennant f-${TONES[i % 5]} o${i <= 12 ? 13 - i : i - 13}"><path d="${d}"/></g>`).join('');
  return `<svg class="garland" viewBox="0 0 1440 124" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false"><path class="string" d="M0,14 Q720,120 1440,14"/>${flags}</svg>`;
}

/** The title with *emphasis*, each word in a span so the words can rise in one after another. */
function titleWords(text) {
  let n = 0;
  const words = (s) =>
    s
      .split(/(\s+)/)
      .map((part) => (/^\s+$/.test(part) || !part ? part : `<span class="w w${Math.min(++n, 12)}">${esc(part)}</span>`))
      .join('');
  return text
    .split(/(\*[^*]+\*)/)
    .map((seg) => (/^\*[^*]+\*$/.test(seg) ? `<em>${words(seg.slice(1, -1))}</em>` : words(seg)))
    .join('');
}

function heroSection(settings, ctx) {
  const h = settings.hero;
  const t = settings.theme;
  const badge = T(ctx, h.badge);
  const text = T(ctx, h.text);
  const details = h.details.map((d, i) => [d, i]).filter(([d]) => T(ctx, d.term) && T(ctx, d.value));
  const dateRow =
    h.showDate && canBook(settings) && formTopics(settings).includes('party') && (ctx.provider.ready || ctx.preview)
      ? `<div class="when"><dt><label for="hero-date">${esc(ui('when', ctx.lang))}</label></dt><dd><input id="hero-date" type="date" aria-describedby="hero-date-hint"><span class="sr-only" id="hero-date-hint">${esc(ui('whenHint', ctx.lang))}</span></dd></div>`
      : '';
  const actions = [btn(settings, ctx, h.primary, 'hero.primary', 'btn-primary', { arrow: true }), btn(settings, ctx, h.secondary, 'hero.secondary', 'btn-line')].filter(Boolean);
  const photos = h.photos.map((p, i) => [p, i]).filter(([p]) => p.src || ctx.preview);
  const pics = photos
    .map(([p, i], n) => {
      const caption = T(ctx, p.caption);
      return `<figure class="polaroid ${n === 0 ? 'pl-left' : 'pl-right'}"${editImage(ctx, `hero.photos.${i}.src`)}>${photo(ctx, p.src, T(ctx, p.alt), { ill: n === 0 ? 'balloons' : 'ball', tone: n === 0 ? 'coral' : 'sky', eager: true })}${
        caption ? `<figcaption${ed(ctx, `hero.photos.${i}.caption`, p.caption)}>${esc(caption)}</figcaption>` : ''
      }</figure>`;
    })
    .join('');

  return `<section class="hero${t.confetti ? ' confetti' : ''}" aria-labelledby="hero-title">
  ${t.garland ? garland() : ''}
  <div class="wrap hero-stage">
    <div class="invite">
      ${rainbowMark('mark')}
      <h1 class="hero-title" id="hero-title"${ed(ctx, 'hero.title', h.title)}>${badge ? `<span class="kicker"${ed(ctx, 'hero.badge', h.badge)}>${esc(badge)}</span> ` : ''}${titleWords(T(ctx, h.title))}</h1>
      ${text ? `<div class="sub"${ed(ctx, 'hero.text', h.text)}>${markdown(text, { base: ctx.base })}</div>` : ''}
      ${details.length || dateRow ? `<dl class="details">${details.map(([d, i]) => `<div><dt${ed(ctx, `hero.details.${i}.term`, d.term)}>${esc(T(ctx, d.term))}</dt><dd${ed(ctx, `hero.details.${i}.value`, d.value)}>${esc(T(ctx, d.value))}</dd></div>`).join('')}${dateRow}</dl>` : ''}
      ${actions.length ? `<div class="cta-row">${actions.join('')}</div>` : ''}
    </div>
    ${pics ? `<div class="hero-pics">${pics}</div>` : ''}
  </div>
</section>`;
}

// --- home page sections ---------------------------------------------------------------------

function stepsContent(settings, ctx, s, index) {
  const items = settings.steps.items.map((x, i) => [x, i]).filter(([x]) => T(ctx, x.title));
  if (!items.length) return '';
  const rows = items.map(([x, i], n) => {
    const p = `steps.items.${i}`;
    const text = T(ctx, x.text);
    return `<li class="r${(n % 5) + 1}">
        <span class="ic">${serviceIcon(x.icon, 'i') || '<span class="dot"></span>'}</span>
        <span class="what"><strong${ed(ctx, `${p}.title`, x.title)}>${esc(T(ctx, x.title))}</strong>${text ? `<span${ed(ctx, `${p}.text`, x.text)}>${esc(text)}</span>` : ''}</span>
        <span class="lead" aria-hidden="true"></span>
        ${x.time ? `<span class="time"${ed(ctx, `${p}.time`)}>${esc(x.time)}</span>` : ''}
      </li>`;
  });
  return `<div class="wrap two-col program">
    ${sectionHead(ctx, s, index, { side: true })}
    <ol class="menu" data-draw data-reveal>${rows.join('')}</ol>
  </div>`;
}

/** "od 150 €" → a small "od" before a large price. */
function priceHtml(price) {
  const m = price.match(/^(od|from|ab|već od)[\s\u00A0]+(.+)$/i);
  return m ? `<small>${esc(m[1])}</small> ${esc(m[2])}` : esc(price);
}

function packagesContent(settings, ctx, s, index) {
  const pk = settings.packages;
  const items = pk.items.map((p, i) => [p, i]).filter(([p]) => T(ctx, p.name));
  if (!items.length) return '';
  const bookable = canBook(settings) && formTopics(settings).includes('party');
  const cards = items.map(([p, i], n) => {
    const path = `packages.items.${i}`;
    const features = T(ctx, p.features)
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    const price = T(ctx, p.price);
    const badge = T(ctx, p.badge);
    const label = T(ctx, p.button) || T(ctx, pk.buttonLabel);
    return `<article class="pack t${(n % 5) + 1}${p.highlight ? ' is-featured' : ''}" data-reveal data-tilt>
        <div class="pack-top">
          ${badge ? `<p class="pack-badge"${ed(ctx, `${path}.badge`, p.badge)}>${esc(badge)}</p>` : ''}
          <h3 class="card-title"${ed(ctx, `${path}.name`, p.name)}>${esc(T(ctx, p.name))}</h3>
          ${T(ctx, p.duration) ? `<p${ed(ctx, `${path}.duration`, p.duration)}>${esc(T(ctx, p.duration))}</p>` : ''}
        </div>
        <div class="pack-body">
          <p class="price${price ? '' : ' is-request'}"${ed(ctx, `${path}.price`, p.price)}>${price ? priceHtml(price) : esc(ui('priceOnRequest', ctx.lang))}</p>
          ${features.length ? `<ul class="ticks"${ed(ctx, `${path}.features`, p.features)}>${features.map((f) => `<li>${uiIcon('check', 'i')}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
          ${bookable && label ? `<a class="btn ${p.highlight ? 'btn-primary' : 'btn-line'}" href="${esc(sectionHref(ctx, 'contact'))}" data-topic="party" data-paket="${esc(raw(ctx, p.name))}"${ed(ctx, T(ctx, p.button) ? `${path}.button` : 'packages.buttonLabel', T(ctx, p.button) ? p.button : pk.buttonLabel)}>${esc(label)}</a>` : ''}
        </div>
      </article>`;
  });
  const notes = T(ctx, pk.note)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return `<div class="wrap">
    ${sectionHead(ctx, s, index)}
    <div class="packs n${Math.min(items.length, 4)}">${cards.join('')}</div>
    ${notes.length ? `<ul class="stamps pack-notes" data-reveal${ed(ctx, 'packages.note', pk.note)}>${notes.map((l) => `<li class="stamp">${inline(l, { base: ctx.base })}</li>`).join('')}</ul>` : ''}
  </div>`;
}

function scheduleContent(settings, ctx, s, index) {
  const sc = settings.schedule;
  const id = anchor(s.id, ctx.lang);
  const p = `sections.${index}`;
  const kicker = T(ctx, s.kicker);
  const intro = T(ctx, s.intro);
  const note = T(ctx, sc.note);
  const slots = sc.items.map((x, i) => [x, i]);
  const day = (x) => (x.day === 'custom' ? T(ctx, x.when) : cap(WEEKDAYS_ON[ctx.lang][DAYS.indexOf(x.day)]));
  const bookable = canBook(settings) && formTopics(settings).includes('sport');
  const stub = slots.length
    ? `<ul class="slots">${slots
        .map(
          ([x, i]) => `<li${ed(ctx, `schedule.items.${i}.title`, x.title)}><span class="day">${esc(day(x))}</span>${x.time ? `<span class="time">${esc(x.time)}</span>` : ''}${T(ctx, x.title) ? `<span class="slot-title">${esc(T(ctx, x.title))}</span>` : ''}${
            T(ctx, x.place) ? `<span class="slot-note">${esc(T(ctx, x.place))}</span>` : ''
          }${T(ctx, x.note) ? `<span class="slot-note">${esc(T(ctx, x.note))}</span>` : ''}</li>`
        )
        .join('')}</ul>`
    : `<span class="day"${ctx.preview ? ' data-edit="schedule.items" title="Kliknite za urejanje"' : ''}>${esc(ui('byArrangement', ctx.lang))}</span>`;
  const pic = sc.photo || ctx.preview ? `<figure class="print" data-reveal${editImage(ctx, 'schedule.photo')}>${photo(ctx, sc.photo, T(ctx, sc.photoAlt), { ill: 'ball', tone: 'sage' })}</figure>` : '';
  return `<div class="wrap">
    <div class="sport${pic ? '' : ' no-photo'}">
      ${pic}
      <article class="ticket" data-reveal>
        <div class="ticket-main">
          ${kicker ? `<span class="kicker"${ed(ctx, `${p}.kicker`, s.kicker)}>${esc(kicker)}</span>` : ''}
          <h2 class="section-title" id="${id}-title"${ed(ctx, `${p}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
          ${intro ? `<p${ed(ctx, `${p}.intro`, s.intro)}>${esc(intro)}</p>` : ''}
          ${stamps(ctx, sc.facts, 'schedule.facts')}
          ${note ? `<div class="ticket-note"${ed(ctx, 'schedule.note', sc.note)}>${markdown(note, { base: ctx.base })}</div>` : ''}
        </div>
        <div class="ticket-stub">
          <span class="k"${ed(ctx, 'schedule.stubLabel', sc.stubLabel)}>${esc(T(ctx, sc.stubLabel))}</span>
          ${stub}
          ${bookable && T(ctx, sc.buttonLabel) ? `<a class="btn" href="${esc(sectionHref(ctx, 'contact'))}" data-topic="sport"${ed(ctx, 'schedule.buttonLabel', sc.buttonLabel)}>${esc(T(ctx, sc.buttonLabel))}</a>` : ''}
        </div>
      </article>
    </div>
  </div>`;
}

function eventsContent(settings, ctx, s, index) {
  const id = anchor(s.id, ctx.lang);
  const p = `sections.${index}`;
  const kicker = T(ctx, s.kicker);
  const intro = T(ctx, s.intro);
  const label = T(ctx, settings.events.buttonLabel);
  const bookable = canBook(settings) && formTopics(settings).includes('event');
  return `<div class="wrap">
    <div class="events" data-reveal>
      <div>
        ${kicker ? `<span class="kicker"${ed(ctx, `${p}.kicker`, s.kicker)}>${esc(kicker)}</span>` : ''}
        <h2 class="section-title" id="${id}-title"${ed(ctx, `${p}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
        ${intro ? `<p${ed(ctx, `${p}.intro`, s.intro)}>${esc(intro)}</p>` : ''}
      </div>
      ${bookable && label ? `<a class="btn btn-line" href="${esc(sectionHref(ctx, 'contact'))}" data-topic="event"${ed(ctx, 'events.buttonLabel', settings.events.buttonLabel)}>${esc(label)}${uiIcon('arrow', 'i i-arrow')}</a>` : ''}
    </div>
  </div>`;
}

function aboutContent(settings, ctx, s, index) {
  const a = settings.about;
  const id = anchor(s.id, ctx.lang);
  const p = `sections.${index}`;
  const kicker = T(ctx, s.kicker);
  const text = T(ctx, a.text);
  const signature = T(ctx, a.signature);
  const initial = (settings.site.name.trim().split(/\s+/).at(-1) || '?')[0].toLocaleUpperCase();
  return `<div class="wrap about">
    <figure class="print portrait" data-reveal${editImage(ctx, 'about.photo')}>${photo(ctx, a.photo, T(ctx, a.photoAlt), { tone: 'lilac', mono: initial })}</figure>
    <div class="about-body" data-reveal>
      ${kicker ? `<span class="kicker"${ed(ctx, `${p}.kicker`, s.kicker)}>${esc(kicker)}</span>` : ''}
      <h2 class="section-title" id="${id}-title"${ed(ctx, `${p}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
      ${text ? `<div class="about-text prose"${ed(ctx, 'about.text', a.text)}>${markdown(text, { base: ctx.base })}</div>` : ''}
      ${stamps(ctx, a.badges, 'about.badges')}
      ${signature ? `<p class="sign"${ed(ctx, 'about.signature', a.signature)}>${esc(signature)}</p>` : ''}
    </div>
  </div>`;
}

function galleryContent(settings, ctx, s, index) {
  const g = settings.gallery;
  const images = g.images.map((x, i) => [x, i]).filter(([x]) => x.src);
  if (!images.length) {
    return ctx.preview ? `<div class="wrap">${sectionHead(ctx, s, index)}<p class="preview-empty" data-edit="gallery.images" title="Kliknite za urejanje">Galerija je prazna. Na spletni strani se ta razdelek ne prikaže, dokler ne dodate slik.</p></div>` : '';
  }
  const note = T(ctx, g.note);
  const items = images.map(([x, i], n) => {
    const alt = T(ctx, x.alt);
    const caption = T(ctx, x.caption);
    return `<li class="r${(n % 5) + 1}"><a class="polaroid" href="${esc(ctx.img(x.src))}" data-lightbox${caption ? ` data-caption="${esc(caption)}"` : ''} aria-label="${esc(ui('enlarge', ctx.lang))}${alt ? `: ${esc(alt)}` : ''}"${editImage(ctx, `gallery.images.${i}.src`)}><span class="ph"><img src="${esc(ctx.img(x.src))}" alt="${esc(alt)}" loading="lazy" decoding="async"></span>${
      caption ? `<span class="cap"${ed(ctx, `gallery.images.${i}.caption`, x.caption)}>${esc(caption)}</span>` : ''
    }</a></li>`;
  });
  return `<div class="wrap">
    ${sectionHead(ctx, s, index)}
    <ul class="wall" data-gallery data-scroller data-reveal aria-label="${esc(ui('gallery', ctx.lang))}">${items.join('')}</ul>
    <p class="swipe-hint" aria-hidden="true">${esc(ui('swipe', ctx.lang))}${uiIcon('swipe', 'i')}</p>
    ${note ? `<p class="consent"${ed(ctx, 'gallery.note', g.note)}>${uiIcon('shield', 'i')}<span>${esc(note)}</span></p>` : ''}
  </div>`;
}

function stars(n, lang) {
  return `<span class="stars" role="img" aria-label="${esc(ui('rating', lang, { n }))}">${Array.from({ length: 5 }, (_, i) => uiIcon('star', i < n ? 'i is-on' : 'i')).join('')}</span>`;
}

function ratingLine(settings, ctx, cls) {
  const r = settings.testimonials;
  const note = T(ctx, r.ratingNote);
  if (!note) return '';
  const body = `${uiIcon('star', 'i')}<span>${esc(note)}</span>`;
  return `<p class="${cls}"${ed(ctx, 'testimonials.ratingNote', r.ratingNote)}>${r.ratingUrl ? `<a href="${esc(r.ratingUrl)}" rel="noopener" target="_blank">${body}</a>` : body}</p>`;
}

function testimonialsContent(settings, ctx, s, index) {
  const r = settings.testimonials;
  const items = r.items.map((x, i) => [x, i]).filter(([x]) => T(ctx, x.quote));
  if (!items.length) {
    return ctx.preview ? `<div class="wrap">${sectionHead(ctx, s, index)}<p class="preview-empty" data-edit="testimonials.items" title="Kliknite za urejanje">Tukaj bodo mnenja staršev. Na spletni strani se razdelek ne prikaže, dokler jih ne dodate.</p></div>` : '';
  }
  const notes = items.map(([x, i], n) => {
    const detail = T(ctx, x.detail);
    const who = [x.name ? esc(x.name) : '', detail ? esc(detail) : ''].filter(Boolean).join(', ');
    return `<figure class="note r${(n % 3) + 1}">
        <span class="thx" aria-hidden="true">${esc(ui('thanksNote', ctx.lang))}</span>
        <blockquote${ed(ctx, `testimonials.items.${i}.quote`, x.quote)}>${markdown(T(ctx, x.quote), { base: ctx.base })}</blockquote>
        ${who || (r.showStars && x.rating) ? `<figcaption>${who ? `<span>${who}</span>` : ''}${r.showStars && x.rating ? stars(x.rating, ctx.lang) : ''}</figcaption>` : ''}
      </figure>`;
  });
  return `<div class="wrap two-col">
    ${sectionHead(ctx, s, index, { side: true, extra: ratingLine(settings, ctx, 'rating') })}
    <div class="notes" data-reveal>${notes.join('')}</div>
  </div>`;
}

/** An intro that may contain {phone}: becomes a call link, or the sentence waits until a number is entered. */
function phoneIntro(settings, ctx, text) {
  if (!text) return '';
  if (!text.includes('{phone}')) return esc(text);
  const digits = phoneDigits(settings.contact.phone);
  if (!digits) return ctx.preview ? esc(text) : '';
  return esc(text).replace('{phone}', `<a href="tel:+${digits}">${esc(settings.contact.phone)}</a>`);
}

function faqContent(settings, ctx, s, index) {
  const items = settings.faq.items.map((x, i) => [x, i]).filter(([x]) => T(ctx, x.q));
  if (!items.length) return '';
  return `<div class="wrap two-col">
    ${sectionHead(ctx, s, index, { side: true, introHtml: phoneIntro(settings, ctx, T(ctx, s.intro)) })}
    <div class="faq" data-reveal>${items
      .map(
        ([x, i]) => `<details class="faq-item">
        <summary class="faq-q"><span${ed(ctx, `faq.items.${i}.q`, x.q)}>${esc(T(ctx, x.q))}</span><span class="pm" aria-hidden="true">${uiIcon('plus', 'i')}</span></summary>
        <div class="faq-a prose"${ed(ctx, `faq.items.${i}.a`, x.a)}>${markdown(T(ctx, x.a), { base: ctx.base })}</div>
      </details>`
      )
      .join('')}</div>
  </div>`;
}

// --- booking form --------------------------------------------------------------------------

const opt = (value, label = value) => `<option value="${esc(value)}">${esc(label)}</option>`;

function bookingForm(settings, ctx) {
  const fm = settings.form;
  const p = ctx.provider;
  const L = ctx.lang;
  const f = (k, v) => ft(k, L, v);
  if (fm.provider === 'none') return '';
  if (!p.ready && !ctx.preview) return `<div class="form-closed"><p>${esc(ui('formClosed', L))}</p></div>`;

  const topics = formTopics(settings);
  const ask = fm.ask;
  const K = FORM_KEYS;
  const packages = isVisible(settings, 'packages') ? settings.packages.items.map((x) => raw(ctx, x.name)).filter(Boolean) : [];
  const day = (x) => (x.day === 'custom' ? raw(ctx, x.when) : cap(WEEKDAYS_ON[L][DAYS.indexOf(x.day)]));
  const slotLabel = (x) => {
    const when = [day(x), x.time ? `${ui('at', L)} ${x.time}` : ''].filter(Boolean).join(' ');
    return [when, raw(ctx, x.title)].filter(Boolean).join(' · ');
  };
  const optional = ` <span class="hint">${esc(f('optional'))}</span>`;
  const err = (id) => `<p class="err" id="${id}-err" data-error hidden></p>`;

  // A labelled control. Controls marked data-need are required while their topic is chosen (checked by site.js;
  // a plain `required` would stop the browser from sending the form while another topic's fields are hidden).
  const field = (id, key, label, control, { full = false, hint = '' } = {}) =>
    `<div class="field${full ? ' full' : ''}" data-field="${key}"><label for="${id}">${esc(label)}${hint}</label>${control}${err(id)}</div>`;
  const input = (id, name, type, { need = false, extra = '' } = {}) => `<input id="${id}" name="${name}" type="${type}"${need ? ' data-need' : ''}${extra}>`;
  const select = (id, name, options, { need = false, first = f('choose') } = {}) =>
    `<select id="${id}" name="${name}"${need ? ' data-need' : ''}><option value="">${esc(first)}</option>${options.map((o) => opt(o)).join('')}</select>`;
  const pills = (key, name, legend, choices, { hint = '', full = true } = {}) =>
    `<fieldset class="field${full ? ' full' : ''}" data-field="${key}"><legend>${esc(legend)}${hint}</legend><div class="pills">${choices
      .map(([value, label, extra = '']) => `<label><input type="radio" name="${name}" value="${esc(value)}"${extra}><span>${esc(label)}</span></label>`)
      .join('')}</div></fieldset>`;

  const topicLabels = { party: f('topicParty'), sport: f('topicSport'), event: f('topicEvent') };
  const topicField =
    topics.length > 1
      ? pills('topic', K.topic, f('topic'), topics.map((t, i) => [topicLabels[t], topicLabels[t], ` data-topic="${t}"${i === 0 ? ' checked' : ''}`]))
      : `<input type="hidden" name="${K.topic}" value="${esc(topicLabels[topics[0]])}" data-topic="${topics[0]}">`;

  const groups = {
    party: () =>
      [
        field('f-p-date', 'date', f('partyDate'), input('f-p-date', K.date, 'date', { need: true })),
        field('f-p-age', 'age', f('partyAge'), select('f-p-age', K.age, AGES[L], { need: true })),
        field('f-p-kids', 'kids', f('kids'), input('f-p-kids', K.kids, 'number', { need: true, extra: ` inputmode="numeric" min="1" max="40" placeholder="${esc(f('kidsPlaceholder'))}"` })),
        packages.length ? field('f-p-pack', 'package', f('package'), select('f-p-pack', K.package, packages, { first: f('notSure') })) : '',
        ask.time ? field('f-p-time', 'time', f('time'), select('f-p-time', K.time, [f('morning'), f('afternoon')], { first: f('notSure') })) : '',
        ask.where ? pills('where', K.where, f('where'), [[f('whereHome'), f('whereHome')], [f('whereVenue'), f('whereVenue')], [f('notSure'), f('notSure')]]) : '',
        ask.town ? field('f-p-town', 'town', f('town'), input('f-p-town', K.town, 'text', { extra: ` autocomplete="address-level2" maxlength="80" placeholder="${esc(f('townPlaceholder'))}"` }), { full: true, hint: ` <span class="hint">${esc(f('townHint'))}</span>` }) : '',
      ].join(''),
    sport: () =>
      [
        field('f-s-age', 'age', f('sportAge'), select('f-s-age', K.age, AGES[L], { need: true })),
        settings.schedule.items.length ? field('f-s-slot', 'slot', f('slot'), select('f-s-slot', K.slot, [...settings.schedule.items.map(slotLabel), f('slotOther')], { first: f('choose') })) : '',
        `<label class="check full"><input id="f-s-trial" name="${K.trial}" type="checkbox" value="${esc(f('trial'))}"><span>${esc(f('trial'))}</span></label>`,
      ].join(''),
    event: () =>
      [
        field('f-e-type', 'eventType', f('eventType'), input('f-e-type', K.eventType, 'text', { need: true, extra: ` maxlength="80" placeholder="${esc(f('eventTypePlaceholder'))}"` })),
        field('f-e-date', 'date', f('eventDate'), input('f-e-date', K.date, 'date', { need: true })),
        field('f-e-kids', 'kids', f('eventKids'), input('f-e-kids', K.kids, 'number', { extra: ' inputmode="numeric" min="1" max="80"' }), { hint: optional }),
        field('f-e-town', 'town', f('town'), input('f-e-town', K.town, 'text', { extra: ' autocomplete="address-level2" maxlength="80"' }), { hint: optional }),
      ].join(''),
  };
  const groupHtml = topics.map((t) => `<div class="group${topics.length === 1 ? ' only' : ''}" data-for="${t}">${groups[t]()}</div>`).join('');

  const privacyLink = `<a href="${esc(ctx.url(pagePath('privacy', L)))}">${esc(ui('privacyInSentence', L))}</a>`;
  const note = esc(T(ctx, fm.privacyNote)).replace('{privacy}', privacyLink);
  const hidden = Object.entries(p.ready ? p.hidden : {})
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join('');
  const msgs = {
    required: f('errRequired'),
    choose: f('errChoose'),
    contact: f('errContact'),
    contactinvalid: f('errContactInvalid'),
    needmail: f('errNeedMail'),
    past: f('errPast'),
    kidsmax: f('errKidsMax'),
    kidsmin: f('errKidsMin'),
    added: f('dateAdded'),
    toomany: ui('errTooMany', L),
    network: ui('errNetwork', L),
    sending: ui('sending', L),
  };
  const msgAttrs = Object.entries(msgs)
    .map(([k, v]) => ` data-msg-${k}="${esc(v)}"`)
    .join('');
  const action = p.ready ? p.action : '#';
  const mailto = p.responds === 'mailto';
  const subject = `${ui('mailtoSubject', L)} (${settings.site.name})`;

  return `<form class="form" id="book-form" method="post" action="${esc(action)}"${mailto ? ' enctype="text/plain"' : ''} accept-charset="utf-8" data-inquiry data-responds="${p.ready ? p.responds : 'none'}" data-subject="${esc(subject)}"${msgAttrs}${ctx.previewSuccess ? ' hidden' : ''}>
      ${hidden}
      <input type="hidden" name="_subject" value="${esc(subject)}">
      <input type="hidden" name="jezik" value="${esc(LANG_INFO[L].name)}">
      ${topicField}
      ${groupHtml}
      ${field('f-name', 'name', f('name'), `<input id="f-name" name="${K.name}" type="text" autocomplete="name" maxlength="100" required>`)}
      ${field('f-contact', 'contact', f('contact'), `<input id="f-contact" name="${K.contact}" type="text" autocomplete="tel" maxlength="120" required>`)}
      ${ask.reply ? pills('reply', K.reply, f('reply'), [[f('replyCall'), f('replyCall')], [f('replyText'), f('replyText')], [f('replyEmail'), f('replyEmail'), ' data-email']], { hint: optional }) : ''}
      <div class="field full" data-field="message"><label for="f-msg">${esc(f('message'))}${optional}</label><span class="hint" id="f-msg-hint">${esc(f('messageHint'))}</span><textarea id="f-msg" name="${K.message}" rows="3" maxlength="3000" aria-describedby="f-msg-hint"></textarea></div>
      <div class="hp" aria-hidden="true"><label for="f-website">${esc(ui('honeypot', L))}</label><input id="f-website" type="text" name="spletna-stran" tabindex="-1" autocomplete="off" data-honeypot></div>
      ${note ? `<p class="privacy full"${ed(ctx, 'form.privacyNote', fm.privacyNote)}>${note}</p>` : ''}
      ${mailto ? `<p class="privacy full">${esc(ui('mailtoNote', L))}</p>` : ''}
      <button class="btn btn-primary btn-submit full" type="submit"${ed(ctx, 'form.buttonLabel', fm.buttonLabel)}><span class="btn-label">${esc(T(ctx, fm.buttonLabel))}</span>${uiIcon('arrow', 'i i-arrow')}</button>
      <p class="form-status full" role="status" aria-live="polite" data-status></p>
    </form>
    <div class="done" data-success${ctx.previewSuccess ? '' : ' hidden'} tabindex="-1">
      <span class="done-mark">${uiIcon('check', 'i')}</span>
      <h3 data-success-title${ed(ctx, 'form.successTitle', fm.successTitle)}>${esc(T(ctx, fm.successTitle))}</h3>
      <div class="prose" data-success-body${ed(ctx, 'form.successBody', fm.successBody)}>${markdown(T(ctx, fm.successBody), { base: ctx.base })}</div>
      ${mailto ? `<template data-mailto-title>${esc(ui('mailtoDoneTitle', L))}</template><template data-mailto-body>${esc(ui('mailtoDoneBody', L))}</template>` : ''}
    </div>`;
}

function contactContent(settings, ctx, s, index) {
  const c = settings.contact;
  const L = ctx.lang;
  const digits = phoneDigits(c.phone);
  const id = anchor(s.id, L);
  const p = `sections.${index}`;
  const kicker = T(ctx, s.kicker);
  const intro = T(ctx, s.intro);
  const tile = (href, icon, title, detail, extra = '') => `<li><a href="${esc(href)}"${extra}>${icon}<span>${esc(title)}<small>${esc(detail)}</small></span></a></li>`;
  const tiles = [
    digits ? tile(`tel:+${digits}`, uiIcon('phone', 'i'), ui('call', L), c.phone) : '',
    digits && c.viber ? tile(`viber://chat?number=%2B${digits}`, brandIcon('viber', 'i'), 'Viber', ui('sameNumber', L), ' class="is-viber"') : '',
    digits && c.whatsapp ? tile(`https://wa.me/${digits}`, brandIcon('whatsapp', 'i'), 'WhatsApp', ui('sameNumber', L), ' rel="noopener" target="_blank"') : '',
    c.email ? tile(`mailto:${c.email}`, uiIcon('mail', 'i'), ui('email', L), c.email) : '',
  ].filter(Boolean);
  const reach = [T(ctx, c.area) ? `<span${ed(ctx, 'contact.area', c.area)}>${uiIcon('pin', 'i')}${esc(T(ctx, c.area))}</span>` : '', T(ctx, c.hours) ? `<span${ed(ctx, 'contact.hours', c.hours)}>${uiIcon('clock', 'i')}${esc(T(ctx, c.hours)).replace(/\n/g, ' · ')}</span>` : ''].filter(Boolean);
  const form = bookingForm(settings, ctx);
  const quick = tiles.length ? `<ul class="quick n${tiles.length}" aria-label="${esc(ui('contactDirect', L))}">${tiles.join('')}</ul>` : '';
  if (!quick && !form) {
    return ctx.preview
      ? `<div class="wrap"><div class="rsvp"><p class="preview-empty" data-edit="contact.phone" title="Kliknite za urejanje">Tu se prikažejo telefon, Viber, WhatsApp, e-pošta in obrazec, ko jih nastavite.</p></div></div>`
      : '';
  }
  return `<div class="wrap">
    <div class="envelope" data-reveal>
      <div class="rsvp">
        <div class="rsvp-head">
          ${kicker ? `<span class="kicker"${ed(ctx, `${p}.kicker`, s.kicker)}>${esc(kicker)}</span>` : ''}
          <h2 class="section-title" id="${id}-title"${ed(ctx, `${p}.heading`, s.heading)}>${esc(T(ctx, s.heading))}</h2>
          ${intro ? `<p${ed(ctx, `${p}.intro`, s.intro)}>${esc(intro)}</p>` : ''}
          ${ratingLine(settings, ctx, 'rating-line')}
        </div>
        ${quick}
        ${reach.length ? `<p class="reach">${reach.join('')}</p>` : ''}
        ${quick && form ? `<p class="or">${esc(ui('orForm', L))}</p>` : ''}
        ${form}
      </div>
    </div>
  </div>`;
}

function servicesContent(settings, ctx, s, index) {
  const sv = settings.services;
  const ask = sv.showInquiry && canBook(settings);
  const items = sv.items.map((x, i) => [x, i]).filter(([x]) => T(ctx, x.title));
  if (!items.length) return '';
  const cards = items.map(([x, i], n) => {
    const p = `services.items.${i}`;
    const media = x.image
      ? `<div class="service-media"><img src="${esc(ctx.img(x.image))}" alt="" loading="lazy" decoding="async"></div>`
      : x.icon
        ? `<span class="ic">${serviceIcon(x.icon, 'i')}</span>`
        : '';
    return `<li class="service r${(n % 5) + 1}${x.image ? ' has-media' : ''}">
        ${media}
        <h3 class="card-title"${ed(ctx, `${p}.title`, x.title)}>${esc(T(ctx, x.title))}</h3>
        ${T(ctx, x.text) ? `<p${ed(ctx, `${p}.text`, x.text)}>${esc(T(ctx, x.text))}</p>` : ''}
        ${ask ? `<a class="link-arrow" href="${esc(sectionHref(ctx, 'contact'))}" data-topic="party">${esc(ui('inquire', ctx.lang))}${uiIcon('arrow', 'i')}</a>` : ''}
      </li>`;
  });
  return `<div class="wrap">
    ${sectionHead(ctx, s, index)}
    <ul class="services" data-reveal>${cards.join('')}</ul>
  </div>`;
}

const CONTENT = {
  steps: stepsContent,
  packages: packagesContent,
  schedule: scheduleContent,
  events: eventsContent,
  about: aboutContent,
  gallery: galleryContent,
  testimonials: testimonialsContent,
  faq: faqContent,
  contact: contactContent,
  services: servicesContent,
};

// Cream bands (with scalloped edges) and white paper sections, as in the design.
const BANDS = new Set(['packages', 'about', 'contact', 'services']);

/** Whether a section has anything to show (empty sections are left out of the page and the menu). */
function sectionHasContent(settings, ctx, id) {
  if (ctx.preview) return true;
  const index = settings.sections.findIndex((s) => s.id === id);
  return Boolean(CONTENT[id](settings, { ...ctx, preview: false }, settings.sections[index], index));
}

function homePage(settings, ctx) {
  const sections = settings.sections
    .map((s, index) => {
      if (!s.enabled) return '';
      const content = CONTENT[s.id](settings, ctx, s, index);
      if (!content) return '';
      const id = anchor(s.id, ctx.lang);
      const band = BANDS.has(s.id);
      const confetti = s.id === 'contact' && settings.theme.confetti ? ' confetti' : '';
      return `<section class="${band ? 'band' : 'section'} sec-${s.id}${confetti}" id="${id}" aria-labelledby="${id}-title" data-bg="${band ? 'band' : 'paper'}">
  ${content}
</section>`;
    })
    .filter(Boolean);
  return [heroSection(settings, ctx), ...sections].join('\n');
}

// --- other pages ----------------------------------------------------------------------

function simplePage(title, body, cls = '', editAttrs = '') {
  return `<section class="page ${cls}">
  <div class="wrap narrow">
    <article class="page-card">
      <h1 class="page-title"${editAttrs}>${esc(title)}</h1>
      ${body}
    </article>
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
  <div class="wrap narrow">
    <article class="page-card">
      ${rainbowMark('mark')}
      <h1 class="page-title"${ed(ctx, 'thanks.title', t.title)}>${esc(T(ctx, t.title))}</h1>
      <div class="prose lead"${ed(ctx, 'thanks.body', t.body)}>${markdown(T(ctx, t.body), { base: ctx.base })}</div>
      <p class="actions"><a class="btn btn-primary" href="${esc(ctx.url(pagePath('home', ctx.lang)))}">${esc(ui('backHome', ctx.lang))}</a></p>
    </article>
  </div>
</section>`;
}

/** One 404 page for the whole site, in every language, because the server doesn't know which one was meant. */
function notFoundPage(settings, ctx) {
  return `<section class="page page-center">
  <div class="wrap narrow">
    <article class="page-card">
      ${rainbowMark('mark')}
      ${ctx.langs
        .map(
          (l, i) => `<div class="notfound" lang="${l}">
        ${i === 0 ? `<h1 class="page-title">${esc(ui('notFoundTitle', l))}</h1>` : `<h2>${esc(ui('notFoundTitle', l))}</h2>`}
        <p>${esc(ui('notFoundText', l))} <a href="${esc(ctx.url(pagePath('home', l)))}">${esc(ui('backHome', l))}</a></p>
      </div>`
        )
        .join('\n')}
    </article>
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

/** Without an uploaded icon, the build draws PNG icons for phones (scripts/icon-png.mjs) and the pages link them. */
export const drawnIcons = (settings) => !settings.theme.favicon;

/** Extra CSS variables for theme.css that come from outside the theme settings. */
export const themeExtras = (settings) => ({ textStyles: settings.textStyles, logoHeight: settings.header.logoHeight });

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

  const v = opts.version ? `?v=${encodeURIComponent(opts.version)}` : '';
  files['site.webmanifest'] = JSON.stringify(
    {
      name: s.site.name,
      short_name: s.site.name,
      description: tr(s.seo.description, 'sl'),
      start_url: `${base}/`,
      display: 'browser',
      background_color: s.theme.colors.bg,
      theme_color: s.theme.colors.bg,
      // The PNGs are drawn by the build (scripts/icon-png.mjs), with the artwork inside the maskable safe zone,
      // so the 512 one also serves as the maskable icon. Versioned, so new theme colours reach phones.
      icons: drawnIcons(s)
        ? [
            { src: `${base}/assets/img/favicon.svg${v}`, sizes: 'any', type: 'image/svg+xml' },
            { src: `${base}/assets/img/icon-192.png${v}`, sizes: '192x192', type: 'image/png' },
            { src: `${base}/assets/img/icon-512.png${v}`, sizes: '512x512', type: 'image/png' },
            { src: `${base}/assets/img/icon-512.png${v}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ]
        : [{ src: base + s.theme.favicon, sizes: 'any' }],
    },
    null,
    2
  );
  return files;
}
