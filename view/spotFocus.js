import * as THREE from "three";
import { CAMERA } from "../settings.js";
import { easeInOut, slerpDirection } from "./cameraMath.js";
import { cameraPosition, flattenOnto, normalize, turnAround } from "./spotOrbit.js";

const DRAG_TOLERANCE_PX = 5;
const MOON_CENTRE = new THREE.Vector3(0, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function toVector3(point) {
  return new THREE.Vector3(point.x, point.y, point.z);
}

function lookRotation(eye, target, up) {
  const matrix = new THREE.Matrix4().lookAt(eye, target, up);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function progressBetween(elapsedMs, startMs, durationMs) {
  const progress = Math.min(Math.max((elapsedMs - startMs) / durationMs, 0), 1);
  return easeInOut(progress);
}

function normalView(camera) {
  const point = camera.position.clone().normalize();
  const screenUp = WORLD_UP.clone().applyQuaternion(camera.quaternion);
  return {
    point: point,
    away: flattenOnto(screenUp, point),
    tilt: 0,
    distance: camera.position.length() - 1,
  };
}

function copyView(view) {
  return {
    point: toVector3(view.point),
    away: {
      x: view.away.x,
      y: view.away.y,
      z: view.away.z,
    },
    tilt: view.tilt,
    distance: view.distance,
  };
}

function panPoint(from, to, amount) {
  const fromRadius = Math.hypot(from.x, from.y, from.z);
  const toRadius = Math.hypot(to.x, to.y, to.z);
  const direction = slerpDirection(normalize(from), normalize(to), amount);
  const radius = fromRadius + (toRadius - fromRadius) * amount;
  return toVector3(direction).multiplyScalar(radius);
}

function applyView(globe, view) {
  const position = toVector3(cameraPosition(view));
  globe.camera.position.copy(position);
  globe.camera.quaternion.copy(lookRotation(position, view.point, toVector3(view.away)));
}

function updateOrbit(globe, focus) {
  const now = performance.now();
  const elapsedMs = now - focus.startTime;
  const pan = progressBetween(elapsedMs, 0, CAMERA.flyDurationMs);
  const tilt = progressBetween(elapsedMs, CAMERA.flyDurationMs, CAMERA.tiltDurationMs);
  const turn = ((now - focus.lastTime) / 1000 / CAMERA.orbitSecondsPerTurn) * 2 * Math.PI;
  focus.lastTime = now;

  const view = focus.view;
  view.point = panPoint(focus.from.point, focus.to.point, pan);
  const normal = normalize(view.point);
  view.away = turnAround(flattenOnto(view.away, normal), normal, turn);
  view.distance = focus.from.distance + (focus.to.distance - focus.from.distance) * pan;
  view.tilt = focus.from.tilt + (focus.to.tilt - focus.from.tilt) * tilt;
  applyView(globe, view);
}

function updateRelease(globe, focus) {
  const elapsedMs = performance.now() - focus.startTime;
  const progress = progressBetween(elapsedMs, 0, CAMERA.releaseDurationMs);

  const view = focus.view;
  view.tilt = focus.from.tilt * (1 - progress);
  const position = toVector3(cameraPosition(view));
  const spotRotation = lookRotation(position, view.point, toVector3(view.away));
  const normalRotation = lookRotation(position, MOON_CENTRE, WORLD_UP);
  globe.camera.position.copy(position);
  globe.camera.quaternion.slerpQuaternions(spotRotation, normalRotation, progress);

  if (progress === 1) {
    globe.spotFocus = null;
    globe.controls.enabled = true;
    console.log("Spot focus ended, normal controls are back");
  }
}

export function updateSpotFocus(globe) {
  const focus = globe.spotFocus;
  if (focus.phase === "release") {
    updateRelease(globe, focus);
    return;
  }
  updateOrbit(globe, focus);
}

export function focusOnSpot(globe, spotPosition) {
  let from = normalView(globe.camera);
  if (globe.spotFocus) from = copyView(globe.spotFocus.view);

  globe.controls.enabled = false;
  globe.spotFocus = {
    phase: "orbit",
    startTime: performance.now(),
    lastTime: performance.now(),
    from: from,
    to: {
      point: toVector3(spotPosition),
      tilt: CAMERA.orbitTiltDegrees,
      distance: CAMERA.orbitDistance,
    },
    view: copyView(from),
  };
  console.table(globe.spotFocus.to);
}

export function cancelSpotFocus(globe) {
  const focus = globe.spotFocus;
  if (!focus) return;
  if (focus.phase === "release") return;

  globe.spotFocus = {
    phase: "release",
    startTime: performance.now(),
    from: copyView(focus.view),
    view: copyView(focus.view),
  };
  console.log("Spot focus cancelled, easing back to normal view");
}

export function connectFocusCancel(globe) {
  const canvas = globe.renderer.domElement;
  let isPressed = false;
  let pressX = 0;
  let pressY = 0;

  canvas.addEventListener("pointerdown", (event) => {
    isPressed = true;
    pressX = event.clientX;
    pressY = event.clientY;
  });
  canvas.addEventListener("pointerup", () => {
    isPressed = false;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!isPressed) return;
    const movedPx = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (movedPx > DRAG_TOLERANCE_PX) cancelSpotFocus(globe);
  });
  canvas.addEventListener("wheel", () => cancelSpotFocus(globe));
}
