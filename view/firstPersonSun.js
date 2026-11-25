import { FIRST_PERSON, LIGHTS } from "../settings.js";
import { sunDirection } from "./firstPersonMath.js";
import { patchFrame } from "./groundPatchMath.js";

export function enterGroundSun(globe) {
  globe.scene.add(globe.sunLight);
}

export function updateGroundSun(globe, walker) {
  const direction = sunDirection(
    patchFrame(walker.up),
    FIRST_PERSON.sunElevationDegrees,
    FIRST_PERSON.sunAzimuthDegrees,
  );
  globe.sunLight.position.set(direction.x, direction.y, direction.z);
}

export function exitGroundSun(globe) {
  globe.camera.add(globe.sunLight);
  globe.sunLight.position.set(LIGHTS.sunDirection[0], LIGHTS.sunDirection[1], LIGHTS.sunDirection[2]);
}
