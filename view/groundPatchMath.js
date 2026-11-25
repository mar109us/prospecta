import { normalize } from "./spotOrbit.js";
import { eastOf, metresToScene, northOf, sceneToMetres } from "./firstPersonMath.js";
import { fractalNoise } from "./noiseMath.js";

export const GRAIN_TURN = {
  cos: 0.8,
  sin: 0.6,
};

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

export function patchPointMetres(frame, direction) {
  const upPart = dot(direction, frame.up);
  return {
    eastMetres: sceneToMetres(dot(direction, frame.east) / upPart),
    northMetres: sceneToMetres(dot(direction, frame.north) / upPart),
  };
}

export function snapToGrid(metres, spacingMetres) {
  return Math.round(metres / spacingMetres) * spacingMetres;
}

export function edgeFade(ratio, settings) {
  if (ratio <= settings.flattenFrom) return 1;
  if (ratio >= settings.flattenUntil) return 0;
  const t = (ratio - settings.flattenFrom) / (settings.flattenUntil - settings.flattenFrom);
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

export function turnGrainUv(uv, scale) {
  return {
    u: (GRAIN_TURN.cos * uv.u - GRAIN_TURN.sin * uv.v) * scale,
    v: (GRAIN_TURN.sin * uv.u + GRAIN_TURN.cos * uv.v) * scale,
  };
}

export function secondGrainOffset(offset, scale) {
  const turned = turnGrainUv(offset, scale);
  return {
    u: turned.u - Math.floor(turned.u),
    v: turned.v - Math.floor(turned.v),
  };
}
