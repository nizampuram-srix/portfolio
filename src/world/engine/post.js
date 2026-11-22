import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { registerShaderFallback } from './shaderGuard.js';

// One custom pass: colour grade + vignette + film grain.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.6 },
    uGrain: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    #define GRADE_SHADER 1
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = tex.rgb;

      // Colour grade: cool blue shadows, slightly warm highlights
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 cool = c * vec3(0.92, 0.99, 1.12);
      vec3 warm = c * vec3(1.06, 1.0, 0.92);
      c = mix(cool, warm, smoothstep(0.02, 0.5, l));

      // Vignette: darker corners
      float d = distance(vUv, vec2(0.5));
      float vig = 1.0 - smoothstep(0.25, 0.85, d);
      c *= mix(1.0, vig, uVignette);

      // Film grain: tiny random noise that changes every frame
      float n = hash12(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5;
      c += n * uGrain * 0.01;

      gl_FragColor = vec4(max(c, 0.0), tex.a);
    }
  `,
};

export function createPost(renderer, scene, camera, quality) {
  // Low tier: no passes at all, just draw the scene.
  if (!quality.post) {
    return {
      render: () => renderer.render(scene, camera),
      resize() {},
    };
  }

  let active = true;

  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, // lets bright things go above 1.0 so only they glow
    samples: quality.antialias ? 4 : 0, // smooth edges
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  if (quality.bloom) {
    // strength, radius, threshold: only pixels brighter than the threshold glow
    const strength = quality.tier === 'high' ? 0.6 : 0.45;
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), strength, 0.55, 1.0));
  }

  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uVignette.value = quality.vignette ? 0.6 : 0;
  grade.uniforms.uGrain.value = quality.grain ? 1 : 0;
  composer.addPass(grade);

  composer.addPass(new OutputPass()); // tone mapping (ACES) + final colours

  registerShaderFallback('GRADE_SHADER', () => {
    active = false; // draw the plain scene instead
  });

  return {
    render(dt, t) {
      if (!active) {
        renderer.render(scene, camera);
        return;
      }
      grade.uniforms.uTime.value = t;
      composer.render(dt);
    },
    resize(w, h) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    },
  };
}