// Security and sanity checks for the renderer. Run with `npm test` (the deploy runs it before every build).
// Feeds hostile values into every kind of setting and asserts nothing unsafe reaches the output.

import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decryptToken, encryptToken, MIN_PASSWORD, passwordProblem, suggestPassword, WORDS } from '../public/admin/access.js';
import { markdown } from '../src/markdown.mjs';
import { resolveProvider } from '../src/providers.mjs';
import { renderPage, renderSite, typo } from '../src/render.mjs';
import { DEFAULT_SETTINGS, isSample, missingTranslations, normalizeSettings, placeholders, samplePhotosInUse, setupChecklist, TERMS_DRAFT } from '../src/settings.mjs';
import { contrast, contrastReport, PRESETS, themeColors, themeCss } from '../src/themes.mjs';
import { ICON_SIZES, iconPng } from './icon-png.mjs';
import { findRenditions, imageWidth } from './images.mjs';
import { basePath, i18nFields, LANGS, phoneDigits, renditionPath, renditionWidths, safeAssetPath, safeUrl, toCyrillic } from '../src/util.mjs';

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
  } catch (error) {
    console.error(`✗ ${name}\n  ${error.message}`);
    process.exitCode = 1;
  }
}

const XSS = '<script>alert(1)</script><img src=x onerror=alert(1)>"\'><svg onload=alert(1)>';
const EVIL_URL = 'javascript:alert(document.cookie)';
const X3 = { sl: XSS, en: XSS, hr: XSS, sr: XSS };
// Real (unescaped) markup only: escaped text like "&lt;img onerror=…" is harmless and must not match.
const INJECTED_TAG = /<(script(?! type="(module|application\/ld\+json)")|img src=x|svg onload|iframe|object|embed)\b/i;
const EVENT_ATTR = /<[a-z][^>]*\son[a-z]+\s*=/i;
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const BASE = '/otrosko-animiranje-ema';
const site = (s) => renderSite(normalizeSettings(s), { version: 'v' });
const withForm = (s, form) => ({ ...s, form: { ...s.form, ...form } });
const withContact = (s, contact) => ({ ...s, contact: { ...s.contact, ...contact } });
const sectionOf = (s, id) => s.sections.find((x) => x.id === id);

function hostileSettings() {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.site.name = XSS;
  s.site.url = EVIL_URL;
  s.languages.en.label = XSS;
  s.languages.hr = { enabled: true, label: XSS, short: XSS, flags: ['"><script>', 'hr', 'hr', 'xx', 'rs'] };
  s.languages.sr = { enabled: true, label: XSS, short: XSS };
  s.announcement = { enabled: true, text: X3, linkLabel: X3, target: 'url', url: EVIL_URL, style: '"><script>' };
  s.header = { logo: 'https://evil.example/logo.png', logoHeight: '1px; background:url(javascript:alert(1))', showName: true, sticky: true, cta: { enabled: true, label: X3, target: 'url', url: EVIL_URL } };
  s.hero = {
    badge: X3,
    title: X3,
    text: X3,
    details: [{ term: X3, value: X3 }],
    showDate: 'yes',
    primary: { label: X3, target: 'url', url: EVIL_URL },
    secondary: { label: X3, target: '"><x', url: EVIL_URL },
    photos: [
      { src: "/x.png') ; background:url(javascript:alert(1)", alt: X3, caption: X3 },
      { src: 'https://evil.example/a.jpg', alt: X3, caption: X3 },
      { src: '/assets/uploads/third.webp', alt: X3, caption: X3 },
    ],
  };
  s.sections = s.sections.map((x) => ({ ...x, kicker: X3, heading: X3, menuLabel: X3, intro: X3, enabled: true }));
  s.sections.push({ id: '"><script>', enabled: true, heading: X3 });
  s.services.items = [{ icon: '"><script>', image: 'data:image/svg+xml,<svg onload=alert(1)>', title: X3, text: X3 }];
  s.steps.items = [{ icon: 'nope', time: XSS, title: X3, text: X3 }];
  s.packages = { buttonLabel: X3, note: { sl: `${XSS}\n**${XSS}** [x](${EVIL_URL})`, en: XSS, hr: XSS, sr: XSS }, items: [{ name: X3, price: X3, duration: X3, features: X3, highlight: true, badge: X3, button: X3 }] };
  s.schedule = { photo: 'https://evil.example/s.jpg', photoAlt: X3, facts: [{ icon: '"><x', text: X3 }], note: X3, stubLabel: X3, buttonLabel: X3, items: [{ title: X3, day: '"><script>', when: X3, time: XSS, place: X3, note: X3 }] };
  s.events = { buttonLabel: X3 };
  s.about = { text: { sl: `${XSS}\n\n[klik](${EVIL_URL}) [ok](https://example.com)`, en: XSS, hr: XSS, sr: XSS }, photo: 'https://evil.example/a.jpg', photoAlt: X3, badges: [{ icon: '"><x', text: X3 }], signature: X3 };
  s.gallery = { note: X3, images: [{ src: '/assets/uploads/ok.webp', alt: X3, caption: X3 }, { src: 'https://evil.example/b.jpg', alt: X3, caption: X3 }] };
  s.testimonials = { showStars: true, ratingNote: X3, ratingUrl: EVIL_URL, items: [{ quote: X3, name: XSS, detail: X3, rating: '5"><x' }] };
  s.faq.items = [{ q: X3, a: X3 }];
  s.contact = { phone: XSS, email: XSS, whatsapp: true, viber: true, address: XSS, area: X3, hours: X3, mapUrl: EVIL_URL };
  s.form = {
    ...s.form,
    provider: 'custom',
    custom: { action: EVIL_URL, providerName: XSS, privacyUrl: EVIL_URL, extraName: '"><script>', extraValue: XSS, mode: '"><x' },
    topics: { party: 'yes', sport: true, event: '"><x' },
    ask: { time: 'x', where: true, town: true, reply: true },
    buttonLabel: X3,
    privacyNote: { sl: `${XSS} {privacy}`, en: XSS, hr: XSS, sr: XSS },
    successTitle: X3,
    successBody: X3,
  };
  s.thanks = { title: X3, body: X3 };
  s.floating = { enabled: true, label: X3 };
  s.footer = { text: X3, showContact: true, showSocials: true, showBusiness: true };
  s.socials = [
    { platform: 'facebook', url: EVIL_URL, label: XSS },
    { platform: '<b>', url: 'https://ok.example', label: XSS },
  ];
  s.business = { name: XSS, address: XSS, registration: XSS, taxNumber: XSS, vatId: XSS };
  s.theme.colors.bg = 'red;}</style><script>alert(1)</script>';
  s.theme.colors.coral = 'url(javascript:alert(1))';
  s.theme.headingFont = '"><x';
  s.theme.garland = '"><x';
  s.theme.favicon = 'https://evil.example/f.png';
  s.textStyles.heroTitle = { ...s.textStyles.heroTitle, font: '"><x', color: 'custom', customColor: 'red;}</style>' };
  s.privacy = { ...s.privacy, extra: X3, hosting: X3, effectiveDate: '2026-13-99"><x' };
  s.terms = { enabled: true, title: X3, body: X3 };
  s.seo = { title: X3, description: X3, ogImage: EVIL_URL, ogImageAlt: X3, indexable: true, areaServed: '</script><script>alert(1)</script>', priceRange: XSS };
  return s;
}

await test('URL filter allows only safe schemes', () => {
  assert.equal(safeUrl(EVIL_URL), '');
  assert.equal(safeUrl(' JaVaScRiPt:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,hi'), '');
  assert.equal(safeUrl('//evil.example'), '');
  assert.equal(safeUrl('https://ok.example/a?b=1'), 'https://ok.example/a?b=1');
  assert.equal(safeUrl('/zasebnost/'), '/zasebnost/');
  assert.equal(safeUrl('mailto:a@b.co'), 'mailto:a@b.co');
  assert.equal(safeUrl('tel:+38641123456'), 'tel:+38641123456');
  assert.equal(safeAssetPath('/assets/uploads/a.webp'), '/assets/uploads/a.webp');
  assert.equal(safeAssetPath("/a.png');}"), '');
  assert.equal(safeAssetPath('/../etc/passwd'), '');
});

await test('Base path and phone numbers', () => {
  assert.equal(basePath('https://elarion-game-dev.github.io/otrosko-animiranje-ema'), BASE);
  assert.equal(basePath('https://www.ema.si'), '');
  assert.equal(basePath('https://www.ema.si/'), '');
  assert.equal(phoneDigits('041 123 456'), '38641123456');
  assert.equal(phoneDigits('+386 (41) 123-456'), '38641123456');
  assert.equal(phoneDigits('00385 91 234 5678'), '385912345678');
  assert.equal(phoneDigits('call me'), '');
});

await test('Markdown escapes HTML, drops unsafe links and prefixes site links', () => {
  const html = markdown(`${XSS}\n\n[x](${EVIL_URL}) **b** [pogoji](/pogoji/)`, { base: BASE });
  assert.ok(!INJECTED_TAG.test(html) && !EVENT_ATTR.test(html), html);
  assert.ok(!/href="javascript:/i.test(html), html);
  assert.ok(html.includes('<strong>b</strong>'));
  assert.ok(html.includes(`href="${BASE}/pogoji/"`), html);
});

await test('Slovenian typesetting keeps one-letter words and numbers with the next word', () => {
  assert.equal(typo('Doma ali v najetem prostoru'), 'Doma ali v najetem prostoru');
  assert.equal(typo('a v hiši'), 'a v hiši');
  assert.equal(typo('do 10 otrok · 1,5 ure'), 'do 10 otrok · 1,5 ure');
  assert.equal(typo('od 150 €'), 'od 150 €');
});

await test('Hostile settings render without executable markup', () => {
  const files = site(hostileSettings());
  for (const [file, contents] of Object.entries(files)) {
    if (!/\.(html|xml)$/.test(file)) continue;
    assert.ok(!INJECTED_TAG.test(contents), `${file}: injected element`);
    // Attribute values are always double-quoted and escaped, so blank them out and look at attribute names only.
    assert.ok(!EVENT_ATTR.test(contents.replace(/"[^"]*"/g, '""')), `${file}: inline event handler`);
    assert.ok(!/(href|src|action)="\s*javascript:/i.test(contents), `${file}: javascript: URL`);
    assert.ok(!/\ssrc="(data:|https?:)/i.test(contents), `${file}: image from settings is not a local file`);
    assert.ok(!/\sstyle="/.test(contents), `${file}: inline style`);
    const ld = contents.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ld) assert.doesNotThrow(() => JSON.parse(ld[1]), `${file}: structured data is not valid JSON`);
  }
  const css = files['assets/css/theme.css'];
  assert.ok(!css.includes('<') && !css.includes('javascript'), 'theme.css contains markup or javascript');
  const preview = renderPage(normalizeSettings(hostileSettings()), 'home', 'sl', { preview: true });
  assert.ok(!INJECTED_TAG.test(preview) && !/\sstyle="/.test(preview), 'the admin preview is just as safe');
});

await test('Hostile settings normalise to safe values', () => {
  const s = normalizeSettings(hostileSettings());
  assert.equal(s.site.url, DEFAULT_SETTINGS.site.url);
  assert.equal(s.theme.colors.bg, DEFAULT_SETTINGS.theme.colors.bg);
  assert.equal(s.theme.colors.coral, DEFAULT_SETTINGS.theme.colors.coral);
  assert.equal(s.theme.garland, DEFAULT_SETTINGS.theme.garland);
  assert.deepEqual(s.hero.photos.map((p) => p.src), ['', ''], 'only uploaded files, and at most two photos');
  assert.equal(s.hero.showDate, DEFAULT_SETTINGS.hero.showDate);
  assert.equal(s.hero.secondary.target, DEFAULT_SETTINGS.hero.secondary.target);
  assert.equal(s.header.logo, '', 'images must be uploaded files, not remote URLs');
  assert.equal(s.header.logoHeight, DEFAULT_SETTINGS.header.logoHeight);
  assert.equal(s.services.items[0].image, '');
  assert.equal(s.services.items[0].icon, 'star');
  assert.equal(s.steps.items[0].icon, 'star');
  assert.equal(s.schedule.photo, '');
  assert.equal(s.schedule.facts[0].icon, 'check');
  assert.equal(s.schedule.items[0].day, 'mon');
  assert.equal(s.about.photo, '');
  assert.equal(s.about.badges[0].icon, 'check');
  assert.equal(s.gallery.images[1].src, '');
  assert.equal(s.testimonials.ratingUrl, '');
  assert.equal(s.contact.phone, '');
  assert.equal(s.contact.email, '');
  assert.equal(s.contact.mapUrl, '');
  assert.equal(s.socials[0].url, '', 'javascript: URL is dropped');
  assert.equal(s.socials[1].platform, 'website');
  assert.deepEqual(s.languages.hr.flags, ['hr'], 'unknown, repeated and Serbian flags are dropped');
  assert.equal(s.sections.length, DEFAULT_SETTINGS.sections.length, 'unknown section ids are dropped');
  assert.equal(s.form.custom.action, '');
  assert.deepEqual(s.form.topics, { party: true, sport: true, event: true }, 'non-boolean toggles fall back to the default');
  assert.equal(s.form.ask.time, true);
  assert.equal(resolveProvider(s.form, s.contact.email).ready, false, 'unsafe form action is rejected');
  assert.equal(s.privacy.effectiveDate, DEFAULT_SETTINGS.privacy.effectiveDate);
});

await test('Default settings are stable', () => {
  assert.deepEqual(normalizeSettings(DEFAULT_SETTINGS), DEFAULT_SETTINGS);
});

await test('The form always asks about something', () => {
  const s = normalizeSettings({ ...DEFAULT_SETTINGS, form: { ...DEFAULT_SETTINGS.form, topics: { party: false, sport: false, event: false } } });
  assert.equal(s.form.topics.party, true);
});

await test('Nothing made up goes live: no reviews, prices, credentials or schedules; sample photos are credited and flagged', async () => {
  const d = DEFAULT_SETTINGS;
  assert.equal(d.testimonials.items.length, 0);
  assert.ok(d.packages.items.every((p) => !p.price.sl));
  assert.equal(d.about.badges.length, 0);
  assert.equal(d.schedule.items.length, 0);
  const n = normalizeSettings(d);
  const samples = samplePhotosInUse(n);
  assert.ok(samples.length >= 9 && samples.every(isSample));
  assert.equal(setupChecklist(n).find((c) => c.id === 'samples').done, false, 'the overview asks to replace the sample photos');
  const credits = await readFile(new URL('../public/assets/img/sample/CREDITS.txt', import.meta.url), 'utf8');
  for (const path of new Set(samples)) {
    assert.ok(credits.includes(path.split('/').pop()), `${path} is credited`);
    await access(new URL(`../public${path}`, import.meta.url));
  }
  const files = site(d);
  assert.ok(!files['index.html'].includes('class="note '), 'no reviews by default');
  assert.match(files['index.html'], /<meta name="robots" content="noindex, nofollow">/);
  assert.equal(files['robots.txt'], 'User-agent: *\nDisallow: /\n');
});

await test('Every language gets its pages, with the right lang, alternates and switch', () => {
  const files = site(DEFAULT_SETTINGS);
  for (const f of ['index.html', 'zasebnost/index.html', 'hvala/index.html', 'en/index.html', 'en/privacy/index.html', 'en/thank-you/index.html', 'hr/index.html', 'hr/privatnost/index.html', 'hr/hvala/index.html', 'sr/index.html', 'sr/privatnost/index.html', 'sr/hvala/index.html', '404.html']) {
    assert.ok(files[f], `missing ${f}`);
  }
  assert.match(files['en/index.html'], /<html lang="en"/);
  assert.match(files['hr/index.html'], /<html lang="hr"/);
  assert.match(files['sr/index.html'], /<html lang="sr"/);
  assert.match(files['index.html'], /hreflang="en" href="https:\/\/elarion-game-dev\.github\.io\/otrosko-animiranje-ema\/en\/"/);
  assert.match(files['index.html'], /hreflang="hr" href="[^"]+\/hr\/"/);
  assert.match(files['index.html'], /hreflang="sr" href="[^"]+\/sr\/"/);
  assert.match(files['index.html'], /hreflang="x-default" href="https:\/\/elarion-game-dev\.github\.io\/otrosko-animiranje-ema\/"/);
  assert.match(files['en/privacy/index.html'], new RegExp(`<a href="${BASE}/zasebnost/" hreflang="sl"`));
  assert.ok(files['en/index.html'].includes('Birthday parties for children, full of games'));
  assert.ok(files['hr/index.html'].includes('Rođendanske zabave za djecu, pune igara'));
  assert.ok(files['sr/index.html'].includes('Рођенданске забаве за децу, пуне игара'), 'Serbian is shown in Cyrillic');
  assert.ok(files['en/index.html'].includes('id="booking"') && files['index.html'].includes('id="rezervacija"'), 'section anchors are in the page language');
});

await test('Languages carry their flags; Croatian shows the chosen ones', () => {
  const html = site(DEFAULT_SETTINGS)['index.html'];
  for (const code of ['si', 'gb', 'hr', 'rs']) assert.ok(html.includes(`<symbol id="flag-${code}"`), `flag ${code} in the sprite`);
  assert.ok(html.includes('<use href="#flag-si"/>') && html.includes('<use href="#flag-gb"/>'));
  assert.ok(html.includes('<use href="#flag-hr"/>') && html.includes('<use href="#flag-rs"/>'));
  const s = structuredClone(DEFAULT_SETTINGS);
  s.languages.hr.flags = ['hr', 'ba'];
  assert.match(site(s)['index.html'], /class="flags is-multi"[^>]*><span class="flag"><svg[^>]*><use href="#flag-hr"\/><\/svg><\/span><span class="flag"><svg[^>]*><use href="#flag-ba"\/>/);
  s.languages.hr.flags = ['ba'];
  const one = site(s)['index.html'];
  assert.ok(one.includes('<symbol id="flag-ba"') && !one.includes('<symbol id="flag-hr"'));
});

await test('A switched-off language has no pages, flags or switch', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.languages.hr.enabled = false;
  const files = site(s);
  assert.ok(!Object.keys(files).some((f) => f.startsWith('hr/')));
  assert.ok(!files['index.html'].includes('hreflang="hr"') && !files['index.html'].includes('flag-hr'));
  s.languages.sr.enabled = false;
  s.languages.en.enabled = false;
  const html = site(s)['index.html'];
  assert.ok(!html.includes('lang-switch') && !html.includes('class="sprite"'), 'no switch and no flags with one language');
});

await test('Untranslated texts fall back to Slovenian and are counted', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.hero.title.en = '';
  s.faq.items[0].a.hr = '';
  const n = normalizeSettings(s);
  assert.ok(site(s)['en/index.html'].includes('najlepšo'));
  assert.deepEqual(missingTranslations(n, 'en').map((m) => m.path), ['hero.title']);
  assert.deepEqual(missingTranslations(n, 'hr').map((m) => m.path), ['faq.items.0.a']);
  assert.deepEqual(missingTranslations(normalizeSettings(DEFAULT_SETTINGS), 'en'), [], 'defaults are fully translated');
  assert.deepEqual(missingTranslations(normalizeSettings(DEFAULT_SETTINGS), 'hr'), []);
  assert.deepEqual(missingTranslations(normalizeSettings(DEFAULT_SETTINGS), 'sr'), []);
  assert.ok(i18nFields(n).length > 100);
});

await test('Every link and file uses the base path; a domain of its own needs none', () => {
  const s = withContact(DEFAULT_SETTINGS, { phone: '041 123 456', email: 'ema@example.com' });
  const files = site(s);
  for (const [file, html] of Object.entries(files)) {
    if (!file.endsWith('.html')) continue;
    const bad = [...html.matchAll(/(?:href|src|action)="(\/[^"]*)"/g)].map((m) => m[1]).filter((u) => !u.startsWith(`${BASE}/`));
    assert.deepEqual(bad, [], `${file}: links without the base path`);
  }
  const own = site({ ...s, site: { ...s.site, url: 'https://www.ema.si' } });
  assert.match(own['index.html'], /href="\/assets\/css\/site\.css\?v=v"/);
  assert.match(own['index.html'], /<link rel="canonical" href="https:\/\/www\.ema\.si\/">/);
  assert.match(own['index.html'], /<meta property="og:image" content="https:\/\/www\.ema\.si\/assets\/img\/sample\/share\.jpg">/);
});

await test('Content Security Policy is strict and names only the form service', () => {
  const s = withContact(withForm(DEFAULT_SETTINGS, { provider: 'formspree', formspree: { formId: 'https://formspree.io/f/abcd1234' } }), { email: 'ema@example.com' });
  const html = site(s)['index.html'];
  const csp = decode(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /style-src 'self'(;|$)/);
  assert.match(csp, /connect-src https:\/\/formspree\.io(;|$)/);
  assert.match(csp, /form-action 'self' https:\/\/formspree\.io(;|$)/);
  assert.match(csp, /base-uri 'none'/);
  assert.ok(!csp.includes('unsafe'), 'no unsafe-* sources');
  assert.match(html, /action="https:\/\/formspree\.io\/f\/abcd1234" accept-charset="utf-8" data-inquiry data-responds="json"/);
});

await test('Email-app form needs an address, and then only allows mailto:', () => {
  const closed = site(DEFAULT_SETTINGS)['index.html'];
  assert.ok(!closed.includes('data-inquiry') && closed.includes('form-closed'), 'without an email the form shows a notice');
  assert.ok(!closed.includes('id="hero-date"'), 'no date picker on the invitation while the form is closed');
  const s = withContact(DEFAULT_SETTINGS, { email: 'ema@example.com' });
  const html = site(s)['index.html'];
  const csp = decode(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'self' mailto:/);
  assert.match(html, /action="mailto:ema@example\.com" enctype="text\/plain"/);
  assert.ok(html.includes('id="hero-date"'), 'the invitation offers a date once the form works');
});

await test('Booking form: topics, optional questions, required fields and a honeypot', () => {
  const s = withContact(DEFAULT_SETTINGS, { email: 'ema@example.com' });
  let html = site(s)['index.html'];
  for (const t of ['party', 'sport', 'event']) assert.ok(html.includes(`data-for="${t}"`), `topic ${t}`);
  assert.match(html, /<input type="radio" name="zanima" value="Rojstni dan" data-topic="party" checked>/);
  assert.match(html, /name="ime" type="text"[^>]*required/);
  assert.match(html, /name="kontakt" type="text"[^>]*required/);
  assert.match(html, /id="f-p-date" name="datum" type="date" data-need/);
  assert.match(html, /data-honeypot/);
  assert.match(html, /<option value="Veliki paket">Veliki paket<\/option>/);
  assert.match(html, /data-paket="Veliki paket"/, 'package buttons preselect their package');
  assert.ok(html.includes('name="cas"') && html.includes('name="odgovor"') && html.includes('name="kje"') && html.includes('name="kraj"'));
  assert.ok(!/<(input|select|textarea)[^>]*name="[^"]*(otrok_ime|ime_otroka)/.test(html), 'never asks for children’s names');

  s.form = { ...s.form, topics: { party: true, sport: false, event: false }, ask: { time: false, where: false, town: false, reply: false } };
  html = site(s)['index.html'];
  assert.ok(!html.includes('data-for="sport"') && !html.includes('name="cas"') && !html.includes('name="odgovor"') && !html.includes('name="kje"'));
  assert.match(html, /<input type="hidden" name="zanima" value="Rojstni dan" data-topic="party">/, 'one topic needs no choice');

  const noClasses = withContact(structuredClone(DEFAULT_SETTINGS), { email: 'ema@example.com' });
  sectionOf(noClasses, 'schedule').enabled = false;
  assert.ok(!site(noClasses)['index.html'].includes('data-for="sport"'), 'sports classes need their section');

  const slots = withContact(structuredClone(DEFAULT_SETTINGS), { email: 'ema@example.com' });
  slots.schedule.items = [{ title: { sl: '4–6 let', en: '', hr: '', sr: '' }, day: 'tue', when: { sl: '', en: '', hr: '', sr: '' }, time: '17.00', place: { sl: '', en: '', hr: '', sr: '' }, note: { sl: '', en: '', hr: '', sr: '' } }];
  const withSlots = site(slots)['index.html'];
  assert.match(withSlots, /<option value="Ob torkih ob 17\.00 · 4–6 let">/);
  assert.match(withSlots, /<span class="day">Ob torkih<\/span><span class="time">17\.00<\/span>/);
});

await test('Privacy policy lists exactly what the form asks', () => {
  const s = withContact(DEFAULT_SETTINGS, { email: 'ema@example.com' });
  const all = site(s)['zasebnost/index.html'];
  assert.ok(all.includes('starost otroka') && all.includes('število otrok') && all.includes('vrsta dogodka'));
  s.form = { ...s.form, topics: { party: true, sport: false, event: false }, ask: { time: false, where: false, town: false, reply: false } };
  const fewer = site(s)['zasebnost/index.html'];
  assert.ok(!fewer.includes('vrsta dogodka') && !fewer.includes('okvirna ura') && !fewer.includes('kako želite odgovor'));
});

await test('Contact tiles and the quick bar follow the phone number', () => {
  const none = site(DEFAULT_SETTINGS)['index.html'];
  assert.ok(!none.includes('wa.me') && !none.includes('class="quick'));
  const html = site(withContact(DEFAULT_SETTINGS, { phone: '041 123 456', viber: false }))['index.html'];
  assert.match(html, /href="tel:\+38641123456"/);
  assert.match(html, /href="https:\/\/wa\.me\/38641123456"/);
  assert.ok(!html.includes('viber://'), 'viber switched off');
  assert.match(html, /<aside class="mbar"[^>]*><a class="btn icon-btn" href="tel:\+38641123456">/);
  const off = withContact(DEFAULT_SETTINGS, { phone: '041 123 456' });
  off.floating = { ...off.floating, enabled: false };
  assert.ok(!site(off)['index.html'].includes('class="mbar"'));
});

await test('Sections: switched-off and empty ones leave the page and the menu', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  const live = site(s)['index.html'];
  assert.ok(!live.includes('id="ponudba"') && !live.includes('href="#ponudba"'), 'extra services are off by default');
  assert.ok(!live.includes('id="mnenja"'), 'reviews are hidden until there are some');
  const preview = renderPage(normalizeSettings(s), 'home', 'sl', { preview: true });
  assert.ok(preview.includes('class="preview-empty"'), 'the preview explains empty sections');
  sectionOf(s, 'faq').enabled = false;
  s.gallery.images = [{ src: '/assets/uploads/a.webp', alt: { sl: 'Balon', en: '', hr: '', sr: '' }, caption: { sl: 'Baloni!', en: '', hr: '', sr: '' } }];
  const after = site(s)['index.html'];
  assert.ok(!after.includes('id="vprasanja"') && !after.includes('href="#vprasanja"'));
  assert.ok(after.includes(`<img src="${BASE}/assets/uploads/a.webp" alt="Balon"`));
  assert.ok(after.includes('data-caption="Baloni!"'));
  s.gallery.images = [];
  assert.ok(!site(s)['index.html'].includes('id="utrinki"'), 'an empty gallery is hidden');
});

await test('Section order follows the settings, and bands keep their scalloped edges', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  const faq = s.sections.findIndex((x) => x.id === 'faq');
  s.sections.unshift(...s.sections.splice(faq, 1));
  const html = site(s)['index.html'];
  assert.ok(html.indexOf('id="vprasanja"') < html.indexOf('id="program"'));
  assert.match(html, /<section class="band sec-packages"[^>]*data-bg="band">/);
  assert.match(html, /<section class="section sec-faq"[^>]*data-bg="paper">/);
});

await test('Privacy policy names the business, the form service and the supervisory authority', () => {
  const s = withContact(withForm(DEFAULT_SETTINGS, { provider: 'formspree', formspree: { formId: 'abcd1234' } }), { email: 'ema@example.com' });
  s.business = { name: 'Ema Novak s.p.', address: 'Ulica 1, 1000 Ljubljana', registration: '1234567000', taxNumber: '12345678', vatId: '' };
  const files = site(s);
  for (const f of ['zasebnost/index.html', 'en/privacy/index.html', 'hr/privatnost/index.html', 'sr/privatnost/index.html']) {
    assert.ok(files[f].includes('Ema Novak s.p.') && files[f].includes('Formspree') && files[f].includes('ip-rs.si'), f);
  }
  assert.match(files['index.html'], /Matična številka: 1234567000/);
});

await test('Every preset passes WCAG AA for text and buttons, and derived colours stay readable', () => {
  for (const [id, preset] of Object.entries(PRESETS)) {
    for (const check of contrastReport(preset.colors)) assert.ok(check.pass, `${id}: ${check.label} is ${check.ratio.toFixed(2)}:1`);
    const c = preset.colors;
    const vars = themeColors(c);
    assert.ok(contrast(vars['--danger'], c.bg) >= 4.5, `${id}: error text ${vars['--danger']}`);
    for (const key of ['coral', 'gold', 'sage', 'sky', 'lilac']) assert.ok(contrast(vars[`--${key}-ink`], c.surface) >= 4.5, `${id}: ${key} text on cards`);
    assert.ok(contrast(vars['--field'], c.surface) >= 3 && contrast(vars['--field'], c.bg) >= 3, `${id}: form field borders`);
    assert.ok(contrast(vars['--on-footer-2'], vars['--footer']) >= 4.5, `${id}: footer text`);
  }
});

await test('Theme CSS carries the fonts from the base path and the derived colours', () => {
  const css = site(DEFAULT_SETTINGS)['assets/css/theme.css'];
  assert.match(css, new RegExp(`url\\('${BASE}/assets/fonts/dm-serif-display-latin-400-normal\\.woff2'\\)`));
  assert.match(css, /font-style: italic;/, 'italic headings use the real italic');
  assert.match(css, /caveat-latin-700-normal\.woff2/, 'the handwriting font is always there');
  assert.match(css, /--coral-50: #[0-9a-f]{6};/);
  assert.match(css, /--sky-ink: #[0-9a-f]{6};/);
  const bolder = site({ ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, colors: { ...DEFAULT_SETTINGS.theme.colors, coral: '#ff0000' } } })['assets/css/theme.css'];
  assert.match(bolder, /--coral: #ff0000;/);
});

await test('Decorations can be switched off', () => {
  const on = site(DEFAULT_SETTINGS)['index.html'];
  assert.ok(on.includes('class="garland"') && on.includes('class="hero confetti"') && on.includes('data-edges="scallop"') && on.includes('data-motion="on"'));
  const s = structuredClone(DEFAULT_SETTINGS);
  s.theme = { ...s.theme, garland: false, confetti: false, scallops: false, animations: false };
  const off = site(s)['index.html'];
  assert.ok(!off.includes('class="garland"') && !off.includes(' confetti"') && off.includes('data-edges="plain"') && off.includes('data-motion="off"'));
});

await test('Click-to-edit markers only in the preview', () => {
  const n = normalizeSettings(DEFAULT_SETTINGS);
  assert.ok(!site(DEFAULT_SETTINGS)['index.html'].includes('data-edit'));
  const preview = renderPage(n, 'home', 'en', { preview: true });
  assert.ok(preview.includes('data-edit="hero.title"') && preview.includes('data-preview'));
  assert.ok(preview.includes('data-edit="hero.photos.0.src"') && preview.includes('data-edit="steps.items.0.title"'));
  const s = structuredClone(DEFAULT_SETTINGS);
  s.hero.title.en = '';
  assert.match(renderPage(normalizeSettings(s), 'home', 'en', { preview: true }), /data-edit="hero\.title"[^>]*data-missing/);
});

await test('Privacy policy never names an empty form service', () => {
  const check = (s, label) => {
    const files = site(s);
    for (const file of ['zasebnost/index.html', 'en/privacy/index.html', 'hr/privatnost/index.html', 'sr/privatnost/index.html']) {
      assert.doesNotMatch(files[file], /(storitvi|to|servisu) ,|<p>\s*<\/p>/, `${label}: ${file}`);
    }
  };
  check(DEFAULT_SETTINGS, 'no email yet');
  check(withForm(DEFAULT_SETTINGS, { provider: 'formspree', formspree: { formId: 'not an id' } }), 'Formspree with an invalid id');
  const ready = site(withContact(DEFAULT_SETTINGS, { email: 'ema@example.si' }));
  assert.match(ready['zasebnost/index.html'], /se odpre vaš e-poštni program/);
});

await test('Search engines get the brand name, with the registered business as its legal name', () => {
  const ld = (s) => JSON.parse(site(s)['index.html'].match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const plain = ld(DEFAULT_SETTINGS);
  assert.equal(plain.name, DEFAULT_SETTINGS.site.name);
  assert.equal(plain.legalName, undefined);
  const s = structuredClone(DEFAULT_SETTINGS);
  s.business = { name: 'Ema Novak s.p.', address: 'Glavna 1\n1000 Ljubljana', registration: '1234567000', taxNumber: '12345678', vatId: 'SI12345678' };
  const full = ld(s);
  assert.equal(full.name, DEFAULT_SETTINGS.site.name);
  assert.equal(full.legalName, 'Ema Novak s.p.');
  assert.equal(full.taxID, '12345678');
  assert.equal(full.vatID, 'SI12345678');
  assert.equal(full.address.streetAddress, 'Glavna 1, 1000 Ljubljana');
});

await test('Phones get PNG home-screen icons; an uploaded icon replaces them', () => {
  const files = site(DEFAULT_SETTINGS);
  assert.match(files['index.html'], new RegExp(`<link rel="apple-touch-icon" href="${BASE}/assets/img/icon-180\\.png\\?v=v">`));
  const icons = JSON.parse(files['site.webmanifest']).icons;
  assert.deepEqual(icons.filter((i) => i.type === 'image/png').map((i) => `${i.sizes} ${i.purpose ?? 'any'}`), ['192x192 any', '512x512 any', '512x512 maskable']);
  assert.ok(icons.every((i) => i.src.endsWith('?v=v')), 'icons are versioned');
  for (const size of ICON_SIZES) {
    const png = iconPng(normalizeSettings(DEFAULT_SETTINGS).theme.colors, size);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const custom = structuredClone(DEFAULT_SETTINGS);
  custom.theme.favicon = '/assets/img/uploads/ikona.png';
  const withIcon = site(custom);
  assert.match(withIcon['index.html'], /<link rel="apple-touch-icon" href="[^"]*\/uploads\/ikona\.png">/);
  assert.equal(JSON.parse(withIcon['site.webmanifest']).icons.length, 1);
});

await test('Serbian: Cyrillic on the page, Latin where it belongs', () => {
  assert.equal(toCyrillic('Ljubljana, NJIVA, džep, Šta ćete?'), 'Љубљана, ЊИВА, џеп, Шта ћете?');
  assert.equal(toCyrillic('Pišite na Viber ili WhatsApp. Više u {privacy}.'), 'Пишите на Viber или WhatsApp. Више у {privacy}.');
  assert.equal(toCyrillic('[link](https://example.com/a-b) <a href="https://x.si">x</a> ema@example.com'), '[линк](https://example.com/a-b) <a href="https://x.si">x</a> ema@example.com');
  assert.equal(toCyrillic('Већ ћирилица'), 'Већ ћирилица');
  assert.equal(toCyrillic('Otroško animiranje Ema | Dečje zabave', ['Otroško animiranje Ema']), 'Otroško animiranje Ema | Дечје забаве');
  const files = site(DEFAULT_SETTINGS);
  const sr = files['sr/index.html'];
  assert.ok(sr.includes('Otroško animiranje Ema'), 'the site name stays in Latin');
  assert.ok(!/>[^<]*(Proverite|Rođendan|zabav)[^<]*</.test(sr), 'no Latin Serbian text left on the page');
  assert.ok(files['sr/privatnost/index.html'].includes('Ваша права'));
  assert.match(sr, /<link rel="preload" href="[^"]+prata-cyrillic-400-normal\.woff2"/, 'the Serbian page preloads the Cyrillic heading font');
  assert.match(files['hr/index.html'], /<link rel="preload" href="[^"]+dm-serif-display-latin-400-normal\.woff2"/);
  // An untranslated Serbian text shows the Croatian one, in Cyrillic.
  const s = structuredClone(DEFAULT_SETTINGS);
  s.hero.text.sr = '';
  assert.ok(site(s)['sr/index.html'].includes('Рођенданске забаве за дјецу'));
  // Cyrillic font files only for Cyrillic letters, so other pages never download them.
  const css = themeCss(normalizeSettings(DEFAULT_SETTINGS).theme);
  assert.match(css, /src: url\('\/assets\/fonts\/prata-cyrillic-400-normal\.woff2'\) format\('woff2'\);\n  unicode-range: U\+0301,U\+0400-045F/);
});

await test('Settings from before Croatian and Serbian were split move to Croatian', () => {
  const old = structuredClone(DEFAULT_SETTINGS);
  old.schemaVersion = 2;
  old.languages = { en: old.languages.en, sh: { enabled: false, label: 'Hrvatski / Srpski', short: 'HR/SR', flags: ['hr', 'rs', 'ba'] } };
  old.hero.text = { sl: 'Zabave', en: 'Parties', sh: 'Zabave za djecu' };
  old.faq.items[0].q = { sl: 'Vprašanje?', en: 'Question?', sh: 'Pitanje?' };
  const n = normalizeSettings(old);
  assert.equal(n.schemaVersion, 3);
  assert.deepEqual(n.languages.hr, { enabled: false, label: 'Hrvatski', short: 'HR', flags: ['hr', 'ba'] });
  assert.equal(n.languages.sr.enabled, false);
  assert.deepEqual(n.hero.text, { sl: 'Zabave', en: 'Parties', hr: 'Zabave za djecu', sr: '' });
  assert.equal(n.faq.items[0].q.hr, 'Pitanje?');
  assert.ok(!JSON.stringify(n).includes('"sh"'));
});

await test('Terms draft: never published by itself, placeholders flagged until filled in', () => {
  assert.equal(DEFAULT_SETTINGS.terms.enabled, false);
  assert.equal(Object.keys(site(DEFAULT_SETTINGS)).some((f) => /pogoji|terms|uvjeti/.test(f)), false);
  for (const lang of LANGS) assert.ok(placeholders(TERMS_DRAFT[lang]).length >= 5, lang);
  assert.deepEqual(placeholders('[povezava](https://ema.si) in [znesek] €'), ['[znesek]']);
  const s = structuredClone(DEFAULT_SETTINGS);
  s.terms = { ...s.terms, enabled: true, body: structuredClone(TERMS_DRAFT) };
  const files = site(s);
  assert.match(files['pogoji/index.html'], /<h3>Odpoved in sprememba termina<\/h3>/);
  assert.match(files['en/terms/index.html'], /<li>Food, drinks and the cake are up to you\.<\/li>/);
  assert.match(files['sr/uslovi/index.html'], /<li>За храну, пиће и торту побрините се сами\.<\/li>/);
  assert.match(files['index.html'], new RegExp(`href="${BASE}/pogoji/"`));
  const item = (x) => setupChecklist(normalizeSettings(x)).find((i) => i.id === 'terms');
  assert.equal(item(s).done, false);
  for (const lang of LANGS) s.terms.body[lang] = s.terms.body[lang].replace(/\[[^\]\n]+\](?!\()/g, '7');
  assert.equal(item(s).done, true);

  // A switched-off language does not hold the checklist back.
  const off = structuredClone(s);
  off.terms.body.hr = TERMS_DRAFT.hr;
  assert.equal(item(off).done, false);
  off.languages.hr.enabled = false;
  assert.equal(item(off).done, true);

  // Switched on but empty: no page, no footer link, not done.
  const empty = structuredClone(DEFAULT_SETTINGS);
  empty.terms.enabled = true;
  const emptyFiles = site(empty);
  assert.equal(Object.keys(emptyFiles).some((f) => /pogoji|terms|uvjeti/.test(f)), false);
  assert.doesNotMatch(emptyFiles['index.html'], /\/pogoji\//);
  assert.equal(item(empty).done, false);
});

await test('Form messages keep the number and date for the browser to fill in', () => {
  const files = site(withContact(DEFAULT_SETTINGS, { email: 'ema@example.si' }));
  assert.match(files['index.html'], /data-msg-kidsmax="Za več kot \{n\} otrok/);
  assert.match(files['index.html'], /data-msg-added="Datum \{d\} je dodan/);
  assert.match(files['en/index.html'], /data-msg-added="The date \{d\} has been added/);
  assert.doesNotMatch(files['index.html'], /\{(name|phone|privacy)\}/);
});

await test('Photos come in sizes that fit their frames; the lightbox still opens the full photo', async () => {
  assert.equal(renditionPath('/assets/uploads/a-k3j.webp', 480), '/assets/uploads/a-k3j-480w.webp');
  assert.deepEqual(renditionWidths(1800), [320, 480, 800]);
  assert.deepEqual(renditionWidths(900), [320, 480], 'no copy within 15% of the photo itself');
  assert.deepEqual(renditionWidths(360), []);

  const sample = (file) => readFile(new URL(`../public/assets/img/sample/${file}`, import.meta.url));
  assert.equal(imageWidth(await sample('hero-party.webp')), 600);
  assert.equal(imageWidth(await sample('share.jpg')), 1200);
  assert.equal(imageWidth(iconPng(DEFAULT_SETTINGS.theme.colors, 180)), 180);
  assert.equal(imageWidth(Buffer.from('not an image, only some text that is long enough')), 0);

  // The build finds the copies next to a photo: smallest first, the photo itself last.
  const dir = await mkdtemp(path.join(tmpdir(), 'renditions-'));
  try {
    await mkdir(path.join(dir, 'assets', 'uploads'), { recursive: true });
    await writeFile(path.join(dir, 'assets', 'uploads', 'a.webp'), await sample('gallery-cake.webp'));
    await writeFile(path.join(dir, 'assets', 'uploads', 'a-480w.webp'), await sample('gallery-cake-480w.webp'));
    await writeFile(path.join(dir, 'assets', 'uploads', 'b.webp'), await sample('gallery-cake.webp'));
    assert.deepEqual(await findRenditions(dir), { '/assets/uploads/a.webp': [['/assets/uploads/a-480w.webp', 480], ['/assets/uploads/a.webp', 900]] });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  // The sample photos ship with their copies, so the default site gets them too.
  const photos = [...new Set(samplePhotosInUse(normalizeSettings(DEFAULT_SETTINGS)))].filter((p) => p.endsWith('.webp'));
  assert.ok(photos.length >= 8);
  for (const p of photos) {
    const width = imageWidth(await readFile(new URL(`../public${p}`, import.meta.url)));
    for (const w of renditionWidths(width)) await access(new URL(`../public${renditionPath(p, w)}`, import.meta.url));
  }

  const s = structuredClone(DEFAULT_SETTINGS);
  s.gallery.images = [{ src: '/assets/uploads/a.webp', alt: { sl: 'Torta', en: '', hr: '', sr: '' }, caption: { sl: '', en: '', hr: '', sr: '' } }];
  const images = { '/assets/uploads/a.webp': [['/assets/uploads/a-480w.webp', 480], ['/assets/uploads/a.webp', 900]] };
  const html = renderSite(normalizeSettings(s), { version: 'v', images })['index.html'];
  const u = `${BASE}/assets/uploads`;
  assert.ok(html.includes(`<a class="polaroid" href="${u}/a.webp"`), 'the lightbox opens the full photo');
  assert.ok(html.includes(`<img src="${u}/a.webp" alt="Torta" srcset="${u}/a-480w.webp 480w, ${u}/a.webp 900w" sizes="(max-width: 47.5em) calc(58vw - 20px), 200px" loading="lazy"`));
  assert.ok(!site(s)['index.html'].includes('srcset='), 'a photo without copies is a plain <img>');
  // Photos on the first screen load right away, without jumping ahead of the styles and fonts.
  const hero = html.match(/<section class="hero[\s\S]*?<\/section>/)[0];
  assert.match(hero, /<img [^>]*decoding="async">/);
  assert.doesNotMatch(hero, /loading="lazy"|fetchpriority/);
});

// The editor and the page script only run in the browser, so nothing else would notice a module that fails to
// parse (a name declared twice) or imports a name its source no longer exports: the editor would just be blank.
await test('Browser modules parse and every named import exists', async () => {
  const { execFileSync } = await import('node:child_process');
  const { readdirSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const here = (p) => new URL(`../${p}`, import.meta.url);
  const files = [...readdirSync(here('public/admin')).filter((f) => f.endsWith('.js')).map((f) => `public/admin/${f}`), 'public/assets/js/site.js'];
  for (const file of files) {
    execFileSync(process.execPath, ['--check', fileURLToPath(here(file))], { stdio: 'pipe' });
    const source = await readFile(here(file), 'utf8');
    for (const [, names, spec] of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)) {
      // The editor imports the shared modules from where the build publishes them (assets/lib = src/).
      const target = spec.startsWith('../assets/lib/') ? `src/${spec.slice('../assets/lib/'.length)}` : path.posix.join(path.posix.dirname(file), spec);
      if (target.endsWith('deploy.mjs')) continue; // written by the build
      const exported = await readFile(here(target), 'utf8');
      for (const name of names.split(',').map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean)) {
        assert.match(exported, new RegExp(`export\\s+(?:async\\s+)?(?:const|let|function\\*?|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`), `${file} imports ${name} from ${spec}, which does not export it`);
      }
    }
  }
});

await test('Editor passwords: long, not guessable, and suggested ones always pass', async () => {
  assert.ok(MIN_PASSWORD >= 15);
  for (const weak of ['kratko-geslo', 'aaaaaaaaaaaaaaaaaaaa', 'abababababababab', 'Ema2026rojstni!x', 'moje-geslo-za-stran', 'otrosko-animiranje', 'zebra-kompas-1987x', 'ema-balon-torta-zmaj', 'qwertzuiop-zmaj!']) {
    assert.ok(passwordProblem(weak), `${weak} is refused`);
  }
  assert.equal(passwordProblem('tema-sonce-kolo-gozd'), '', 'a word that merely contains "ema" is fine');
  assert.ok(WORDS.length >= 256 && WORDS.every((w) => /^[a-z]{3,12}$/.test(w)) && new Set(WORDS).size === WORDS.length, 'word list: 256+ unique plain words');
  for (let i = 0; i < 2000; i++) {
    const p = suggestPassword();
    assert.match(p, /^([a-z]+-){5}\d\d$/);
    assert.equal(passwordProblem(p), '', `suggested ${p} passes`);
  }
  const blob = await encryptToken('github_pat_example', 'zebra-kompas-hruska-boben-lipa-47', 'Ema');
  assert.equal(await decryptToken(blob, 'zebra-kompas-hruska-boben-lipa-47'), 'github_pat_example');
  assert.equal(await decryptToken(blob, 'zebra-kompas-hruska-boben-lipa-48'), null);
});

await test('security.txt only on a domain of its own, with a valid Expires', () => {
  const repo = { owner: 'elarion-game-dev', repo: 'otrosko-animiranje-ema', branch: 'main' };
  const now = new Date('2026-11-09T12:00:00Z');
  const onPages = renderSite(normalizeSettings(DEFAULT_SETTINGS), { version: 'v', repo, now });
  assert.equal(onPages['.well-known/security.txt'], undefined, 'not under a github.io sub-path');
  const own = structuredClone(DEFAULT_SETTINGS);
  own.site.url = 'https://www.example.si';
  const txt = renderSite(normalizeSettings(own), { version: 'v', repo, now })['.well-known/security.txt'];
  assert.match(txt, /^Contact: https:\/\/github\.com\/elarion-game-dev\/otrosko-animiranje-ema\/security\/advisories\/new$/m);
  assert.match(txt, /^Expires: 2027-11-09T00:00:00Z$/m);
  assert.match(txt, /^Canonical: https:\/\/www\.example\.si\/\.well-known\/security\.txt$/m);
});

await test('content/site.json renders', async () => {
  const committed = normalizeSettings(JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8')));
  const files = renderSite(committed, { version: 'v' });
  assert.ok(files['index.html'].includes('<h1'));
});

console.log(process.exitCode ? 'Some checks failed.' : `All ${passed} checks passed.`);
