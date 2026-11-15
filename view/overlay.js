import * as THREE from "three";
import { buildLayerPixels, MAX_LAYERS } from "./overlayPixels.js";
import { applyLayerShader } from "./layerShader.js";
import { BAND_COUNT, curvePower, noiseRatio } from "./layerBands.js";

const OVERLAY_OPACITY = 0.4;

function createLayerTexture(grids) {
  const pixels = buildLayerPixels(grids);
  const texture = new THREE.DataTexture(
    pixels,
    grids[0].width,
    grids[0].height,
    THREE.RGBAFormat,
  );
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createLayerColours(layers) {
  const colours = [];
  for (let index = 0; index < MAX_LAYERS; index++) {
    if (index < layers.length) {
      colours.push(new THREE.Color(layers[index].colour));
    } else {
      colours.push(new THREE.Color("white"));
    }
  }
  return colours;
}

function createCurvePowers(grids) {
  const powers = new THREE.Vector4(2, 2, 2, 2);
  for (let index = 0; index < grids.length; index++) {
    powers.setComponent(index, curvePower(noiseRatio(grids[index])));
  }
  return powers;
}

function createLayerUniforms(layers, grids) {
  return {
    bandCount: {
      value: BAND_COUNT,
    },
    layerCurvePowers: {
      value: createCurvePowers(grids),
    },
    layerColours: {
      value: createLayerColours(layers),
    },
    layerVisible: {
      value: new THREE.Vector4(1, 1, 1, 1),
    },
  };
}

export function createOverlay(globe, layers, grids) {
  const uniforms = createLayerUniforms(layers, grids);
  const material = new THREE.MeshStandardMaterial({
    map: createLayerTexture(grids),
    roughness: 1,
    transparent: true,
    opacity: OVERLAY_OPACITY,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  applyLayerShader(material, uniforms);

  const mesh = new THREE.Mesh(globe.moon.geometry, material);
  globe.scene.add(mesh);

  return {
    mesh: mesh,
    uniforms: uniforms,
  };
}

export function setLayerVisible(overlay, index, isVisible) {
  let visibility = 0;
  if (isVisible) visibility = 1;
  overlay.uniforms.layerVisible.value.setComponent(index, visibility);
}
