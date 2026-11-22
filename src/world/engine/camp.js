import * as THREE from 'three';
import { makeTextures, makeRng } from './textures.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const HALF = 15; // ground is 31 x 31 blocks

// Gentle hills. The middle (camp) stays flat.
function heightAt(x, z) {
  if (Math.hypot(x, z) < 6) return 0;
  const h = Math.sin(x * 0.45) + Math.cos(z * 0.38) + Math.sin((x + z) * 0.2);
  return h > 1.1 ? 2 : h > 0.2 ? 1 : 0;
}

function instanced(material, positions) {
  const mesh = new THREE.InstancedMesh(BOX, material, positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.setPosition(p[0], p[1], p[2]);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function buildCamp(scene, weak) {
  const tex = makeTextures();
  const lambert = (map) => new THREE.MeshLambertMaterial({ map });

  // Lights: dim blue moon + warm fire
  scene.add(new THREE.HemisphereLight(0x5a6aa0, 0x1a1f2e, 0.9));
  const moonLight = new THREE.DirectionalLight(0x8fa8ff, 1.0);
  moonLight.position.set(-20, 30, -15);
  scene.add(moonLight);

  const fireLight = new THREE.PointLight(0xff8a3c, 40, 22, 2);
  fireLight.position.set(0, 1.4, 0);
  scene.add(fireLight);

  // Ground
  const ground = [];
  for (let x = -HALF; x <= HALF; x++) {
    for (let z = -HALF; z <= HALF; z++) {
      ground.push([x, heightAt(x, z), z]);
    }
  }
  const side = lambert(tex.grassSide);
  const groundMats = [side, side, lambert(tex.grassTop), lambert(tex.dirt), side, side];
  scene.add(instanced(groundMats, ground));

  // Trees
  const rand = makeRng(42);
  const wanted = weak ? 18 : 40;
  const used = new Set();
  const trunks = [];
  const leaves = [];
  for (let tries = 0; tries < 600 && used.size < wanted; tries++) {
    const x = Math.round((rand() - 0.5) * 2 * (HALF - 1));
    const z = Math.round((rand() - 0.5) * 2 * (HALF - 1));
    const key = `${x},${z}`;
    if (Math.hypot(x, z) < 7 || used.has(key)) continue;
    used.add(key);
    const h = heightAt(x, z);
    for (let y = 1; y <= 4; y++) trunks.push([x, h + y, z]);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx !== 0 || dz !== 0) leaves.push([x + dx, h + 4, z + dz]);
        leaves.push([x + dx, h + 5, z + dz]);
      }
    }
    leaves.push([x, h + 6, z]);
  }
  scene.add(instanced(lambert(tex.bark), trunks));
  scene.add(instanced(lambert(tex.leaves), leaves));

  // Campfire: stone ring, two logs, three flames
  const stoneMat = lambert(tex.stone);
  const stoneGeo = new THREE.BoxGeometry(0.45, 0.35, 0.45);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(Math.cos(a) * 1.2, 0.675, Math.sin(a) * 1.2);
    stone.rotation.y = a;
    scene.add(stone);
  }

  const logMat = lambert(tex.bark);
  const logGeo = new THREE.BoxGeometry(1.3, 0.22, 0.22);
  for (let i = 0; i < 2; i++) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(0, 0.62, 0);
    log.rotation.y = i * (Math.PI / 2) + 0.4;
    scene.add(log);
  }

  const flames = [];
  [
    [0.5, 0.7, 0xff7a1a],
    [0.3, 0.95, 0xffc23d],
    [0.16, 0.5, 0xfff2a0],
  ].forEach(([w, h, color]) => {
    const geo = new THREE.BoxGeometry(w, h, w);
    geo.translate(0, h / 2, 0); // grow upward from the bottom
    const flame = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
    flame.position.set(0, 0.7, 0);
    scene.add(flame);
    flames.push(flame);
  });

  // Stars
  const starCount = weak ? 250 : 700;
  const starPos = new Float32Array(starCount * 3);
  const sr = makeRng(7);
  for (let i = 0; i < starCount; i++) {
    const theta = sr() * Math.PI * 2;
    const u = 0.1 + sr() * 0.9; // upper half of the sky only
    const s = Math.sqrt(1 - u * u);
    starPos[i * 3] = 90 * s * Math.cos(theta);
    starPos[i * 3 + 1] = 90 * u;
    starPos[i * 3 + 2] = 90 * s * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })
    )
  );

  // Square moon
  const moon = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ color: 0xf2f4d8, fog: false })
  );
  moon.position.set(-40, 50, -60);
  moon.lookAt(0, 0, 0);
  scene.add(moon);

  return {
    update(t, animate) {
      const f = animate ? 1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 23) * 0.08 : 1;
      flames.forEach((flame, i) => {
        flame.scale.y = animate ? f + Math.sin(t * 7 + i * 2) * 0.15 : 1;
      });
      fireLight.intensity = 40 * f;
    },
  };
}