import './phoneFrame.css';

const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 14;
const BODY_W = SCREEN_W + BEZEL * 2;
const BODY_H = SCREEN_H + BEZEL * 2;
const LOAD_TIMEOUT_MS = 25000;
const DEMO_PATH = 'anchor-demo/index.html';

// Works from /pro/ and /world/ (and from a sub-folder on GitHub Pages).
function defaultUrl() {
  return new URL('../' + DEMO_PATH, window.location.href).href;
}

function h(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

export function mountPhone(container, options = {}) {
  const url = options.url || defaultUrl();
  const getMaxHeight = options.maxHeight || null;
  const autoLoad = options.autoLoad !== false;
  let iframe = null;
  let timer = 0;
  let runId = 0;
  let destroyed = false;

  container.textContent = '';

  const root = h('div', 'phone-root');
  const fit = h('div', 'phone-fit');
  const body = h('div', 'phone');
  const screen = h('div', 'phone-screen');

  for (const side of ['a', 'b', 'c']) {
    const btn = h('span', `phone-side phone-side-${side}`);
    btn.setAttribute('aria-hidden', 'true');
    body.append(btn);
  }
  const pill = h('span', 'phone-pill');
  pill.setAttribute('aria-hidden', 'true');

  const skeleton = h('div', 'phone-skeleton', 'Loading Anchor...');
  skeleton.setAttribute('role', 'status');

  const fallback = h('div', 'phone-fallback');
  fallback.hidden = true;
  const strip = h('div', 'phone-strip');
  for (let i = 1; i <= 3; i++) strip.append(h('div', 'phone-strip-item', `Screenshot ${i}`));
  fallback.append(
    h('strong', null, 'The live demo could not load.'),
    h('p', null, 'Here is a peek at the app instead.'),
    strip
  );

  const controls = h('div', 'phone-controls');
  const restartBtn = h('button', 'btn phone-action', 'Restart demo');
  restartBtn.type = 'button';
  const fullLink = h('a', 'btn phone-action', 'Open full screen');
  fullLink.href = url;
  fullLink.target = '_blank';
  fullLink.rel = 'noopener noreferrer';
  controls.append(restartBtn, fullLink);

  screen.append(skeleton, fallback);
  body.append(pill, screen);
  fit.append(body);
  root.append(fit, controls);
  container.append(root);

  /* ---------- Scale to fit ---------- */
  function fitToContainer() {
    const width = container.clientWidth || BODY_W;
    let scale = Math.min(1, width / BODY_W);
    if (getMaxHeight) scale = Math.min(scale, getMaxHeight() / BODY_H);
    scale = Math.max(scale, 0.3);
    body.style.transform = `scale(${scale})`;
    fit.style.width = `${BODY_W * scale}px`;
    fit.style.height = `${BODY_H * scale}px`;
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fitToContainer) : null;
  if (ro) ro.observe(container);
  window.addEventListener('resize', fitToContainer);
  fitToContainer();

  /* ---------- Load the demo ---------- */
  function removeIframe() {
    if (iframe) {
      iframe.remove();
      iframe = null;
    }
  }

  function showFallback() {
    clearTimeout(timer);
    removeIframe();
    skeleton.hidden = true;
    fallback.hidden = false;
  }

  async function load() {
    if (destroyed) return;
    const run = ++runId;
    clearTimeout(timer);
    removeIframe();
    fallback.hidden = true;
    skeleton.hidden = false;

    // Check the demo really exists (a missing folder can return a wrong page).
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      const text = await res.text();
      if (!res.ok || !/flutter/i.test(text)) throw new Error('demo missing');
    } catch (e) {
      if (run === runId && !destroyed) showFallback();
      return;
    }
    if (run !== runId || destroyed) return;

    iframe = document.createElement('iframe');
    iframe.className = 'phone-iframe';
    iframe.title = 'Anchor app live demo';
    iframe.addEventListener('load', () => {
      clearTimeout(timer);
      skeleton.hidden = true;
    });
    iframe.addEventListener('error', showFallback);
    iframe.src = url;
    screen.prepend(iframe);
    timer = setTimeout(showFallback, LOAD_TIMEOUT_MS);
  }

  restartBtn.addEventListener('click', load);
  if (autoLoad) load();

  function destroy() {
    destroyed = true;
    runId++;
    clearTimeout(timer);
    if (ro) ro.disconnect();
    window.removeEventListener('resize', fitToContainer);
    removeIframe();
    container.textContent = '';
  }

  return { load, restart: load, destroy, refit: fitToContainer };
}

/* ---------- Modal ---------- */
let modal = null;

export function openPhoneModal() {
  if (modal) return;
  const previous = document.activeElement;

  const overlay = h('div', 'phone-modal');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Anchor live demo');

  const panel = h('div', 'phone-modal-panel');
  const closeBtn = h('button', 'btn phone-action phone-modal-close', 'Close');
  closeBtn.type = 'button';
  const holder = h('div', 'phone-modal-body');
  panel.append(closeBtn, holder);
  overlay.append(panel);
  document.body.append(overlay);
  document.body.classList.add('phone-modal-open');

  // Frame is created only now, so the iframe loads only when the modal opens.
  const phone = mountPhone(holder, { maxHeight: () => window.innerHeight - 190 });

  function onKey(e) {
    if (e.key === 'Escape') {
      closePhone();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...overlay.querySelectorAll('button, a[href]')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', closePhone);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePhone();
  });

  modal = { overlay, phone, onKey, previous };
  closeBtn.focus();
}

export function closePhone() {
  if (!modal) return;
  const { overlay, phone, onKey, previous } = modal;
  modal = null;
  document.removeEventListener('keydown', onKey);
  phone.destroy();
  overlay.remove();
  document.body.classList.remove('phone-modal-open');
  if (previous && previous.focus) previous.focus();
}
