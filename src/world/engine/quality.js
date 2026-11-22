import { getTier } from '../../shared/qualityTier.js';

// Every effect in /world reads its settings from here.
const KEY = 'srix-quality';
export const TIERS = ['low', 'medium', 'high'];

const PRESETS = {
  low: {
    pixelRatio: 1, antialias: false, trees: 18, stars: 250, shadows: false,
    post: false, bloom: false, vignette: false, grain: false,
    aurora: false, shootingStars: false, embers: 40, smoke: 0, fireflies: 0,
  },
  medium: {
    pixelRatio: 1.5, antialias: true, trees: 40, stars: 700, shadows: false,
    post: true, bloom: true, vignette: true, grain: false,
    aurora: false, shootingStars: true, embers: 120, smoke: 0, fireflies: 30,
  },
  high: {
    pixelRatio: 2, antialias: true, trees: 40, stars: 1200, shadows: true,
    post: true, bloom: true, vignette: true, grain: true,
    aurora: true, shootingStars: true, embers: 250, smoke: 12, fireflies: 60,
  },
};

function autoTier() {
  if (getTier().weak) return 'low';
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  return memory >= 8 && cores >= 8 ? 'high' : 'medium';
}

function choose() {
  const fromUrl = new URLSearchParams(location.search).get('quality');
  if (TIERS.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (TIERS.includes(saved)) return saved;
  } catch (e) {
    /* storage blocked: ignore */
  }
  return autoTier();
}

let current = choose();
const listeners = [];

export function getQuality() {
  return { tier: current, ...PRESETS[current] };
}

// name: 'auto' | 'low' | 'medium' | 'high'
export function setQualityTier(name) {
  try {
    if (name === 'auto') {
      localStorage.removeItem(KEY);
      current = autoTier();
    } else if (TIERS.includes(name)) {
      localStorage.setItem(KEY, name);
      current = name;
    }
  } catch (e) {
    if (TIERS.includes(name)) current = name;
  }
  listeners.forEach((fn) => fn(getQuality()));
}

export function onQualityChange(fn) {
  listeners.push(fn);
}