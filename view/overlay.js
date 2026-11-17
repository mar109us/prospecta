import * as THREE from "three";
import { fadeInLatLimit, fadeLatLimit, fillChannel, isChunkNeeded, MAX_LAYERS, NO_FADE_LIMIT_DEG } from "./overlayPixels.js";
import { applyLayerShader } from "./layerShader.js";
import { useDetailMask } from "./detailMask.js";
import { curvePower, noiseRatio } from "./layerBands.js";
import { RESOURCE_BANDS, RESOURCES } from "../settings.js";

const GRID_WIDTH = 720;
const GRID_HEIGHT = 360;


function createLayerTexture(pixels) {
  const texture = new THREE.DataTexture(
    pixels,
    GRID_WIDTH,
    GRID_HEIGHT,
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

function createLayerUniforms(layers) {
  return {
    bandCount: {
      value: RESOURCE_BANDS.bandCount,
    },
    layerCurvePowers: {
      value: new THREE.Vector4(2, 2, 2, 2),
    },
    layerColours: {
      value: createLayerColours(layers),
    },
    layerVisible: {
      value: new THREE.Vector4(1, 1, 1, 1),
    },
    layerLatLimits: {
      value: new THREE.Vector4(90, 90, 90, 90),
    },
    layerInnerLatLimits: {
      value: new THREE.Vector4(-NO_FADE_LIMIT_DEG, -NO_FADE_LIMIT_DEG, -NO_FADE_LIMIT_DEG, -NO_FADE_LIMIT_DEG),
    },
    edgeFadeDeg: {
      value: RESOURCES.edgeFadeDeg,
    },
  };
}

function createChunk(globe, layers) {
  const pixels = new Uint8Array(GRID_WIDTH * GRID_HEIGHT * 4);
  const texture = createLayerTexture(pixels);
  const uniforms = createLayerUniforms(layers);
  uniforms.detailMask = globe.detailMask.uniform;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 1,
    transparent: true,
    opacity: RESOURCES.opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  applyLayerShader(material, uniforms);
  useDetailMask(material);

  const mesh = new THREE.Mesh(globe.moon.geometry, material);
  mesh.visible = false;
  globe.scene.add(mesh);

  return {
    mesh: mesh,
    pixels: pixels,
    texture: texture,
    uniforms: uniforms,
    visibleFlags: [false, false, false, false],
    loadedFlags: [false, false, false, false],
  };
}

function updateChunkVisibility(chunk) {
  chunk.mesh.visible = isChunkNeeded(chunk.visibleFlags, chunk.loadedFlags);
}

export function createOverlay(globe, layers) {
  const chunks = [];
  const meshes = [];
  for (let start = 0; start < layers.length; start += MAX_LAYERS) {
    const end = start + MAX_LAYERS;
    const chunk = createChunk(globe, layers.slice(start, end));
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
  const channel = index % MAX_LAYERS;
  chunk.uniforms.layerVisible.value.setComponent(channel, visibility);
  chunk.visibleFlags[channel] = isVisible;
  updateChunkVisibility(chunk);
}

export function addLayerGrid(overlay, index, grid, hasEdgeFade) {
  if (grid.width !== GRID_WIDTH || grid.height !== GRID_HEIGHT) {
    throw new Error(`Dataset "${grid.name}" is ${grid.width}x${grid.height}, but layers must be ${GRID_WIDTH}x${GRID_HEIGHT}.`);
  }
  const chunk = overlay.chunks[Math.floor(index / MAX_LAYERS)];
  const channel = index % MAX_LAYERS;
  fillChannel(chunk.pixels, grid, channel);
  chunk.texture.needsUpdate = true;
  chunk.uniforms.layerCurvePowers.value.setComponent(channel, curvePower(noiseRatio(grid)));
  chunk.uniforms.layerLatLimits.value.setComponent(channel, fadeLatLimit(grid, hasEdgeFade));
  chunk.uniforms.layerInnerLatLimits.value.setComponent(channel, fadeInLatLimit(grid));
  chunk.loadedFlags[channel] = true;
  updateChunkVisibility(chunk);
}

export function precompileMeshes(globe, meshes) {
  const wasVisible = [];
  for (const mesh of meshes) {
    wasVisible.push(mesh.visible);
    mesh.visible = true;
  }
  globe.renderer.compile(globe.scene, globe.camera);
  for (let index = 0; index < meshes.length; index++) {
    meshes[index].visible = wasVisible[index];
  }
}
