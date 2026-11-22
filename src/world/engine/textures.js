import * as THREE from 'three';

const SIZE = 16;

// Small seeded random generator: same seed gives same pixels every time.
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function rgb(base, shift) {
  return `rgb(${clamp(base[0] + shift)},${clamp(base[1] + shift)},${clamp(base[2] + shift)})`;
}

function noisy(ctx, rand, base, spread, columns = 0) {
  const col = Array.from({ length: SIZE }, () => (rand() - 0.5) * columns);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = rgb(base, (rand() - 0.5) * spread + col[x]);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function draw(seed, paintFn) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  paintFn(canvas.getContext('2d'), makeRng(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GRASS = [86, 150, 60];
const DIRT = [121, 85, 58];

export function makeTextures() {
  return {
    grassTop: draw(1, (ctx, r) => noisy(ctx, r, GRASS, 36)),
    dirt: draw(2, (ctx, r) => noisy(ctx, r, DIRT, 30)),
    grassSide: draw(3, (ctx, r) => {
      noisy(ctx, r, DIRT, 30);
      for (let x = 0; x < SIZE; x++) {
        const depth = 3 + (r() < 0.4 ? 1 : 0);
        for (let y = 0; y < depth; y++) {
          ctx.fillStyle = rgb(GRASS, (r() - 0.5) * 36);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }),
    bark: draw(4, (ctx, r) => noisy(ctx, r, [92, 64, 40], 24, 44)),
    leaves: draw(5, (ctx, r) => noisy(ctx, r, [52, 120, 48], 64)),
    stone: draw(6, (ctx, r) => noisy(ctx, r, [120, 120, 126], 40)),
  };
}