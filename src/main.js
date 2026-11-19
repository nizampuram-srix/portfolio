import './shared/fonts.js';
import './shared/tokens.css';
import './entry.css';
import { content } from './content.js';
import { getTier, getLastChoice } from './shared/qualityTier.js';

document.getElementById('name').textContent = content.name;
document.getElementById('tagline').textContent = content.tagline;

const buttons = {
  world: document.getElementById('btn-world'),
  pro: document.getElementById('btn-pro'),
};

function setBadge(button, text) {
  const badge = button.querySelector('.badge');
  badge.textContent = text;
  badge.hidden = false;
}

const tier = getTier();
const last = getLastChoice();

if (tier.weak) {
  buttons.pro.classList.add('recommended');
  setBadge(buttons.pro, 'Recommended for this device');
  document.getElementById('warn').hidden = false;
} else if (last && buttons[last]) {
  setBadge(buttons[last], 'Your last choice');
}