// One place for every position in the camp. Later prompts import from here.
// y is always the TOP surface of the ground block under that spot.

export const HALF = 15; // ground is 31 x 31 blocks
export const FLAT_RADIUS = 9; // the camp area stays flat
export const EYE_HEIGHT = 1.7;

// Gentle hills. The middle (camp) stays flat.
export function heightAt(x, z) {
  if (Math.hypot(x, z) < FLAT_RADIUS) return 0;
  const h = Math.sin(x * 0.45) + Math.cos(z * 0.38) + Math.sin((x + z) * 0.2);
  return h > 1.1 ? 2 : h > 0.2 ? 1 : 0;
}

const at = (x, z, extra = {}) => ({ x, y: heightAt(x, z) + 0.5, z, ...extra });

export const CAMPFIRE = at(0, 0);
export const CHEST = at(6, 0); // 6 blocks east of the fire
export const SRIX_CHEST = at(-6, 3); // second chest (Prompt 12)
export const SIGNS = [
  at(-6, -3, { id: 'about' }),
  at(-3, -7, { id: 'projects' }),
  at(3, -7, { id: 'journey' }),
];
export const LANTERN_POSTS = [at(4, 4), at(-4, 4), at(4, -4), at(-4, -4)];
export const PLAYER_SPAWN = at(0, 5, { yaw: 0 }); // yaw 0 faces the fire