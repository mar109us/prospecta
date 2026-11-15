import * as THREE from "three";
import { buildLayerPixels } from "./overlayPixels.js";
import { applySlopeShader } from "./slopeShader.js";
import { toUnitVector } from "../data/geo.js";
import { FOCUS, LANDING, SLOPE } from "../settings.js";

const MOON_RADIUS_KM = 1737.4;

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
    showFocus: {
      value: 0,
    },
    focusCentre: {
      value: new THREE.Vector3(1, 0, 0),
    },
    focusRadiusAngle: {
      value: LANDING.flatAreaRadiusKm / MOON_RADIUS_KM,
    },
    focusColour: {
      value: new THREE.Color(FOCUS.colour),
    },
    focusFillOpacity: {
      value: FOCUS.fillOpacity,
    },
    focusRingWidthPx: {
      value: FOCUS.ringWidthPx,
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
  if (overlay.uniforms.showFocus.value === 1) isAnyVisible = true;
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

export function setFocus(overlay, spot) {
  if (!spot) {
    overlay.uniforms.showFocus.value = 0;
    updateMeshVisibility(overlay);
    return;
  }

  const centre = toUnitVector(spot.lat, spot.lon);
  overlay.uniforms.focusCentre.value.set(centre.x, centre.y, centre.z);
  overlay.uniforms.showFocus.value = 1;
  updateMeshVisibility(overlay);
}
