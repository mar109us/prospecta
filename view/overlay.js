import * as THREE from "three";
import { buildOverlayPixels } from "./overlayPixels.js";
import { applySteppedOpacity } from "./steppedOpacityShader.js";

const STEP_COUNT = 5;

function createOverlayTexture(grid, hexColour) {
  const pixels = buildOverlayPixels(grid, hexColour);
  const texture = new THREE.DataTexture(
    pixels,
    grid.width,
    grid.height,
    THREE.RGBAFormat,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createOverlay(globe, grid, hexColour) {
  const material = new THREE.MeshStandardMaterial({
    map: createOverlayTexture(grid, hexColour),
    roughness: 1,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  applySteppedOpacity(material, STEP_COUNT);
  const overlay = new THREE.Mesh(globe.moon.geometry, material);
  globe.scene.add(overlay);
  return overlay;
}

export function setOverlayVisible(overlay, isVisible) {
  overlay.visible = isVisible;
}
