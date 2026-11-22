import '../shared/fonts.js';
import '../shared/tokens.css';
import './pro.css';
import './heroPhone.css';
import { content } from '../content.js';
import { saveChoice } from '../shared/qualityTier.js';
import { openPhoneModal } from '../shared/phoneFrame.js';

saveChoice('pro');

/* ---------- Small helpers ---------- */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function outLink(label, href, cls = 'btn btn-small') {
  return el('a', { class: cls, href, target: '_blank', rel: 'noopener noreferrer' }, label);
}

function chips(items) {
  return el('ul', { class: 'chips' }, ...items.map((item) => el('li', { class: 'chip' }, item)));
}

/* ---------- Text sections ---------- */
setText('brand', content.handle);
setText('hero-handle', content.handle);
setText('hero-name', content.name);
setText('hero-tagline', content.tagline);
setText('about-text', content.about);
setText('footer-text', `\u00A9 ${new Date().getFullYear()} ${content.name}`);

/* ---------- Anchor demo (phone modal) ---------- */
document.getElementById('hero-phone').addEventListener('click', openPhoneModal);

/* ---------- Skills ---------- */
document.getElementById('skill-groups').append(
  ...content.skillGroups.map((group) =>
    el('div', { class: 'card' }, el('h3', {}, group.title), chips(group.items))
  )
);

/* ---------- Projects ---------- */
function projectCard(project) {
  const actions = el('div', { class: 'project-actions' });

  if (project.id === 'anchor') {
    const demoBtn = el('button', { class: 'btn btn-small', type: 'button' }, 'Try the live demo');
    demoBtn.addEventListener('click', openPhoneModal);
    actions.append(demoBtn);
  }
  for (const link of project.links) actions.append(outLink(link.label, link.href));

  let shots = null;
  if (project.screenshots) {
    shots = el('div', { class: 'shots', 'aria-label': 'Screenshot placeholders' });
    for (let i = 1; i <= project.screenshots; i++) {
      shots.append(el('div', { class: 'shot' }, `Screenshot ${i}`));
    }
  }

  return el(
    'article',
    { class: 'card project' },
    el('h3', {}, project.title),
    el('p', {}, project.summary),
    chips(project.tags),
    shots,
    project.note ? el('p', { class: 'note' }, project.note) : null,
    actions
  );
}
document.getElementById('project-list').append(...content.projects.map(projectCard));

/* ---------- Timeline ---------- */
document.getElementById('timeline-list').append(
  ...content.timeline.map((item) =>
    el('li', {}, el('span', { class: 'when' }, item.when), el('h3', {}, item.title), el('p', {}, item.text))
  )
);

/* ---------- Contact ---------- */
document.getElementById('contact-links').append(
  el('a', { class: 'btn', href: `mailto:${content.links.email}` }, content.links.email),
  outLink('LinkedIn', content.links.linkedin, 'btn'),
  outLink('GitHub', content.links.github, 'btn')
);

/* ---------- Light / dark toggle ---------- */
const THEME_KEY = 'srix-theme';
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');
const systemLight = window.matchMedia('(prefers-color-scheme: light)');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  const next = theme === 'dark' ? 'light' : 'dark';
  toggle.textContent = next === 'light' ? 'Light theme' : 'Dark theme';
  toggle.setAttribute('aria-label', `Switch to ${next} theme`);
}

function hasSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) !== null;
  } catch (e) {
    return false;
  }
}

applyTheme(root.getAttribute('data-theme') || (systemLight.matches ? 'light' : 'dark'));

toggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    /* storage blocked: ignore */
  }
});

systemLight.addEventListener('change', () => {
  if (!hasSavedTheme()) applyTheme(systemLight.matches ? 'light' : 'dark');
});

/* ---------- Scroll reveal ---------- */
const revealItems = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1 }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}