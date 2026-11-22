import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMPFIRE, CHEST, SRIX_CHEST, SIGNS, LANTERN_POSTS, PLAYER_SPAWN } from './layout.js';

// Debug mode is on when the address ends with ?debug
export const DEBUG = new URLSearchParams(location.search).has('debug');

function marker(scene, p, color) {
  const height = 3;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, height, 0.3),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  mesh.position.set(p.x, p.y + height / 2, p.z);
  scene.add(mesh);
}

export function setupDebug(scene, camera, renderer, quality) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(CAMPFIRE.x, 1, CAMPFIRE.z);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49; // stay above the ground
  camera.position.set(14, 9, 14);
  controls.update();

  marker(scene, PLAYER_SPAWN, 0x00ff66);
  marker(scene, CHEST, 0xff3333);
  marker(scene, SRIX_CHEST, 0xff9900);
  SIGNS.forEach((p) => marker(scene, p, 0xffee00));
  LANTERN_POSTS.forEach((p) => marker(scene, p, 0x33ddff));

  const label = document.createElement('div');
  label.className = 'debug-label';
  label.textContent =
    `DEBUG | quality: ${quality.tier} (add &quality=low|medium|high)\n` +
    'green spawn | red chest | orange Srix chest | yellow signs | cyan lanterns';
  document.body.appendChild(label);

  return { update: () => controls.update() };
}