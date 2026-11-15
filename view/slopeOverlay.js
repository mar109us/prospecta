import * as THREE from "three";
import { buildLayerPixels } from "./overlayPixels.js";
import { applySlopeShader } from "./slopeShader.js";

const MAX_SLOPE_DEGREES = 45;
const SLOPE_OPACITY = 0.7;
const SLOPE_THRESHOLDS = [1, 5, 10, 15];
const SLOPE_COLOURS = ["#2E9E44", "#9ACD32", "#F2D530", "#F28C28", "#D7301F"];

function createSlopeTexture(grid) {
  grid.displayMin = 0;
  grid.displayMax = MAX_SLOPE_DEGREES;
  const pixels = buildLayerPixels([grid]);
  const texture = new THREE.DataTexture(
    pixels,
    grid.width,
    grid.height,
    THREE.RGBAFormat,
  );
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createSlopeColours() {
  const colours = [];
  for (const hexColour of SLOPE_COLOURS) {
    colours.push(new THREE.Color(hexColour));
  }
  return colours;
}

function createSlopeUniforms() {
  return {
    maxSlope: {
      value: MAX_SLOPE_DEGREES,
    },
    slopeThresholds: {
      value: new THREE.Vector4(
        SLOPE_THRESHOLDS[0],
        SLOPE_THRESHOLDS[1],
        SLOPE_THRESHOLDS[2],
        SLOPE_THRESHOLDS[3],
      ),
    },
    slopeColours: {
      value: createSlopeColours(),
    },
  };
}

export function createSlopeOverlay(globe, grid) {
  const uniforms = createSlopeUniforms();
  const material = new THREE.MeshStandardMaterial({
    map: createSlopeTexture(grid),
    roughness: 1,
    transparent: true,
    opacity: SLOPE_OPACITY,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  applySlopeShader(material, uniforms);

  const mesh = new THREE.Mesh(globe.moon.geometry, material);
  mesh.visible = false;
  globe.scene.add(mesh);

  return {
    mesh: mesh,
    uniforms: uniforms,
  };
}

export function setSlopeVisible(overlay, isVisible) {
  overlay.mesh.visible = isVisible;
}
