import * as THREE from "three";
import { cameraPosition, flattenOnto } from "./spotOrbit.js";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function toVector3(point) {
  return new THREE.Vector3(point.x, point.y, point.z);
}

export function lookRotation(eye, target, up) {
  const matrix = new THREE.Matrix4().lookAt(eye, target, up);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

export function northOf(normal) {
  return flattenOnto(WORLD_UP, normal);
}

export function viewFromBase(tilt) {
  const base = tilt.baseCamera;
  const normal = base.position.clone().normalize();
  const screenUp = WORLD_UP.clone().applyQuaternion(base.quaternion);
  return {
    point: normal.clone().multiplyScalar(tilt.pivotRadius),
    away: flattenOnto(screenUp, normal),
    tilt: tilt.degrees,
    distance: base.position.length() - tilt.pivotRadius,
  };
}

export function applyView(camera, view) {
  const position = toVector3(cameraPosition(view));
  camera.position.copy(position);
  camera.quaternion.copy(lookRotation(position, view.point, toVector3(view.away)));
}
