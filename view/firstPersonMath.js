import { flattenOnto, normalize, turnAround } from "./spotOrbit.js";

const MOON_RADIUS_METRES = 1737400;
const QUARTER_TURN = Math.PI / 2;
const WORLD_UP = {
  x: 0,
  y: 1,
  z: 0,
};

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function metresToScene(metres) {
  return metres / MOON_RADIUS_METRES;
}

export function rightOf(walker) {
  return turnAround(walker.forward, walker.up, -QUARTER_TURN);
}

export function moveDirection(walker, keys) {
  let ahead = 0;
  let side = 0;
  if (keys.forward) ahead += 1;
  if (keys.back) ahead -= 1;
  if (keys.right) side += 1;
  if (keys.left) side -= 1;
  if (ahead === 0 && side === 0) return null;

  const right = rightOf(walker);
  return normalize({
    x: walker.forward.x * ahead + right.x * side,
    y: walker.forward.y * ahead + right.y * side,
    z: walker.forward.z * ahead + right.z * side,
  });
}

export function walkStep(walker, direction, angle) {
  const up = normalize({
    x: walker.up.x * Math.cos(angle) + direction.x * Math.sin(angle),
    y: walker.up.y * Math.cos(angle) + direction.y * Math.sin(angle),
    z: walker.up.z * Math.cos(angle) + direction.z * Math.sin(angle),
  });
  return {
    up: up,
    forward: flattenOnto(walker.forward, up),
  };
}

export function walk(walker, keys, distance) {
  const direction = moveDirection(walker, keys);
  if (!direction) return walker;
  return walkStep(walker, direction, distance);
}

export function turnHeading(walker, degreesRight) {
  return turnAround(walker.forward, walker.up, -toRadians(degreesRight));
}

export function clampPitch(degrees, maxDegrees) {
  return Math.min(Math.max(degrees, -maxDegrees), maxDegrees);
}

export function lookDirection(walker, pitchDegrees) {
  const pitch = toRadians(pitchDegrees);
  return {
    x: walker.forward.x * Math.cos(pitch) + walker.up.x * Math.sin(pitch),
    y: walker.forward.y * Math.cos(pitch) + walker.up.y * Math.sin(pitch),
    z: walker.forward.z * Math.cos(pitch) + walker.up.z * Math.sin(pitch),
  };
}

export function headingDegrees(walker) {
  const north = flattenOnto(WORLD_UP, walker.up);
  const east = turnAround(north, walker.up, -QUARTER_TURN);
  const angle = Math.atan2(dot(walker.forward, east), dot(walker.forward, north));
  let degrees = (angle * 180) / Math.PI;
  if (degrees < 0) degrees += 360;
  return degrees;
}
