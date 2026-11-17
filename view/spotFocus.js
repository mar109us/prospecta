import * as THREE from "three";
import { CAMERA } from "../settings.js";
import { clampTilt, easeInOut, slerpDirection, zoomOrbitDistance } from "./cameraMath.js";
import { applyView, northOf, toVector3, viewFromBase } from "./cameraView.js";
import { flattenOnto, normalize, turnAround } from "./spotOrbit.js";

const DRAG_TOLERANCE_PX = 5;
const LEFT_BUTTON = 0;
const MOON_CENTRE = new THREE.Vector3(0, 0, 0);

function progressBetween(elapsedMs, startMs, durationMs) {
  const progress = Math.min(Math.max((elapsedMs - startMs) / durationMs, 0), 1);
  return easeInOut(progress);
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
  applyView(globe.camera, view);
}

function handOverToControls(globe, view) {
  const baseRadius = view.point.length() + view.distance;
  const baseCamera = globe.tilt.baseCamera;
  baseCamera.position.copy(view.point).normalize().multiplyScalar(baseRadius);
  baseCamera.lookAt(MOON_CENTRE);
  globe.tilt.degrees = view.tilt;
  globe.tilt.pivotRadius = view.point.length();
  globe.spotFocus = null;
  globe.controls.enabled = true;
  console.log("Spot focus ended, normal controls are back");
}

function updateRelease(globe, focus) {
  const elapsedMs = performance.now() - focus.startTime;
  const progress = progressBetween(elapsedMs, 0, CAMERA.releaseDurationMs);

  const view = focus.view;
  const normal = normalize(view.point);
  view.away = slerpDirection(focus.from.away, northOf(normal), progress);
  applyView(globe.camera, view);

  if (progress === 1) handOverToControls(globe, view);
}

export function updateSpotFocus(globe) {
  const focus = globe.spotFocus;
  if (focus.phase === "release") {
    updateRelease(globe, focus);
    return;
  }
  updateOrbit(globe, focus);
}

function orbitTarget(globe, spotPosition) {
  const target = {
    point: toVector3(spotPosition),
    tilt: CAMERA.orbitTiltDegrees,
    distance: CAMERA.orbitDistance,
  };
  const focus = globe.spotFocus;
  if (focus && focus.phase === "orbit") {
    target.tilt = focus.to.tilt;
    target.distance = focus.to.distance;
  }
  return target;
}

export function focusOnSpot(globe, spotPosition) {
  let from = viewFromBase(globe.tilt);
  if (globe.spotFocus) from = copyView(globe.spotFocus.view);

  globe.controls.enabled = false;
  globe.spotFocus = {
    phase: "orbit",
    startTime: performance.now(),
    lastTime: performance.now(),
    from: from,
    to: orbitTarget(globe, spotPosition),
    view: copyView(from),
  };
  console.table(globe.spotFocus.to);
}

export function tiltSpotOrbit(globe, deltaDegrees) {
  const focus = globe.spotFocus;
  if (!focus) return;
  if (focus.phase !== "orbit") return;
  focus.to.tilt = clampTilt(focus.to.tilt + deltaDegrees, CAMERA.maxTiltDegrees);
}

function zoomSpotOrbit(globe, wheelDelta) {
  const focus = globe.spotFocus;
  if (!focus) return;
  if (focus.phase !== "orbit") return;
  const spotRadius = focus.to.point.length();
  const zoomRange = {
    step: CAMERA.orbitZoomStep,
    min: CAMERA.minDistance - spotRadius,
    max: CAMERA.maxDistance - spotRadius,
  };
  focus.to.distance = zoomOrbitDistance(focus.to.distance, wheelDelta, zoomRange);
  console.log(`Orbit distance: ${focus.to.distance.toFixed(2)}`);
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
    if (event.button !== LEFT_BUTTON) return;
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
  canvas.addEventListener("wheel", (event) => zoomSpotOrbit(globe, event.deltaY));
}
