import * as THREE from "three";
import { elevationAt, elevationToRadius, latLonToScenePosition } from "./terrainMath.js";

const MARKER_SIZE = 0.035;
const MARKER_LIFT = 0.01;
const LABEL_PIXELS = 64;

function createNumberTexture(number) {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_PIXELS;
  canvas.height = LABEL_PIXELS;
  const context = canvas.getContext("2d");

  context.fillStyle = "white";
  context.beginPath();
  context.arc(LABEL_PIXELS / 2, LABEL_PIXELS / 2, LABEL_PIXELS / 2 - 2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "black";
  context.font = `bold ${LABEL_PIXELS * 0.55}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${number}`, LABEL_PIXELS / 2, LABEL_PIXELS / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMarker(spot, elevation, exaggeration) {
  const material = new THREE.SpriteMaterial({
    map: createNumberTexture(spot.rank),
    depthTest: false,
    depthWrite: false,
  });
  const marker = new THREE.Sprite(material);
  marker.scale.set(MARKER_SIZE, MARKER_SIZE, 1);
  marker.renderOrder = 2;

  let radius = 1;
  if (elevation) radius = elevationToRadius(elevationAt(elevation, spot.lat, spot.lon), exaggeration);
  const position = latLonToScenePosition(spot.lat, spot.lon, radius + MARKER_LIFT);
  marker.position.set(position.x, position.y, position.z);
  return marker;
}

export function isOnNearSide(point, camera) {
  const cameraDistance = camera.position.length();
  const facing = point.dot(camera.position) / (point.length() * cameraDistance);
  let isNear = false;
  if (facing > 1 / cameraDistance) isNear = true;
  return isNear;
}

export function updateMarkerVisibility(group, camera) {
  for (const marker of group.children) {
    let anchor = marker.position;
    if (marker.userData.anchor) anchor = marker.userData.anchor;
    marker.visible = isOnNearSide(anchor, camera);
  }
}

export function createMarkerGroup(globe) {
  const group = new THREE.Group();
  globe.scene.add(group);
  return group;
}

export function showMarkers(group, spots, elevation, exaggeration) {
  while (group.children.length > 0) {
    const oldMarker = group.children[0];
    group.remove(oldMarker);
    oldMarker.material.map.dispose();
    oldMarker.material.dispose();
  }
  for (const spot of spots) {
    group.add(createMarker(spot, elevation, exaggeration));
  }
}
