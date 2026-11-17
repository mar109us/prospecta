import * as THREE from "three";
import { CAMERA } from "../settings.js";
import { clampTilt } from "./cameraMath.js";
import { applyView, viewFromBase } from "./cameraView.js";
import { tiltSpotOrbit } from "./spotFocus.js";

const RIGHT_BUTTON = 2;

export function createTiltState(camera) {
  const baseCamera = new THREE.PerspectiveCamera();
  baseCamera.position.copy(camera.position);
  return {
    degrees: 0,
    pivotRadius: 1,
    baseCamera: baseCamera,
  };
}

export function applyTilt(globe) {
  applyView(globe.camera, viewFromBase(globe.tilt));
}

function changeTilt(globe, deltaDegrees) {
  if (globe.spotFocus) {
    tiltSpotOrbit(globe, deltaDegrees);
    return;
  }
  globe.tilt.degrees = clampTilt(globe.tilt.degrees + deltaDegrees, CAMERA.maxTiltDegrees);
}

export function connectTiltDrag(globe) {
  const canvas = globe.renderer.domElement;
  let isTilting = false;
  let lastY = 0;

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== RIGHT_BUTTON) return;
    isTilting = true;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!isTilting) return;
    changeTilt(globe, (event.clientY - lastY) * CAMERA.tiltDegreesPerPixel);
    lastY = event.clientY;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.button !== RIGHT_BUTTON) return;
    isTilting = false;
    logTilt(globe);
  });
}

function logTilt(globe) {
  const state = {
    freeTilt: globe.tilt.degrees,
    orbitTilt: null,
  };
  if (globe.spotFocus && globe.spotFocus.phase === "orbit") state.orbitTilt = globe.spotFocus.to.tilt;
  console.table(state);
}
