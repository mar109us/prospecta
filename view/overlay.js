import * as THREE from "three";
import { buildLayerPixels, MAX_LAYERS } from "./overlayPixels.js";
import { applyLayerShader } from "./layerShader.js";
import { curvePower, noiseRatio } from "./layerBands.js";
import { RESOURCE_BANDS, RESOURCES } from "../settings.js";


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
      value: RESOURCE_BANDS.bandCount,
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

function createChunk(globe, layers, grids) {
  const uniforms = createLayerUniforms(layers, grids);
  const material = new THREE.MeshStandardMaterial({
    map: createLayerTexture(grids),
    roughness: 1,
    transparent: true,
    opacity: RESOURCES.opacity,
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

export function createOverlay(globe, layers, grids) {
  const chunks = [];
  const meshes = [];
  for (let start = 0; start < layers.length; start += MAX_LAYERS) {
    const end = start + MAX_LAYERS;
    const chunk = createChunk(globe, layers.slice(start, end), grids.slice(start, end));
    chunks.push(chunk);
    meshes.push(chunk.mesh);
  }

  return {
    chunks: chunks,
    meshes: meshes,
  };
}

export function setLayerVisible(overlay, index, isVisible) {
  let visibility = 0;
  if (isVisible) visibility = 1;
  const chunk = overlay.chunks[Math.floor(index / MAX_LAYERS)];
  chunk.uniforms.layerVisible.value.setComponent(index % MAX_LAYERS, visibility);
}
