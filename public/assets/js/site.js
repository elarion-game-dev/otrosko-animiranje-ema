// The site's only script, as progressive enhancement: every page works without it.
// - Booking form: topics, presets from buttons and from the invitation's date, checks, bot protection and
//   sending (by the visitor's email app, to a form service, or as a normal post).
// - Header shadow, header hiding on phones, phone menu, language menu, FAQ animation, quick bar on phones.
// - Motion: reveals below the first screen, the programme's dotted leaders, card tilt, confetti when sent,
//   gallery lightbox. All of it stays still for visitors who prefer reduced motion or when the owner turns it off.
// Nothing is stored in the browser (no cookies, no localStorage) and form contents are never logged.
// Styles are only changed through the CSSOM (element.style, element.animate), which the Content Security
// Policy allows; the page never adds style attributes or <style> elements.

const d = document;
const root = d.documentElement;
root.classList.add('js');

const $ = (s, el = d) => el.querySelector(s);
const $$ = (s, el = d) => [...el.querySelectorAll(s)];
const EASE = 'cubic-bezier(.2, .7, .2, 1)';
const reduce = root.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = matchMedia('(max-width: 47.5em)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const hasIO = 'IntersectionObserver' in window;

// --- header ---------------------------------------------------------------------------------------
// Shadow with hysteresis. On compact screens a sticky header hides after 32 px of scrolling down and returns
// after 12 px up, so small thumb movements don't make it bob. Scrolls started by the page itself are ignored.

const header = $('[data-header]');
const compact = matchMedia('(max-width: 47.5em), (max-height: 30em)');
let programmatic = false;
let quietTimer;
const quiet = () => {
  programmatic = true;
  clearTimeout(quietTimer);
  const done = () => {
    programmatic = false;
    clearTimeout(quietTimer);
  };
  addEventListener('scrollend', done, { once: true });
  quietTimer = setTimeout(done, 1500);
};

if (header) {
  let lastY = scrollY;
  let scrolled = false;
  let acc = 0;
  const sticky = header.classList.contains('is-sticky');
  const onScroll = () => {
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    if (!scrolled && y > 48) header.classList.add('is-scrolled'), (scrolled = true);
    else if (scrolled && y < 8) header.classList.remove('is-scrolled'), (scrolled = false);
    if (!sticky || !compact.matches || root.classList.contains('menu-open')) {
      header.classList.remove('is-hidden');
      acc = 0;
      return;
    }
    if (programmatic) return;
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (acc > 32 && y > 320) header.classList.add('is-hidden');
    else if (acc < -12 || y < 80) header.classList.remove('is-hidden');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- quick bar on phones: shows once the invitation's buttons scroll away, hides at the contact tiles,
// the form and the footer, so it never covers what it points to ---------------------------------------

const bar = $('[data-quickbar]');
const seen = { hero: true, tiles: false, form: false, foot: false };
function syncBar() {
  if (!bar) return;
  const show = !seen.hero && !seen.tiles && !seen.form && !seen.foot && !root.classList.contains('menu-open');
  bar.classList.toggle('show', show);
  bar.inert = !show;
}
if (bar) {
  syncBar();
  if (hasIO) {
    const watch = (el, key) =>
      el &&
      new IntersectionObserver(([entry]) => {
        seen[key] = entry.isIntersecting;
        syncBar();
      }).observe(el);
    const heroTarget = $('.invite .cta-row') ?? $('.hero');
    if (heroTarget) watch(heroTarget, 'hero');
    else seen.hero = false;
    watch($('.quick'), 'tiles');
    watch($('#book-form') ?? $('.rsvp'), 'form');
    watch($('.site-footer'), 'foot');
  }
}

// --- phone menu -------------------------------------------------------------------------------------
// Without JavaScript the button is a link to #site-menu and CSS opens the menu with :target.

const toggle = $('.menu-toggle');
const mnav = $('#site-menu');
if (location.hash === '#site-menu') location.replace('#');

function setMenu(open, { restoreFocus = false } = {}) {
  if (!toggle || !mnav) return;
  mnav.classList.toggle('is-open', open);
  root.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  [$('main'), $('.site-footer'), bar].filter(Boolean).forEach((el) => (el.inert = open));
  header?.classList.remove('is-hidden');
  syncBar();
  if (open) setTimeout(() => $('a', mnav)?.focus(), 180);
  else if (restoreFocus) toggle.focus();
}

if (toggle && mnav) {
  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  toggle.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      toggle.click();
    }
  });
  mnav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  matchMedia('(max-width: 72em)').addEventListener('change', (event) => {
    if (!event.matches) setMenu(false);
  });
}

// --- language menu ------------------------------------------------------------------------------------

const langs = $$('details.lang');
langs.forEach((menu) =>
  menu.addEventListener('focusout', (event) => {
    if (!menu.contains(event.relatedTarget)) menu.removeAttribute('open');
  })
);
d.addEventListener('click', (event) => langs.forEach((menu) => !menu.contains(event.target) && menu.removeAttribute('open')));
addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (root.classList.contains('menu-open')) setMenu(false, { restoreFocus: true });
  langs.forEach((menu) => {
    if (menu.open) {
      menu.removeAttribute('open');
      $('summary', menu).focus();
    }
  });
});

// --- FAQ: animate the height where the browser can't do it in CSS (::details-content) -------------------

if (!reduce && !CSS.supports('selector(::details-content)')) {
  $$('.faq-item').forEach((item) => {
    const summary = $('summary', item);
    const body = $('.faq-a', item);
    let running = null;
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      running?.cancel();
      body.style.overflow = 'hidden';
      const finish = () => {
        body.style.overflow = '';
        running = null;
      };
      if (item.open) {
        running = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: EASE });
        running.onfinish = () => {
          item.open = false;
          finish();
        };
      } else {
        item.open = true;
        running = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 360, easing: EASE });
        running.onfinish = finish;
      }
    });
  });
}

// --- motion: reveals, leaders, tilt -------------------------------------------------------------------

/** Elements below the first screen fade up as they arrive; their lists animate in after them (site.css). */
if (!reduce && hasIO) {
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, i) => {
          const el = entry.target;
          io.unobserve(el);
          el.classList.remove('pre');
          el.setAttribute('data-revealed', '');
          el.animate([{ opacity: 0, translate: '0 28px' }, { opacity: 1, translate: '0 0' }], { duration: 750, delay: i * 90, easing: EASE, fill: 'backwards' });
        });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  $$('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight * 0.94) {
      el.classList.add('pre');
      io.observe(el);
    }
  });
}

/** The programme's dotted leaders draw in once, when the menu card is seen. */
const programme = $('.menu[data-draw]');
if (programme) {
  if (reduce || !hasIO) programme.classList.add('is-drawn');
  else {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        programme.classList.add('is-drawn');
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(programme);
  }
}

/** Place cards lean gently towards the pointer. */
if (!reduce && fine.matches) {
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const r = card.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
    });
  });
}

/** The menu link of the section in view is underlined. */
const navLinks = $$('.nav-link[href^="#"]');
if (navLinks.length && hasIO) {
  const byId = new Map(navLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const visible = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id)));
      const first = [...byId.keys()].find((id) => visible.has(id));
      navLinks.forEach((a) => a.classList.toggle('is-current', a === byId.get(first)));
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );
  byId.forEach((_, id) => {
    const section = d.getElementById(id);
    if (section) observer.observe(section);
  });
}

/** Horizontal scrollers (the photo wall on phones) get a tab stop only when they actually scroll. */
const tabScrollers = () =>
  $$('[data-scroller]').forEach((s) => {
    if (s.scrollWidth > s.clientWidth + 4) s.tabIndex = 0;
    else s.removeAttribute('tabindex');
  });
tabScrollers();
addEventListener('resize', tabScrollers, { passive: true });

/** A short burst of confetti in the rainbow colours, from the middle of an element. */
function confetti(target) {
  if (reduce || typeof Element.prototype.animate !== 'function') return;
  const r = target.getBoundingClientRect();
  const x0 = r.left + r.width / 2;
  const y0 = r.top + Math.min(r.height / 2, 90);
  const style = getComputedStyle(root);
  const colors = ['--coral', '--gold', '--sage', '--sky', '--lilac', '--accent'].map((v) => style.getPropertyValue(v).trim()).filter(Boolean);
  for (let i = 0; i < 54; i++) {
    const piece = d.createElement('span');
    piece.className = 'confetti-burst';
    piece.setAttribute('aria-hidden', 'true');
    piece.style.background = colors[i % colors.length];
    if (i % 3 === 0) piece.style.borderRadius = '50%';
    d.body.append(piece);
    const angle = Math.random() * Math.PI * 2;
    const dist = 110 + Math.random() * 230;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.75 - 150;
    const spin = (Math.random() - 0.5) * 900;
    const animation = piece.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(.4)`, opacity: 1 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy}px) rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x0 + dx * 1.25}px, ${y0 + dy + 300}px) rotate(${spin}deg) scale(.7)`, opacity: 0 },
      ],
      { duration: 1500 + Math.random() * 800, easing: 'cubic-bezier(.12, .6, .3, 1)' }
    );
    animation.onfinish = () => piece.remove();
  }
}

// --- booking form -------------------------------------------------------------------------------------

const MIN_FILL_MS = 2500; // people take longer than this to fill in a form
const MAX_ATTEMPTS = 3; // per minute, per page load
const TIMEOUT_MS = 15000;
const loadedAt = Date.now();
const attempts = [];

const isEmail = (value) => value.length <= 254 && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/.test(value);
const isPhone = (value) => /^\+?[\d\s/().-]{6,24}$/.test(value) && value.replace(/\D/g, '').length >= 6;
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const locale = { sl: 'sl-SI', en: 'en-GB', sh: 'hr' }[root.lang] ?? 'sl-SI';
const longDate = (iso) => {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};
/** A label's text without its "(optional)" hints. */
const labelText = (el) => {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('.hint').forEach((h) => h.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
};

function enhanceForm(form) {
  const msg = (key) => form.dataset[`msg${key[0].toUpperCase()}${key.slice(1)}`] ?? '';
  const card = form.closest('.rsvp') ?? form.parentElement;
  const success = $('[data-success]', card);
  const status = $('[data-status]', form);
  const button = $('button[type="submit"]', form);
  const honeypot = $('[data-honeypot]', form);
  const responds = form.dataset.responds;
  const contact = $('#f-contact', form);
  const heroDate = $('#hero-date');
  const topicInputs = $$('[data-topic]', form);
  const groups = $$('.group', form);
  let busy = false;
  let replyTouched = false;

  form.noValidate = true;
  for (const input of [...$$('input[type="date"]', form), heroDate].filter(Boolean)) input.min = today();

  const say = (text, tone = 'info') => {
    status.textContent = text;
    status.dataset.tone = tone;
  };

  // Topics: only the chosen topic's questions are shown, checked and sent.
  const setTopic = (topic) => {
    const input = topicInputs.find((i) => i.dataset.topic === topic);
    if (!input) return false;
    if (input.type === 'radio') input.checked = true;
    groups.forEach((group) => {
      const on = group.dataset.for === topic;
      if (on && group.hidden && !reduce) group.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: 380, easing: EASE });
      group.hidden = !on;
      $$('input, select, textarea', group).forEach((f) => (f.disabled = !on));
    });
    return true;
  };
  const chosen = () => (topicInputs.find((i) => i.type !== 'radio' || i.checked) ?? topicInputs[0])?.dataset.topic;
  setTopic(chosen());
  topicInputs.forEach((i) => i.addEventListener('change', () => setTopic(i.dataset.topic)));

  // Errors are written under each field and announced through aria-describedby.
  const controlOf = (wrap) => $('input:not([type="radio"]), select, textarea', wrap);
  const setError = (wrap, text) => {
    const input = controlOf(wrap);
    const error = $('[data-error]', wrap);
    if (!input || !error) return;
    error.textContent = text;
    error.hidden = !text;
    if (text) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', error.id);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  };
  form.addEventListener('input', (event) => {
    const wrap = event.target.closest('[data-field]');
    if (wrap && event.target.getAttribute('aria-invalid')) setError(wrap, '');
  });
  form.addEventListener('change', (event) => {
    const wrap = event.target.closest('[data-field]');
    if (wrap && event.target.getAttribute('aria-invalid')) setError(wrap, '');
  });

  // "Reply by email" is picked automatically when an email address is typed, unless the parent chose already.
  $$('input[name][type="radio"]', form)
    .filter((r) => r.closest('[data-field="reply"]'))
    .forEach((r) => r.addEventListener('change', () => (replyTouched = true)));
  contact?.addEventListener('input', () => {
    if (replyTouched) return;
    const email = $('[data-field="reply"] [data-email]', form);
    if (email) email.checked = contact.value.includes('@');
  });

  /** Returns the first invalid control, or null. */
  function validate() {
    let first = null;
    const fail = (wrap, text) => {
      setError(wrap, text);
      first ??= controlOf(wrap);
    };
    for (const wrap of $$('[data-field]', form)) {
      const input = controlOf(wrap);
      if (!input || input.disabled || wrap.closest('[hidden]')) continue;
      setError(wrap, '');
      const value = input.value.trim();
      const needed = input.required || input.hasAttribute('data-need');
      if (input === contact) {
        const replyEmail = $('[data-field="reply"] [data-email]', form)?.checked;
        if (!value) fail(wrap, msg('contact'));
        else if (!(value.includes('@') ? isEmail(value) : isPhone(value))) fail(wrap, msg('contactinvalid'));
        else if (replyEmail && !value.includes('@')) fail(wrap, msg('needmail'));
      } else if (needed && !value) fail(wrap, input.tagName === 'SELECT' ? msg('choose') : msg('required'));
      else if (input.type === 'date' && value && value < today()) fail(wrap, msg('past'));
      else if (input.type === 'number' && value) {
        const n = Number(value);
        if (!(n >= 1)) fail(wrap, msg('kidsmin'));
        else if (input.max && n > Number(input.max)) fail(wrap, msg('kidsmax').replace('{n}', input.max));
      }
    }
    return first;
  }

  const done = (title, body) => {
    form.hidden = true;
    $$('.quick, .or, .reach', card).forEach((el) => (el.hidden = true));
    if (!success) return;
    if (title) $('[data-success-title]', success).textContent = title;
    if (body) $('[data-success-body]', success).replaceChildren(Object.assign(d.createElement('p'), { textContent: body }));
    success.hidden = false;
    success.focus({ preventScroll: true });
    quiet();
    success.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => confetti(success), reduce ? 0 : 250);
  };

  /** The form as readable lines, in the order of the questions: "Datum zabave: 2026-12-05". */
  const lines = () => {
    const out = [];
    for (const wrap of $$('[data-field], .check', form)) {
      if (wrap.closest('[hidden]')) continue;
      if (wrap.matches('.check')) {
        const box = $('input', wrap);
        if (box.checked && !box.disabled) out.push(labelText(wrap));
        continue;
      }
      const label = $('label, legend', wrap);
      const radio = $('input[type="radio"]:checked', wrap);
      const input = radio ?? controlOf(wrap);
      if (!input || input.disabled) continue;
      const value = input.value.trim();
      if (value) out.push(`${labelText(label)}: ${value}`);
    }
    return out;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || responds === 'none') return;

    const invalid = validate();
    if (invalid) {
      invalid.focus();
      return;
    }
    // Bots fill hidden fields. Show them a normal success and send nothing.
    if (honeypot?.value) return done();

    const now = Date.now();
    while (attempts.length && now - attempts[0] > 60000) attempts.shift();
    if (attempts.length >= MAX_ATTEMPTS) return say(msg('toomany'), 'error');

    busy = true;
    button.disabled = true;
    button.classList.add('is-loading');
    say(msg('sending'));
    const unbusy = () => {
      busy = false;
      button.disabled = false;
      button.classList.remove('is-loading');
    };
    // Bots also submit instantly. A person who autofills and clicks right away just waits a moment.
    const early = MIN_FILL_MS - (Date.now() - loadedAt);
    if (early > 0) await new Promise((resolve) => setTimeout(resolve, early));
    attempts.push(Date.now());
    const email = contact && isEmail(contact.value.trim()) ? contact.value.trim() : '';

    if (responds === 'mailto') {
      const to = form.action.replace(/^mailto:/, '');
      const href = `mailto:${to}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(lines().join('\n'))}`;
      unbusy();
      say('');
      window.location.href = href;
      const template = (name) => $(`template[data-mailto-${name}]`, card)?.content.textContent ?? '';
      return done(template('title'), template('body'));
    }

    if (responds === 'navigate') {
      // Form services read "email" as the address to reply to.
      if (email && !form.elements.namedItem('email')) form.append(Object.assign(d.createElement('input'), { type: 'hidden', name: 'email', value: email }));
      unbusy(); // usable again if the visitor comes back with the Back button
      say('');
      form.submit();
      return;
    }

    const body = new FormData(form);
    body.delete('spletna-stran');
    if (email) body.set('email', email);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'strict-origin',
        signal: controller.signal,
      });
      if (response.ok) {
        say('');
        return done();
      }
      say(msg('network'), 'error');
    } catch {
      say(msg('network'), 'error');
    } finally {
      clearTimeout(timer);
      unbusy();
    }
  });

  /** Jump to a field and make it glow, e.g. the date after choosing one on the invitation. */
  const showField = (el) => {
    if (!el) return;
    quiet();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
    (fine.matches ? el : form).focus({ preventScroll: true });
  };
  const toForm = () => {
    quiet();
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    form.focus({ preventScroll: true });
  };
  if (!form.hasAttribute('tabindex')) form.tabIndex = -1;

  // The date picked on the invitation goes into the form.
  heroDate?.addEventListener('change', () => {
    const target = $('#f-p-date', form);
    if (!target || !heroDate.value) return;
    target.value = heroDate.value;
    say(msg('added').replace('{d}', longDate(heroDate.value)));
  });

  return {
    /** A button elsewhere on the page chose a topic (and maybe a package). Returns true when it handled the scroll. */
    preset(link) {
      if (form.hidden) return false;
      setTopic(link.dataset.topic);
      if (link.dataset.paket) {
        const pack = $('#f-p-pack', form);
        if (pack) pack.value = [...pack.options].some((o) => o.value === link.dataset.paket) ? link.dataset.paket : '';
      }
      if (link.closest('.invite') && heroDate?.value && !phone.matches) {
        showField($('#f-p-date', form));
        return true;
      }
      // On phones a button lands on the form itself, not on the heading a screen above it.
      if (phone.matches) {
        toForm();
        return true;
      }
      return false;
    },
  };
}

const bookings = $$('form[data-inquiry]').map(enhanceForm);

d.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-topic]');
  if (!link || !bookings.length) return;
  const url = new URL(link.href, location.href);
  if (url.pathname !== location.pathname || !url.hash) return; // the form is on another page
  setMenu(false);
  if (bookings.map((b) => b.preset(link)).some(Boolean)) event.preventDefault();
});

// --- gallery lightbox -----------------------------------------------------------------------------------

const ICONS = {
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
};
const LABELS = {
  sl: { close: 'Zapri', prev: 'Prejšnja slika', next: 'Naslednja slika' },
  en: { close: 'Close', prev: 'Previous photo', next: 'Next photo' },
  sh: { close: 'Zatvori', prev: 'Prethodna slika', next: 'Sljedeća slika' },
};

function svgIcon(name) {
  const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[name]; // static strings above
  return svg;
}

function enhanceGallery(list) {
  const links = $$('a[data-lightbox]', list);
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  const t = LABELS[root.lang] ?? LABELS.sl;
  const figure = d.createElement('figure');
  const image = d.createElement('img');
  const caption = d.createElement('figcaption');
  caption.className = 'lightbox-caption';
  figure.append(image, caption);
  const button = (cls, label, iconName, onClick) => {
    const b = d.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.append(svgIcon(iconName));
    b.addEventListener('click', onClick);
    return b;
  };
  let index = 0;
  const show = (i, dir = 0) => {
    index = (i + links.length) % links.length;
    const link = links[index];
    const img = $('img', link);
    image.src = link.href;
    image.alt = img?.alt ?? '';
    caption.textContent = link.dataset.caption ?? '';
    if (dir && !reduce) figure.animate([{ opacity: 0, transform: `translateX(${dir * 46}px) rotate(${dir * 2}deg)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
  };
  const dialog = d.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', t.close === 'Close' ? 'Photo' : 'Fotografija');
  dialog.append(
    figure,
    button('lightbox-close', t.close, 'close', () => dialog.close()),
    ...(links.length > 1 ? [button('lightbox-prev', t.prev, 'left', () => show(index - 1, -1)), button('lightbox-next', t.next, 'right', () => show(index + 1, 1))] : [])
  );
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1, -1);
    if (event.key === 'ArrowRight') show(index + 1, 1);
  });
  // Swipe on phones.
  let startX = null;
  dialog.addEventListener('touchstart', (event) => (startX = event.touches[0].clientX), { passive: true });
  dialog.addEventListener('touchend', (event) => {
    if (startX === null) return;
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    startX = null;
  });
  d.body.append(dialog);
  links.forEach((link, i) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      show(i);
      dialog.showModal();
    })
  );
}

$$('[data-gallery]').forEach(enhanceGallery);
