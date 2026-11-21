import { FIRST_PERSON } from "../settings.js";
import { clampPitch, turnHeading } from "./firstPersonMath.js";

const KEY_TO_MOVE = {
  KeyW: "forward",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

function releaseAllKeys(walker) {
  for (const move in walker.keys) {
    walker.keys[move] = false;
  }
}

function pressKey(walker, code) {
  if (code === "KeyR") {
    walker.odometerKm = 0;
    console.log("Odometer reset to 0 km");
    return;
  }
  const move = KEY_TO_MOVE[code];
  if (move) walker.keys[move] = true;
}

function releaseKey(walker, code) {
  const move = KEY_TO_MOVE[code];
  if (!move) return false;
  walker.keys[move] = false;
  return true;
}

function connectKeys(globe, onRelease) {
  document.addEventListener("keydown", (event) => {
    if (globe.firstPerson) pressKey(globe.firstPerson, event.code);
  });
  document.addEventListener("keyup", (event) => {
    if (!globe.firstPerson) return;
    if (releaseKey(globe.firstPerson, event.code)) onRelease(globe.firstPerson);
  });
  window.addEventListener("blur", () => {
    if (globe.firstPerson) releaseAllKeys(globe.firstPerson);
  });
}

function look(walker, movementX, movementY) {
  const degreesPerPixel = FIRST_PERSON.mouseDegreesPerPixel;
  walker.forward = turnHeading(walker, movementX * degreesPerPixel);
  const pitch = walker.pitchDegrees - movementY * degreesPerPixel;
  walker.pitchDegrees = clampPitch(pitch, FIRST_PERSON.maxPitchDegrees);
}

function connectMouseLook(globe) {
  const canvas = globe.renderer.domElement;
  canvas.addEventListener("click", () => {
    if (globe.firstPerson) canvas.requestPointerLock();
  });
  document.addEventListener("mousemove", (event) => {
    if (!globe.firstPerson) return;
    if (document.pointerLockElement !== canvas) return;
    look(globe.firstPerson, event.movementX, event.movementY);
  });
}

export function connectFirstPersonInput(globe, onRelease) {
  connectKeys(globe, onRelease);
  connectMouseLook(globe);
}
