function logCameraPosition(camera) {
  console.table({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    distance: camera.position.length(),
  });
}

export function connectDebug(globe) {
  globe.controls.addEventListener("end", () => logCameraPosition(globe.camera));
}
