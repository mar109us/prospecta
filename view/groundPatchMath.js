import { normalize } from "./spotOrbit.js";
import { eastOf, metresToScene, northOf, sceneToMetres } from "./firstPersonMath.js";
import { fractalNoise } from "./noiseMath.js";

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function patchFrame(up) {
  return {
    up: up,
    east: eastOf(up),
    north: northOf(up),
  };
}

export function patchPointDirection(frame, eastMetres, northMetres) {
  const east = metresToScene(eastMetres);
  const north = metresToScene(northMetres);
  return normalize({
    x: frame.up.x + frame.east.x * east + frame.north.x * north,
    y: frame.up.y + frame.east.y * east + frame.north.y * north,
    z: frame.up.z + frame.east.z * east + frame.north.z * north,
  });
}

export function edgeFade(ratio, settings) {
  if (ratio <= settings.fadeStart) return 1;
  if (ratio >= settings.fadeEnd) return 0;
  const t = (ratio - settings.fadeStart) / (settings.fadeEnd - settings.fadeStart);
  return 1 - t * t * (3 - 2 * t);
}

export function noiseAt(direction, octaves) {
  const point = {
    x: sceneToMetres(direction.x),
    y: sceneToMetres(direction.y),
    z: sceneToMetres(direction.z),
  };
  return fractalNoise(point, octaves);
}

export function grainUv(anchor, direction, tileMetres) {
  return {
    u: sceneToMetres(dot(direction, anchor.east)) / tileMetres,
    v: sceneToMetres(dot(direction, anchor.north)) / tileMetres,
  };
}
