import { FIRST_PERSON } from "../settings.js";
import { distanceKm } from "../data/geo.js";
import { lookRotation, toVector3, viewFromBase } from "./cameraView.js";
import { flattenOnto, normalize } from "./spotOrbit.js";
import { scenePositionToLatLon } from "./terrainMath.js";
import { updateGround } from "./firstPersonGround.js";
import { headingDegrees, lookDirection, metresToScene, walk, walkSpeed } from "./firstPersonMath.js";
import { connectFirstPersonInput } from "./firstPersonInput.js";

const MAX_FRAME_SECONDS = 0.1;

function screenCentreStart(globe) {
  let view = viewFromBase(globe.tilt);
  if (globe.spotFocus) view = globe.spotFocus.view;
  const up = normalize(view.point);
  return {
    up: up,
    forward: flattenOnto(view.away, up),
  };
}

function setButtonLabel(text) {
  const button = document.getElementById("walk-button");
  if (button) button.textContent = text;
}

function saveCamera(globe) {
  return {
    basePosition: globe.tilt.baseCamera.position.clone(),
    baseQuaternion: globe.tilt.baseCamera.quaternion.clone(),
    tiltDegrees: globe.tilt.degrees,
    pivotRadius: globe.tilt.pivotRadius,
    lens: {
      fov: globe.camera.fov,
      near: globe.camera.near,
      far: globe.camera.far,
    },
  };
}

function setLens(camera, lens) {
  camera.fov = lens.fov;
  camera.near = lens.near;
  camera.far = lens.far;
  camera.updateProjectionMatrix();
}

function logWalker(walker) {
  if (!walker) {
    console.log("First person off, orbit view is back");
    return;
  }
  const latLon = scenePositionToLatLon(walker.up.x, walker.up.y, walker.up.z);
  console.table({
    lat: latLon.lat,
    lon: latLon.lon,
    headingDegrees: headingDegrees(walker),
    pitchDegrees: walker.pitchDegrees,
    groundKm: walker.groundKm,
    groundSource: walker.groundSource,
    odometerKm: walker.odometerKm,
  });
}

function enterFirstPerson(globe, grid, start) {
  globe.firstPerson = {
    grid: grid,
    up: start.up,
    forward: start.forward,
    pitchDegrees: 0,
    groundKm: 0,
    groundRadius: 1,
    groundSource: "coarse",
    odometerKm: 0,
    keys: {
      forward: false,
      back: false,
      left: false,
      right: false,
      sprint: false,
    },
    lastTime: performance.now(),
    saved: saveCamera(globe),
  };
  globe.spotFocus = null;
  globe.controls.enabled = false;
  setLens(globe.camera, {
    fov: FIRST_PERSON.fov,
    near: metresToScene(FIRST_PERSON.nearMetres),
    far: metresToScene(FIRST_PERSON.farKm * 1000),
  });
  setButtonLabel("exit");
  logWalker(globe.firstPerson);
}

function moveWalker(walker, start) {
  walker.up = start.up;
  walker.forward = start.forward;
  walker.pitchDegrees = 0;
  walker.odometerKm = 0;
  logWalker(walker);
}

export function enterFirstPersonAt(globe, grid, start) {
  if (globe.firstPerson) {
    moveWalker(globe.firstPerson, start);
    return;
  }
  enterFirstPerson(globe, grid, start);
}

function exitFirstPerson(globe) {
  const saved = globe.firstPerson.saved;
  globe.tilt.baseCamera.position.copy(saved.basePosition);
  globe.tilt.baseCamera.quaternion.copy(saved.baseQuaternion);
  globe.tilt.degrees = saved.tiltDegrees;
  globe.tilt.pivotRadius = saved.pivotRadius;
  setLens(globe.camera, saved.lens);
  globe.firstPerson = null;
  globe.spotFocus = null;
  globe.controls.enabled = true;
  if (document.pointerLockElement) document.exitPointerLock();
  setButtonLabel("walk");
  logWalker(globe.firstPerson);
}

function placeCamera(camera, walker) {
  const height = walker.groundRadius + metresToScene(FIRST_PERSON.eyeHeightMetres);
  const position = toVector3(walker.up).multiplyScalar(height);
  const target = position.clone().add(toVector3(lookDirection(walker, walker.pitchDegrees)));
  camera.position.copy(position);
  camera.quaternion.copy(lookRotation(position, target, toVector3(walker.up)));
}

export function updateFirstPerson(globe) {
  const walker = globe.firstPerson;
  const now = performance.now();
  const seconds = Math.min((now - walker.lastTime) / 1000, MAX_FRAME_SECONDS);
  walker.lastTime = now;

  const distance = metresToScene(walkSpeed(walker.keys, FIRST_PERSON) * seconds);
  const moved = walk(walker, walker.keys, distance);
  walker.odometerKm += distanceKm(walker.up, moved.up);
  walker.up = moved.up;
  walker.forward = moved.forward;
  updateGround(globe, walker);
  placeCamera(globe.camera, walker);
}

function toggleFirstPerson(globe, grid, button) {
  button.blur();
  if (globe.firstPerson) {
    exitFirstPerson(globe);
    return;
  }
  enterFirstPerson(globe, grid, screenCentreStart(globe));
}

export function connectFirstPerson(globe, grid) {
  const button = document.getElementById("walk-button");
  if (!button) {
    console.error('First person is off: no element with id "walk-button" in main.html.');
    return;
  }
  if (!grid) {
    button.title = "Walking needs the terrain, which did not load.";
    return;
  }
  button.disabled = false;
  button.addEventListener("click", () => toggleFirstPerson(globe, grid, button));
  connectFirstPersonInput(globe, logWalker);
}
