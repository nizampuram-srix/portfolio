// If a custom shader fails to compile, this logs a clear message and runs a fallback.
// Each shader has a marker word (for example SKY_SHADER) written inside its code.
// Prompt 8 reuses this for the flames.

const fallbacks = [];

export function registerShaderFallback(marker, fn) {
  fallbacks.push({ marker, fn });
}

export function installShaderGuard(renderer) {
  renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
    const log = gl.getShaderInfoLog(fragmentShader) || gl.getShaderInfoLog(vertexShader) || '(no details)';
    const source = gl.getShaderSource(fragmentShader) || '';
    console.error('[world] A shader failed to compile, so a simple fallback is used instead.\n' + log);
    for (const item of fallbacks) {
      if (source.includes(item.marker)) item.fn();
    }
  };
}