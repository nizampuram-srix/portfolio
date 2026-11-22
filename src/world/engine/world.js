import * as THREE from 'three';
import { buildCamp } from './camp.js';
import { getQuality } from './quality.js';
import { DEBUG, setupDebug } from './debug.js';
import { CAMPFIRE } from './layout.js';
import { createSky, FOG_COLOR } from './sky.js';
import { createPost } from './post.js';
import { installShaderGuard } from './shaderGuard.js';

// Tracks loading. Everything is made in code, so we mark the camp build as one item.
// Prompt 13 will connect this to a loading screen.
export const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => document.body.classList.add('world-ready');

// Returns true if the 3D world started, false if WebGL is not available.
export function startWorld(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const quality = getQuality();

  let renderer;
  try {
    // With post-processing the smoothing is done in post.js, so the canvas itself skips it.
    renderer = new THREE.WebGLRenderer({ antialias: quality.antialias && !quality.post });
  } catch (e) {
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // film-like brightness curve
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'A blocky night camp with a campfire and trees');
  container.appendChild(renderer.domElement);

  installShaderGuard(renderer);

  const scene = new THREE.Scene();
  scene.background = FOG_COLOR.clone();
  scene.fog = new THREE.Fog(FOG_COLOR, 9, 38); // cool blue mist that hides the far edge

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);

  loadingManager.itemStart('camp');
  const sky = createSky(scene, quality);
  const camp = buildCamp(scene, quality);
  loadingManager.itemEnd('camp');

  const post = createPost(renderer, scene, camera, quality);
  const debug = DEBUG ? setupDebug(scene, camera, renderer, quality) : null;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    post.resize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let last = 0;
  function frame(ms) {
    const dt = Math.min((ms - last) / 1000, 0.1); // seconds since last frame
    last = ms;
    const still = reduced.matches;
    const t = still ? 0 : ms / 1000;
    camp.update(t, !still, dt);

    if (debug) {
      debug.update(); // you steer with the mouse
    } else {
      const a = t * 0.08 + 0.6; // slow circle around the fire
      camera.position.set(CAMPFIRE.x + Math.cos(a) * 10, 4.5, CAMPFIRE.z + Math.sin(a) * 10);
      camera.lookAt(CAMPFIRE.x, 1, CAMPFIRE.z);
    }
    sky.update(t, camera);
    post.render(dt, t);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (reduced.matches && !DEBUG) frame(0);
  });
  reduced.addEventListener('change', () => location.reload());

  if (reduced.matches && !DEBUG) {
    frame(0); // one still picture, no motion
  } else {
    renderer.setAnimationLoop(frame);
  }
  return true;
}