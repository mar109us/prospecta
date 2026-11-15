import * as THREE from "three";
import { buildLayerPixels } from "./overlayPixels.js";
import { applySlopeShader } from "./slopeShader.js";
import { SLOPE } from "../settings.js";

function createSlopeTexture(grid) {
  grid.displayMin = 0;
  grid.displayMax = SLOPE.maxDegrees;
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
  for (const hexColour of SLOPE.colours) {
    colours.push(new THREE.Color(hexColour));
  }
  return colours;
}

function createSlopeUniforms() {
  return {
    maxSlope: {
      value: SLOPE.maxDegrees,
    },
    slopeThresholds: {
      value: SLOPE.thresholds,
    },
    slopeColours: {
      value: createSlopeColours(),
    },
    showFlat: {
      value: 0,
    },
    showDots: {
      value: 0,
    },
    flatLimitDeg: {
      value: SLOPE.flatLimitDeg,
    },
    flatColour: {
      value: new THREE.Color(SLOPE.flatColour),
    },
    flatOpacity: {
      value: SLOPE.flatOpacity,
    },
    dotRadiusDeg: {
      value: SLOPE.dotRadiusDeg,
    },
    dotSpacingDeg: {
      value: SLOPE.dotSpacingDeg,
    },
    dotOpacity: {
      value: SLOPE.dotOpacity,
    },
    dotMinOpacity: {
      value: SLOPE.dotMinOpacity,
    },
  };
}

export function createSlopeOverlay(globe, grid) {
  if (SLOPE.colours.length !== SLOPE.thresholds.length + 1) {
    throw new Error(
      `SLOPE in settings.js has ${SLOPE.thresholds.length} thresholds, so it needs ${SLOPE.thresholds.length + 1} colours, but has ${SLOPE.colours.length}.`,
    );
  }

  const uniforms = createSlopeUniforms();
  const material = new THREE.MeshStandardMaterial({
    map: createSlopeTexture(grid),
    roughness: 1,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  applySlopeShader(material, uniforms, SLOPE.thresholds.length);

  const mesh = new THREE.Mesh(globe.moon.geometry, material);
  mesh.visible = false;
  mesh.renderOrder = 1;
  globe.scene.add(mesh);

  return {
    mesh: mesh,
    meshes: [mesh],
    uniforms: uniforms,
  };
}

function updateMeshVisibility(overlay) {
  let isAnyVisible = false;
  if (overlay.uniforms.showFlat.value === 1) isAnyVisible = true;
  if (overlay.uniforms.showDots.value === 1) isAnyVisible = true;
  overlay.mesh.visible = isAnyVisible;
}

export function setFlatVisible(overlay, isVisible) {
  let visibility = 0;
  if (isVisible) visibility = 1;
  overlay.uniforms.showFlat.value = visibility;
  updateMeshVisibility(overlay);
}

export function setSlopeDotsVisible(overlay, isVisible) {
  let visibility = 0;
  if (isVisible) visibility = 1;
  overlay.uniforms.showDots.value = visibility;
  updateMeshVisibility(overlay);
}
