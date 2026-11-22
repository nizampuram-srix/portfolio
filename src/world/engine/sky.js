import * as THREE from 'three';
import { registerShaderFallback } from './shaderGuard.js';

// The fog colour is shared: far ground fades into this, and the sky horizon matches it.
export const FOG_COLOR = new THREE.Color(0x172350);
// Direction of the moon in the sky. The moonlight in camp.js comes from the same direction.
export const MOON_DIR = new THREE.Vector3(-40, 50, -60).normalize();

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position; // the direction from the centre of the sky dome
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  #define SKY_SHADER 1
  uniform float uTime;
  uniform vec3 uMoonDir;
  uniform vec3 uFog;
  uniform float uStarDensity;
  uniform float uAurora;
  uniform float uShoot;
  varying vec3 vDir;

  // Random number from a 3D / 2D position (same input gives the same output)
  float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  // Smooth blobby noise, used for the aurora
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float y = dir.y; // 1 = straight up, 0 = horizon, below 0 = under the ground

    // 1. Sky colour: fog colour at the horizon, indigo higher, deep navy at the top.
    vec3 mid = vec3(0.006, 0.010, 0.050);
    vec3 zenith = vec3(0.002, 0.003, 0.020);
    vec3 col = mix(uFog, mid, smoothstep(0.0, 0.30, y));
    col = mix(col, zenith, smoothstep(0.25, 1.0, y));

    // 2. Warm glow hugging the horizon (it looks like firelight and far lights)
    float glow = exp(-max(y, 0.0) * 9.0) * smoothstep(-0.25, 0.0, y);
    col += vec3(0.060, 0.022, 0.008) * glow;

    float above = smoothstep(0.03, 0.22, y); // hides stars near and below the horizon

    // 3. Twinkling stars. The sky is cut into tiny 3D cells and some cells get a star.
    vec3 sp = dir * 150.0;
    vec3 cell = floor(sp);
    vec3 f = fract(sp) - 0.5;
    float h = hash31(cell);
    if (h < uStarDensity) {
      float h2 = hash31(cell + 17.0);
      float h3 = hash31(cell + 41.0);
      float size = 0.12 + 0.2 * h2;
      float s = 1.0 - smoothstep(0.0, size, length(f));
      float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + 3.0 * h3) + h * 60.0);
      vec3 tint = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.88, 0.7), h3);
      col += tint * s * twinkle * (0.5 + 1.1 * h2) * above;
    }

    // 4. The moon: a blocky square with a soft glowing halo.
    float d = dot(dir, uMoonDir);
    if (d > 0.0) {
      vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), uMoonDir));
      vec3 up = cross(uMoonDir, right);
      vec3 q = dir / d - uMoonDir;
      vec2 m = vec2(dot(q, right), dot(q, up));
      float sq = max(abs(m.x), abs(m.y)); // square distance from the moon centre
      float R = 0.07;                     // half the moon size
      float halo = exp(-max(sq - R, 0.0) * 9.0);
      col += vec3(0.22, 0.30, 0.60) * halo * 0.25;
      float speck = hash21(floor(m / 0.0175) + 7.0); // blocky craters
      vec3 moonCol = vec3(1.0, 1.0, 0.88) * (1.55 - 0.35 * speck); // above 1.0 so bloom picks it up
      col = mix(col, moonCol, step(sq, R));
    }

    // 5. Aurora (high quality only): soft green and purple curtains on one side of the sky.
    if (uAurora > 0.5) {
      float ang = atan(dir.z, dir.x);
      float band = smoothstep(0.12, 0.30, y) * (1.0 - smoothstep(0.40, 0.75, y));
      float curtain = noise2(vec2(ang * 2.5 + uTime * 0.04, uTime * 0.03));
      float rays = noise2(vec2(ang * 18.0 + uTime * 0.08, y * 4.0));
      float side = smoothstep(-0.2, 0.8, dot(normalize(dir.xz + 0.0001), vec2(0.35, -0.94)));
      float a = band * smoothstep(0.40, 0.85, curtain) * (0.45 + 0.55 * rays) * side;
      vec3 aur = mix(vec3(0.05, 0.9, 0.45), vec3(0.45, 0.25, 0.9), smoothstep(0.25, 0.7, y));
      col += aur * a * 0.07;
    }

    // 6. A shooting star about every 8 seconds, visible for about 1 second.
    if (uShoot > 0.5) {
      float period = 8.0;
      float id = floor(uTime / period);
      float tt = uTime - id * period;
      float dur = 1.1;
      if (tt < dur) {
        vec3 s = normalize(vec3(hash21(vec2(id * 7.13, 1.0)) - 0.5,
                                0.45 + 0.35 * hash21(vec2(id * 7.13, 2.0)),
                                hash21(vec2(id * 7.13, 3.0)) - 0.5));
        vec3 rnd = normalize(vec3(hash21(vec2(id * 3.7, 4.0)) - 0.5,
                                  hash21(vec2(id * 3.7, 5.0)) - 0.5,
                                  hash21(vec2(id * 3.7, 6.0)) - 0.5) + 0.001);
        vec3 v = normalize(cross(s, rnd));
        v *= (v.y > 0.0) ? -1.0 : 1.0; // always falls downward
        float head = tt * 0.45;
        float tail = 0.18;
        vec3 u = dir - s;
        float a = dot(u, v);
        float b = length(u - v * a);
        float inside = step(0.0, a) * step(head - tail, a) * step(a, head) * step(0.5, dot(dir, s));
        float streak = (1.0 - smoothstep(0.0, 0.003, b)) * smoothstep(head - tail, head, a) * inside;
        float fade = sin(3.14159 * tt / dur);
        col += vec3(0.9, 0.95, 1.0) * streak * fade * 1.5 * above;
      }
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Plain gradient used if the shader above fails to compile.
function makeFallbackMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#03061a');
  grad.addColorStop(0.5, '#172350');
  grad.addColorStop(1, '#172350');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, fog: false });
}

export function createSky(scene, quality) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uMoonDir: { value: MOON_DIR.clone() },
      uFog: { value: FOG_COLOR.clone() },
      uStarDensity: { value: quality.stars / 25000 }, // bigger number = more stars
      uAurora: { value: quality.aurora ? 1 : 0 },
      uShoot: { value: quality.shootingStars ? 1 : 0 },
    },
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1; // draw first, behind everything
  scene.add(mesh);

  registerShaderFallback('SKY_SHADER', () => {
    mesh.material = makeFallbackMaterial();
  });

  return {
    update(t, camera) {
      material.uniforms.uTime.value = t;
      mesh.position.copy(camera.position); // the sky follows you, so it never gets closer
    },
  };
}