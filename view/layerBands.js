export const BAND_COUNT = 5;
const BASE_CURVE_POWER = 2;
const MAX_NOISE_RATIO = 0.95;
const ERRORS_PER_BAND = 2;

export function noiseRatio(grid) {
  if (!grid.uncertainty) return 0;

  const displayRange = grid.displayMax - grid.displayMin;
  const ratio = (ERRORS_PER_BAND * grid.uncertainty) / displayRange;
  return Math.min(ratio, MAX_NOISE_RATIO);
}

export function curvePower(noise) {
  return BASE_CURVE_POWER / (1 - noise);
}
