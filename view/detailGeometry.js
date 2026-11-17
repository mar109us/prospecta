import * as THREE from "three";
import { buildTileArrays } from "./tileGeometryMath.js";

const BOUNDS_MARGIN = 0.02;

export function createTileGeometry(build) {
  const arrays = buildTileArrays(build);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(arrays.coarsePositions.slice(), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(arrays.normals, 3));
  geometry.setAttribute("coarseNormal", new THREE.BufferAttribute(arrays.coarseNormals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(arrays.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(arrays.indices, 1));
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += BOUNDS_MARGIN;
  geometry.userData = {
    coarsePositions: arrays.coarsePositions,
    finePositions: arrays.finePositions,
    morph: 0,
  };
  return geometry;
}

export function setMorph(geometry, morph) {
  const data = geometry.userData;
  if (data.morph === morph) return;
  data.morph = morph;

  const positions = geometry.attributes.position.array;
  for (let index = 0; index < positions.length; index++) {
    const coarse = data.coarsePositions[index];
    positions[index] = coarse + (data.finePositions[index] - coarse) * morph;
  }
  geometry.attributes.position.needsUpdate = true;
}
