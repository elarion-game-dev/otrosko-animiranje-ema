// Security and sanity checks for the renderer. Run with `npm test` (the deploy runs it before every build).
// Feeds hostile values into every kind of setting and asserts nothing unsafe reaches the output.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { markdown } from '../src/markdown.mjs';
import { resolveProvider } from '../src/providers.mjs';
import { renderPage, renderSite } from '../src/render.mjs';
import { DEFAULT_SETTINGS, missingTranslations, normalizeSettings } from '../src/settings.mjs';
import { contrast, contrastReport, PRESETS } from '../src/themes.mjs';
import { basePath, i18nFields, phoneDigits, safeAssetPath, safeUrl } from '../src/util.mjs';

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
const X3 = { sl: XSS, en: XSS, sh: XSS };
// Real (unescaped) markup only: escaped text like "&lt;img onerror=…" is harmless and must not match.
const INJECTED_TAG = /<(script(?! type="(module|application\/ld\+json)")|img src=x|svg onload|iframe|object|embed)\b/i;
const EVENT_ATTR = /<[a-z][^>]*\son[a-z]+\s*=/i;
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const BASE = '/otrosko-animiranje-ema';
const site = (s) => renderSite(normalizeSettings(s), { version: 'v' });
const withForm = (s, form) => ({ ...s, form: { ...s.form, ...form } });
const withContact = (s, contact) => ({ ...s, contact: { ...s.contact, ...contact } });

function hostileSettings() {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.site.name = XSS;
  s.site.url = EVIL_URL;
  s.languages.en.label = XSS;
  s.languages.sh.short = XSS;
  s.announcement = { enabled: true, text: X3, linkLabel: X3, target: 'url', url: EVIL_URL, style: '"><script>' };
  s.header = { logo: 'https://evil.example/logo.png', logoHeight: '1px; background:url(javascript:alert(1))', showName: true, sticky: true, cta: { enabled: true, label: X3, target: 'url', url: EVIL_URL } };
  s.hero = { ...s.hero, layout: '"><script>', badge: X3, title: X3, text: X3, image: "/x.png') ; background:url(javascript:alert(1)", imageAlt: X3, imageShape: '"><x', overlay: '9;}</style>' };
  s.hero.primary = { label: X3, target: 'url', url: EVIL_URL };
  s.sections = s.sections.map((x) => ({ ...x, heading: X3, menuLabel: X3, intro: X3, enabled: true }));
  s.sections.push({ id: '"><script>', enabled: true, heading: X3 });
  s.services.items = [{ icon: '"><script>', image: 'data:image/svg+xml,<svg onload=alert(1)>', title: X3, text: X3 }];
  s.steps.items = [{ icon: 'nope', title: X3, text: X3 }];
  s.packages = { buttonLabel: X3, note: X3, items: [{ name: X3, price: X3, duration: X3, features: X3, highlight: true, badge: X3 }] };
  s.schedule.items = [{ title: X3, day: '"><script>', when: X3, time: XSS, place: X3, note: X3 }];
  s.about = { text: { sl: `${XSS}\n\n[klik](${EVIL_URL}) [ok](https://example.com)`, en: XSS, sh: XSS }, photo: 'https://evil.example/a.jpg', photoAlt: X3, photoShape: 'x', stats: [{ value: XSS, label: X3 }] };
  s.gallery = { layout: '"><x', images: [{ src: '/assets/uploads/ok.webp', alt: X3 }, { src: 'https://evil.example/b.jpg', alt: X3 }] };
  s.testimonials.items = [{ quote: X3, name: XSS, detail: X3, rating: '5"><x' }];
  s.faq.items = [{ q: X3, a: X3 }];
  s.contact = { phone: XSS, email: XSS, whatsapp: true, viber: true, address: XSS, area: X3, hours: X3, mapUrl: EVIL_URL };
  s.form = {
    ...s.form,
    provider: 'custom',
    custom: { action: EVIL_URL, providerName: XSS, privacyUrl: EVIL_URL, extraName: '"><script>', extraValue: XSS, mode: '"><x' },
    buttonLabel: X3,
    privacyNote: { sl: `${XSS} {privacy}`, en: XSS, sh: XSS },
    successTitle: X3,
    successBody: X3,
    fields: Object.fromEntries(Object.keys(s.form.fields).map((k) => [k, { show: true, required: 'yes', label: X3 }])),
  };
  s.thanks = { title: X3, body: X3 };
  s.floating = { enabled: true, action: '"><x', label: X3, where: 'x', side: 'x' };
  s.footer = { text: X3, showContact: true, showSocials: true, showBusiness: true };
  s.socials = [
    { platform: 'facebook', url: EVIL_URL, label: XSS },
    { platform: '<b>', url: 'https://ok.example', label: XSS },
  ];
  s.business = { name: XSS, address: XSS, registration: XSS, taxNumber: XSS, vatId: XSS };
  s.theme.colors.bg = 'red;}</style><script>alert(1)</script>';
  s.theme.headingFont = '"><x';
  s.theme.pattern = '"><x';
  s.theme.divider = '"><x';
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

await test('Hostile settings render without executable markup', () => {
  const files = site(hostileSettings());
  for (const [file, contents] of Object.entries(files)) {
    if (!/\.(html|xml)$/.test(file)) continue;
    assert.ok(!INJECTED_TAG.test(contents), `${file}: injected element`);
    // Attribute values are always double-quoted and escaped, so blank them out and look at attribute names only.
    assert.ok(!EVENT_ATTR.test(contents.replace(/"[^"]*"/g, '""')), `${file}: inline event handler`);
    assert.ok(!/(href|src|action)="\s*javascript:/i.test(contents), `${file}: javascript: URL`);
    assert.ok(!/\ssrc="(data:|https?:)/i.test(contents), `${file}: image from settings is not a local upload`);
    assert.ok(!/\sstyle="/.test(contents), `${file}: inline style`);
    const ld = contents.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ld) assert.doesNotThrow(() => JSON.parse(ld[1]), `${file}: structured data is not valid JSON`);
  }
  const css = files['assets/css/theme.css'];
  assert.ok(!css.includes('<') && !css.includes('javascript'), 'theme.css contains markup or javascript');
});

await test('Hostile settings normalise to safe values', () => {
  const s = normalizeSettings(hostileSettings());
  assert.equal(s.site.url, DEFAULT_SETTINGS.site.url);
  assert.equal(s.theme.colors.bg, DEFAULT_SETTINGS.theme.colors.bg);
  assert.equal(s.hero.image, '');
  assert.equal(s.header.logo, '', 'images must be uploaded files, not remote URLs');
  assert.equal(s.header.logoHeight, DEFAULT_SETTINGS.header.logoHeight);
  assert.equal(s.services.items[0].image, '');
  assert.equal(s.services.items[0].icon, 'star');
  assert.equal(s.about.photo, '');
  assert.equal(s.gallery.images[1].src, '');
  assert.equal(s.contact.phone, '');
  assert.equal(s.contact.email, '');
  assert.equal(s.contact.mapUrl, '');
  assert.equal(s.socials[0].url, '', 'javascript: URL is dropped');
  assert.equal(s.socials[1].platform, 'website');
  assert.equal(s.sections.length, DEFAULT_SETTINGS.sections.length, 'unknown section ids are dropped');
  assert.equal(s.schedule.items[0].day, 'mon');
  assert.equal(s.form.custom.action, '');
  assert.equal(s.form.fields.email.required, false, 'non-boolean toggles fall back to the default');
  assert.equal(resolveProvider(s.form, s.contact.email).ready, false, 'unsafe form action is rejected');
  assert.equal(s.privacy.effectiveDate, DEFAULT_SETTINGS.privacy.effectiveDate);
});

await test('Default settings are stable', () => {
  assert.deepEqual(normalizeSettings(DEFAULT_SETTINGS), DEFAULT_SETTINGS);
});

await test('Nothing made up goes live by default: no reviews, no photos, no prices, hidden from search engines', () => {
  const d = DEFAULT_SETTINGS;
  assert.equal(d.testimonials.items.length, 0);
  assert.equal(d.gallery.images.length, 0);
  assert.ok(d.packages.items.every((p) => !p.price.sl));
  assert.equal(d.about.stats.length, 0);
  const files = site(d);
  assert.ok(!files['index.html'].includes('class="card testimonial"') && !files['index.html'].includes('data-gallery'));
  assert.match(files['index.html'], /<meta name="robots" content="noindex, nofollow">/);
  assert.equal(files['robots.txt'], 'User-agent: *\nDisallow: /\n');
});

await test('Every language gets its pages, with the right lang, alternates and switch', () => {
  const files = site(DEFAULT_SETTINGS);
  for (const f of ['index.html', 'zasebnost/index.html', 'hvala/index.html', 'en/index.html', 'en/privacy/index.html', 'en/thank-you/index.html', 'sh/index.html', 'sh/privatnost/index.html', 'sh/hvala/index.html', '404.html']) {
    assert.ok(files[f], `missing ${f}`);
  }
  assert.match(files['en/index.html'], /<html lang="en"/);
  assert.match(files['sh/index.html'], /<html lang="sh"/);
  assert.match(files['index.html'], /hreflang="en" href="https:\/\/elarion-game-dev\.github\.io\/otrosko-animiranje-ema\/en\/"/);
  assert.match(files['index.html'], /hreflang="hr" href="[^"]+\/sh\/"/);
  assert.match(files['index.html'], /hreflang="x-default" href="https:\/\/elarion-game-dev\.github\.io\/otrosko-animiranje-ema\/"/);
  assert.match(files['en/privacy/index.html'], new RegExp(`<a href="${BASE}/zasebnost/" hreflang="sl"`));
  assert.ok(files['en/index.html'].includes('Parties the kids will remember'));
  assert.ok(files['sh/index.html'].includes('Zabava koju će djeca pamtiti'));
  assert.ok(files['en/index.html'].includes('id="contact"') && files['index.html'].includes('id="kontakt"'), 'section anchors are in the page language');
});

await test('A switched-off language has no pages and no switch', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.languages.sh.enabled = false;
  const files = site(s);
  assert.ok(!Object.keys(files).some((f) => f.startsWith('sh/')));
  assert.ok(!files['index.html'].includes('hreflang="hr"'));
  s.languages.en.enabled = false;
  assert.ok(!site(s)['index.html'].includes('class="lang-switch"'), 'no switch with one language');
});

await test('Untranslated texts fall back to Slovenian and are counted', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  s.hero.title.en = '';
  s.faq.items[0].a.sh = '';
  const n = normalizeSettings(s);
  assert.ok(site(s)['en/index.html'].includes('Zabava, ki si jo bodo otroci zapomnili'));
  assert.deepEqual(missingTranslations(n, 'en').map((m) => m.path), ['hero.title']);
  assert.deepEqual(missingTranslations(n, 'sh').map((m) => m.path), ['faq.items.0.a']);
  assert.deepEqual(missingTranslations(normalizeSettings(DEFAULT_SETTINGS), 'en'), [], 'defaults are fully translated');
  assert.deepEqual(missingTranslations(normalizeSettings(DEFAULT_SETTINGS), 'sh'), []);
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
  const s = withContact(DEFAULT_SETTINGS, { email: 'ema@example.com' });
  const html = site(s)['index.html'];
  const csp = decode(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'self' mailto:/);
  assert.match(html, /action="mailto:ema@example\.com" enctype="text\/plain"/);
});

await test('Form shows only switched-on fields, with required marks and a honeypot', () => {
  const s = withContact(DEFAULT_SETTINGS, { email: 'ema@example.com' });
  s.form = { ...s.form, fields: { ...s.form.fields, time: { show: false, required: true, label: s.form.fields.time.label }, age: { ...s.form.fields.age, required: true } } };
  const html = site(s)['index.html'];
  assert.ok(!html.includes('name="ura"'), 'hidden field');
  assert.match(html, /name="starost" type="text"[^>]*required/);
  assert.match(html, /name="ime" type="text"[^>]*required/);
  assert.match(html, /data-honeypot/);
  assert.match(html, /<option>Rojstnodnevne zabave<\/option>/);
  assert.match(html, /<optgroup label="Paketi in cene"><option>Mala zabava<\/option>/);
});

await test('Contact buttons and floating button follow the phone number', () => {
  const none = site(DEFAULT_SETTINGS)['index.html'];
  assert.ok(!none.includes('class="float-btn') && !none.includes('wa.me'));
  const html = site(withContact(DEFAULT_SETTINGS, { phone: '041 123 456', viber: false }))['index.html'];
  assert.match(html, /href="tel:\+38641123456"/);
  assert.match(html, /href="https:\/\/wa\.me\/38641123456"/);
  assert.ok(!html.includes('viber://'), 'viber switched off');
  assert.match(html, /class="float-btn float-right float-mobile" href="tel:\+38641123456"/);
});

await test('Sections: switched-off and empty ones leave the page and the menu', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  const live = site(s)['index.html'];
  assert.ok(!live.includes('id="urnik"') && !live.includes('href="#urnik"'), 'schedule is off by default');
  assert.ok(!live.includes('id="galerija"') && !live.includes('href="#galerija"'), 'empty gallery is hidden');
  const preview = renderPage(normalizeSettings(s), 'home', 'sl', { preview: true });
  assert.ok(preview.includes('class="preview-empty"'), 'the preview explains empty sections');
  s.sections.find((x) => x.id === 'faq').enabled = false;
  s.gallery.images = [{ src: '/assets/uploads/a.webp', alt: { sl: 'Balon', en: '', sh: '' } }];
  const after = site(s)['index.html'];
  assert.ok(!after.includes('id="vprasanja"') && !after.includes('href="#vprasanja"'));
  assert.ok(after.includes(`<img src="${BASE}/assets/uploads/a.webp" alt="Balon"`));
});

await test('Section order follows the settings', () => {
  const s = structuredClone(DEFAULT_SETTINGS);
  const faq = s.sections.findIndex((x) => x.id === 'faq');
  s.sections.unshift(...s.sections.splice(faq, 1));
  const html = site(s)['index.html'];
  assert.ok(html.indexOf('id="vprasanja"') < html.indexOf('id="storitve"'));
});

await test('Privacy policy names the business, the form service and the supervisory authority', () => {
  const s = withContact(withForm(DEFAULT_SETTINGS, { provider: 'formspree', formspree: { formId: 'abcd1234' } }), { email: 'ema@example.com' });
  s.business = { name: 'Ema Novak s.p.', address: 'Ulica 1, 1000 Ljubljana', registration: '1234567000', taxNumber: '12345678', vatId: '' };
  const files = site(s);
  for (const f of ['zasebnost/index.html', 'en/privacy/index.html', 'sh/privatnost/index.html']) {
    assert.ok(files[f].includes('Ema Novak s.p.') && files[f].includes('Formspree') && files[f].includes('ip-rs.si'), f);
  }
  assert.match(files['index.html'], /Matična številka: 1234567000/);
});

await test('Every preset passes WCAG AA for text and buttons, and error text stays readable', () => {
  for (const [id, preset] of Object.entries(PRESETS)) {
    for (const check of contrastReport(preset.colors)) assert.ok(check.pass, `${id}: ${check.label} is ${check.ratio.toFixed(2)}:1`);
    const css = site({ ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, colors: preset.colors } })['assets/css/theme.css'];
    const danger = css.match(/--danger: (#[0-9a-f]{6});/)[1];
    assert.ok(contrast(danger, preset.colors.bg) >= 4.5, `${id}: error text ${danger}`);
  }
});

await test('Theme CSS carries fonts from the base path and the chosen shapes', () => {
  const css = site(DEFAULT_SETTINGS)['assets/css/theme.css'];
  assert.match(css, new RegExp(`url\\('${BASE}/assets/fonts/baloo-2-latin-wght-normal\\.woff2'\\)`));
  assert.match(css, /--divider: url\("data:image\/svg\+xml,/);
  assert.match(css, /--pattern: url\("data:image\/svg\+xml,/);
  const plain = site({ ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, pattern: 'none', divider: 'none' } })['assets/css/theme.css'];
  assert.ok(plain.includes('--pattern: none;') && !plain.includes('--divider:'));
});

await test('Click-to-edit markers only in the preview', () => {
  const n = normalizeSettings(DEFAULT_SETTINGS);
  assert.ok(!site(DEFAULT_SETTINGS)['index.html'].includes('data-edit'));
  const preview = renderPage(n, 'home', 'en', { preview: true });
  assert.ok(preview.includes('data-edit="hero.title"') && preview.includes('data-preview'));
  const s = structuredClone(DEFAULT_SETTINGS);
  s.hero.title.en = '';
  assert.match(renderPage(normalizeSettings(s), 'home', 'en', { preview: true }), /data-edit="hero\.title"[^>]*data-missing/);
});

await test('content/site.json renders', async () => {
  const committed = normalizeSettings(JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8')));
  const files = renderSite(committed, { version: 'v' });
  assert.ok(files['index.html'].includes('<h1'));
});

console.log(process.exitCode ? 'Some checks failed.' : `All ${passed} checks passed.`);
