const KEY = 'srix-choice';

export function getTier() {
  const reasons = [];

  if (window.matchMedia('(pointer: coarse)').matches) reasons.push('touch');
  if (navigator.deviceMemory && navigator.deviceMemory < 4) reasons.push('low-memory');
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) reasons.push('few-cores');
  if (window.innerWidth < 800) reasons.push('small-screen');

  return { weak: reasons.length > 0, reasons };
}

export function saveChoice(choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch (e) {
    /* storage blocked: ignore */
  }
}

export function getLastChoice() {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
}