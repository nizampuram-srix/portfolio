import * as THREE from 'three';
import { makeTextures, makeRng } from './textures.js';
import { HALF, FLAT_RADIUS, CAMPFIRE, heightAt } from './layout.js';
import { MOON_DIR } from './sky.js';

const AO_STRENGTH = 0.07; // bigger = darker block edges and bottoms

// A block whose vertices are darker near the edges and at the bottom.
// This fake "ambient occlusion" makes blocks look softly shaded for free.
function makeAoBox() {
  const geo = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const nx = Math.abs(nor.getX(i));
    const ny = nor.getY(i);
    const nz = Math.abs(nor.getZ(i));
    // 0 = middle of the face, 1 = at its edge (added up for both directions)
    let edge = 0;
    if (nx < 0.5) edge += Math.abs(px) * 2;
    if (Math.abs(ny) < 0.5) edge += Math.abs(py) * 2;
    if (nz < 0.5) edge += Math.abs(pz) * 2;
    let b = 1 - AO_STRENGTH * edge;
    if (Math.abs(ny) < 0.5) b -= 0.16 * (0.5 - py); // side faces get darker toward the bottom
    if (ny < -0.5) b = 0.5; // underside
    b = Math.max(0.35, Math.min(1, b));
    colors[i * 3] = b;
    colors[i * 3 + 1] = b;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}
const AO_BOX = makeAoBox();

function instanced(material, positions) {
  const mesh = new THREE.InstancedMesh(AO_BOX, material, positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.setPosition(p[0], p[1], p[2]);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildCamp(scene, quality) {
  const tex = makeTextures();
  const lambert = (map) => new THREE.MeshLambertMaterial({ map, vertexColors: true });

  // Lights: soft cool moonlight + warm fire (Prompt 9 adds lanterns, 3 or 4 lights in total)
  scene.add(new THREE.HemisphereLight(0x5a6aa0, 0x1a1f2e, 0.9));
  const moonLight = new THREE.DirectionalLight(0x8fa8ff, 0.85);
  moonLight.position.copy(MOON_DIR).multiplyScalar(40); // same direction as the moon in the sky
  if (quality.shadows) {
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    const cam = moonLight.shadow.camera;
    cam.left = -22;
    cam.right = 22;
    cam.top = 22;
    cam.bottom = -22;
    cam.near = 1;
    cam.far = 90;
    moonLight.shadow.bias = -0.0004;
    moonLight.shadow.normalBias = 0.03;
  }
  scene.add(moonLight);

  const fireLight = new THREE.PointLight(0xff8a3c, 40, 22, 2);
  fireLight.position.set(CAMPFIRE.x, CAMPFIRE.y + 0.9, CAMPFIRE.z);
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

  // Trees (kept outside the flat camp area)
  const rand = makeRng(42);
  const used = new Set();
  const trunks = [];
  const leaves = [];
  for (let tries = 0; tries < 800 && used.size < quality.trees; tries++) {
    const x = Math.round((rand() - 0.5) * 2 * (HALF - 1));
    const z = Math.round((rand() - 0.5) * 2 * (HALF - 1));
    const key = `${x},${z}`;
    if (Math.hypot(x, z) < FLAT_RADIUS || used.has(key)) continue;
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

  // Campfire: stone ring, two logs, three flames (Prompt 8 replaces the flames)
  const stoneMat = new THREE.MeshLambertMaterial({ map: tex.stone });
  const stoneGeo = new THREE.BoxGeometry(0.45, 0.35, 0.45);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(
      CAMPFIRE.x + Math.cos(a) * 1.2,
      CAMPFIRE.y + 0.175,
      CAMPFIRE.z + Math.sin(a) * 1.2
    );
    stone.rotation.y = a;
    scene.add(stone);
  }

  const logMat = new THREE.MeshLambertMaterial({ map: tex.bark });
  const logGeo = new THREE.BoxGeometry(1.3, 0.22, 0.22);
  for (let i = 0; i < 2; i++) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(CAMPFIRE.x, CAMPFIRE.y + 0.12, CAMPFIRE.z);
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
    flame.position.set(CAMPFIRE.x, CAMPFIRE.y + 0.2, CAMPFIRE.z);
    scene.add(flame);
    flames.push(flame);
  });

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