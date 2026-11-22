import * as THREE from 'three';
import { buildCamp } from './camp.js';

const NIGHT = 0x070b18;

// Returns true if the 3D world started, false if WebGL is not available.
export function startWorld(container, weak) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !weak });
  } catch (e) {
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, weak ? 1 : 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'A blocky night camp with a campfire and trees');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.Fog(NIGHT, 10, 32);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  const camp = buildCamp(scene, weak);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(ms) {
    const still = reduced.matches;
    const t = still ? 0 : ms / 1000;
    camp.update(t, !still);
    const a = t * 0.08 + 0.6; // slow circle around the fire
    camera.position.set(Math.cos(a) * 10, 4.5, Math.sin(a) * 10);
    camera.lookAt(0, 1, 0);
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (reduced.matches) frame(0);
  });
  reduced.addEventListener('change', () => location.reload());

  if (reduced.matches) {
    frame(0); // one still picture, no motion
  } else {
    renderer.setAnimationLoop(frame);
  }
  return true;
}