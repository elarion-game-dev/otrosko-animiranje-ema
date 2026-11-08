// The site's only script, as progressive enhancement: every page works without it.
// - Inquiry form: checks, bot protection, and sending (by email app, to a form service, or as a normal post).
// - "Ask about this" links pick the service in the form.
// - Mobile menu, sticky header shadow, gallery lightbox.
// Nothing is stored in the browser (no cookies, no localStorage) and form contents are never logged.

const MIN_FILL_MS = 2500; // people take longer than this to fill in a form
const MAX_ATTEMPTS = 3; // per minute, per page load
const TIMEOUT_MS = 15000;

const loadedAt = Date.now();
const attempts = [];

const isEmail = (value) => value.length <= 254 && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/.test(value);
const isPhone = (value) => /^\+?[\d\s/().-]{6,24}$/.test(value) && value.replace(/\D/g, '').length >= 6;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- inquiry form -----------------------------------------------------------------------

function enhanceForm(form) {
  const msg = (key) => form.dataset[`msg${key[0].toUpperCase()}${key.slice(1)}`] ?? '';
  const success = form.parentElement.querySelector('[data-success]');
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type="submit"]');
  const honeypot = form.querySelector('[data-honeypot]');
  const responds = form.dataset.responds;
  const requireContact = form.dataset.requireContact === 'true';
  const field = (id) => form.querySelector(`[data-field="${id}"]`);
  const control = (id) => field(id)?.querySelector('input, select, textarea');
  let busy = false;

  form.noValidate = true;
  const date = control('date');
  if (date) date.min = today();

  const say = (text, tone = 'info') => {
    status.textContent = text;
    status.dataset.tone = tone;
  };

  const setError = (id, text) => {
    const wrap = field(id);
    if (!wrap) return;
    const error = wrap.querySelector('[data-error]');
    const input = control(id);
    error.textContent = text;
    error.hidden = !text;
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (text) input.setAttribute('aria-describedby', error.id || (error.id = `${input.id}-error`));
    else input.removeAttribute('aria-describedby');
  };

  form.addEventListener('input', (event) => {
    const wrap = event.target.closest('[data-field]');
    if (wrap) setError(wrap.dataset.field, '');
  });

  /** Returns the first invalid control, or null. */
  function validate() {
    let first = null;
    const fail = (id, text) => {
      setError(id, text);
      first ??= control(id);
    };
    for (const wrap of form.querySelectorAll('[data-field]')) {
      const id = wrap.dataset.field;
      const input = control(id);
      const value = input.value.trim();
      setError(id, '');
      if (input.required && !value) fail(id, msg('required'));
      else if (id === 'email' && value && !isEmail(value)) fail(id, msg('email'));
      else if (id === 'phone' && value && !isPhone(value)) fail(id, msg('phone'));
      else if (id === 'date' && value && value < today()) fail(id, msg('date'));
    }
    const email = control('email')?.value.trim();
    const phone = control('phone')?.value.trim();
    if (requireContact && (control('email') || control('phone')) && !email && !phone) {
      fail(control('email') ? 'email' : 'phone', msg('contact'));
    }
    return first;
  }

  const done = (title, body) => {
    form.hidden = true;
    if (!success) return;
    if (title) success.querySelector('[data-success-title]').textContent = title;
    if (body) {
      const target = success.querySelector('[data-success-body]');
      target.replaceChildren(Object.assign(document.createElement('p'), { textContent: body }));
    }
    success.hidden = false;
    success.focus();
  };

  /** The form as readable lines, in the order of the fields: "Ime in priimek: Maja". */
  const lines = () =>
    [...form.querySelectorAll('[data-field]')]
      .map((wrap) => {
        const value = control(wrap.dataset.field).value.trim();
        const label = wrap.querySelector('label').textContent.replace(/\s*\*$/, '').trim();
        return value ? `${label}: ${value}` : '';
      })
      .filter(Boolean);

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

    if (responds === 'mailto') {
      const to = form.action.replace(/^mailto:/, '');
      const href = `mailto:${to}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(lines().join('\n'))}`;
      unbusy();
      say('');
      window.location.href = href;
      const template = (name) => form.parentElement.querySelector(`template[data-mailto-${name}]`)?.content.textContent ?? '';
      return done(template('title'), template('body'));
    }

    if (responds === 'navigate') {
      unbusy(); // usable again if the visitor comes back with the Back button
      say('');
      form.submit();
      return;
    }

    const body = new FormData(form);
    body.delete('website');
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

  return { select: (name) => {
    const select = control('service');
    if (!select || !name) return;
    const option = [...select.options].find((o) => o.value === name || o.textContent === name);
    if (option) select.value = option.value;
  } };
}

const forms = [...document.querySelectorAll('form[data-inquiry]')].map(enhanceForm);

// "Ask about this" on services and packages: pick it in the form, then scroll there (the link's own job).
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-service]');
  if (!link) return;
  forms.forEach((f) => f.select(link.dataset.service));
});

// --- header & mobile menu -------------------------------------------------------------------
// Without JavaScript the toggle is a link to #site-menu and CSS opens the menu with :target.

const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function enhanceMenu(toggle) {
  const menu = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!menu) return;
  const closeLink = menu.querySelector('.menu-close');
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a')?.focus();
  };
  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    setOpen(!menu.classList.contains('is-open'));
  });
  closeLink?.addEventListener('click', (event) => {
    event.preventDefault();
    setOpen(false);
    toggle.focus();
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a:not(.menu-close)')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  // The full-screen menu only exists on narrow screens (site.css); don't leave it open, with scrolling locked, on wider ones.
  window.matchMedia('(max-width: 960px)').addEventListener('change', (event) => {
    if (!event.matches && menu.classList.contains('is-open')) setOpen(false);
  });
}

document.querySelectorAll('.menu-toggle[aria-controls]').forEach(enhanceMenu);

// --- gallery lightbox ---------------------------------------------------------------------

const ICONS = {
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
};

function svgIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

const LABELS = {
  sl: { close: 'Zapri', prev: 'Prejšnja slika', next: 'Naslednja slika' },
  en: { close: 'Close', prev: 'Previous photo', next: 'Next photo' },
  sh: { close: 'Zatvori', prev: 'Prethodna slika', next: 'Sljedeća slika' },
};

function enhanceGallery(list) {
  const links = [...list.querySelectorAll('a[data-lightbox]')];
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  const t = LABELS[document.documentElement.lang] ?? LABELS.sl;
  const image = document.createElement('img');
  const caption = document.createElement('p');
  caption.className = 'lightbox-caption';
  const button = (cls, label, iconName, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.append(svgIcon(iconName));
    b.addEventListener('click', onClick);
    return b;
  };
  let index = 0;
  const show = (i) => {
    index = (i + links.length) % links.length;
    const img = links[index].querySelector('img');
    image.src = links[index].href;
    image.alt = img?.alt ?? '';
    caption.textContent = img?.alt ?? '';
  };
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.append(
    image,
    caption,
    button('lightbox-close', t.close, 'close', () => dialog.close()),
    ...(links.length > 1 ? [button('lightbox-prev', t.prev, 'left', () => show(index - 1)), button('lightbox-next', t.next, 'right', () => show(index + 1))] : [])
  );
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  // Swipe on phones.
  let startX = null;
  dialog.addEventListener('touchstart', (event) => (startX = event.touches[0].clientX), { passive: true });
  dialog.addEventListener('touchend', (event) => {
    if (startX === null) return;
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
  document.body.append(dialog);
  links.forEach((link, i) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      show(i);
      dialog.showModal();
    })
  );
}

document.querySelectorAll('[data-gallery]').forEach(enhanceGallery);
