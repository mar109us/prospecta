import * as THREE from "three";
import { levelLook, tileUvTransform } from "./detailMath.js";
import { createTileGeometry, setMorph } from "./detailGeometry.js";
import { addTileOverlays, removeTileOverlays } from "./detailOverlays.js";
import { createTileMaterial } from "./detailShader.js";

async function fetchHeights(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Detail heights could not be loaded from ${url} (HTTP ${response.status}).`);
  }
  return new Int16Array(await response.arrayBuffer());
}

async function loadTexture(globe, url) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = globe.renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function placeOnTile(texture, tile) {
  const transform = tileUvTransform(tile);
  texture.repeat.set(transform.repeatU, transform.repeatV);
  texture.offset.set(transform.offsetU, transform.offsetV);
}

export async function loadTile(globe, tile, context) {
  const base = `${context.folderUrl}/${tile.id}`;
  const files = await Promise.all([
    fetchHeights(`${base}.bin`),
    loadTexture(globe, `${base}_normal.jpg`),
    loadTexture(globe, `${base}_shade.jpg`),
  ]);
  const textures = {
    normal: files[1],
    shade: files[2],
  };
  placeOnTile(textures.normal, tile);

  const geometry = createTileGeometry({
    tile: tile,
    heights: files[0],
    coarseGrid: context.coarseGrid,
    coarseMesh: context.coarseMesh,
    exaggeration: context.exaggeration,
    segments: context.segments,
    blendVertices: context.blendVertices,
  });
  const moonMaterial = globe.moon.material;
  const material = createTileMaterial(textures, {
    colourMap: moonMaterial.map,
    coarseNormalMap: moonMaterial.normalMap,
    coarseNormalScale: moonMaterial.normalScale,
    normalStrength: context.normalStrength,
    detailMask: globe.detailMask.uniform,
    featherDeg: context.featherDeg,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.renderOrder = -1;
  globe.scene.add(mesh);

  return {
    tile: tile,
    mesh: mesh,
    textures: textures,
    overlayClones: addTileOverlays(geometry, textures.normal, context.overlayMeshes, context.normalStrength),
  };
}

export function applyLevel(loadedTile, level) {
  const look = levelLook(level);
  loadedTile.mesh.visible = look.isVisible;
  loadedTile.mesh.material.opacity = look.opacity;
  setMorph(loadedTile.mesh.geometry, look.morph);
  for (const clone of loadedTile.overlayClones) {
    clone.visible = look.isMasked;
  }
  return look;
}

export function disposeTile(loadedTile) {
  removeTileOverlays(loadedTile.overlayClones);
  loadedTile.mesh.removeFromParent();
  loadedTile.mesh.geometry.dispose();
  loadedTile.mesh.material.dispose();
  loadedTile.textures.normal.dispose();
  loadedTile.textures.shade.dispose();
}
