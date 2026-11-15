import { RESOURCE_BANDS } from "../settings.js";

export function noiseRatio(grid) {
  if (!grid.uncertainty) return 0;

  const displayRange = grid.displayMax - grid.displayMin;
  const ratio = (RESOURCE_BANDS.errorsPerBand * grid.uncertainty) / displayRange;
  return Math.min(ratio, RESOURCE_BANDS.maxNoiseRatio);
}

export function curvePower(noise) {
  return RESOURCE_BANDS.baseCurvePower / (1 - noise);
}
