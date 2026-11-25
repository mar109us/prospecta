import * as THREE from "three";
import { distanceKm } from "../data/geo.js";
import { GROUND_DETAIL } from "../settings.js";
import { surfaceRadiusAt } from "./firstPersonGround.js";
import { metresToScene, sceneToMetres } from "./firstPersonMath.js";
import { createGrainTexture } from "./grainTexture.js";
import { edgeFade, grainUv, noiseAt, patchFrame, patchPointDirection } from "./groundPatchMath.js";
import { scenePositionToLatLon } from "./terrainMath.js";
import { fillIndices } from "./tileGeometryMath.js";

function createPatchMesh(globe) {
  const segments = GROUND_DETAIL.patchSegments;
  const vertexCount = (segments + 1) * (segments + 1);
  const indices = new Uint32Array(segments * segments * 6);
  fillIndices(segments, indices);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  geometry.setAttribute("uv1", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const grain = createGrainTexture(GROUND_DETAIL.grainTextureSize, GROUND_DETAIL.grainPeriods);
  grain.channel = 1;
  const material = new THREE.MeshStandardMaterial({
    map: globe.moon.material.map,
    bumpMap: grain,
    bumpScale: GROUND_DETAIL.bumpScale,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  globe.scene.add(mesh);
  return mesh;
}

function latLonOf(direction) {
  return scenePositionToLatLon(direction.x, direction.y, direction.z);
}

function needsRebuild(globe, patch, walker) {
  if (!patch.centreUp) return true;
  if (distanceKm(patch.centreUp, walker.up) * 1000 > GROUND_DETAIL.rebuildMetres) return true;
  const radiusNow = surfaceRadiusAt(globe, walker.grid, latLonOf(patch.centreUp));
  const changedMetres = sceneToMetres(Math.abs(radiusNow - patch.centreRadius));
  if (changedMetres > GROUND_DETAIL.rebuildToleranceMetres) return true;
  return false;
}

function updateAnchor(patch, up) {
  if (patch.anchor && distanceKm(patch.anchor.up, up) < GROUND_DETAIL.grainAnchorKm) return;
  patch.anchor = patchFrame(up);
  console.log("Ground grain anchor moved");
}

function buildVertex(build, row, column) {
  const segments = GROUND_DETAIL.patchSegments;
  const eastMetres = (column / segments - 0.5) * GROUND_DETAIL.patchMetres;
  const northMetres = (0.5 - row / segments) * GROUND_DETAIL.patchMetres;
  const direction = patchPointDirection(build.frame, eastMetres, northMetres);
  const latLon = latLonOf(direction);

  const ratio = Math.hypot(eastMetres, northMetres) / (GROUND_DETAIL.patchMetres / 2);
  const noiseMetres = noiseAt(direction, GROUND_DETAIL.octaves) * edgeFade(ratio, GROUND_DETAIL);
  const radius = surfaceRadiusAt(build.globe, build.grid, latLon) + metresToScene(noiseMetres);
  const grain = grainUv(build.anchor, direction, GROUND_DETAIL.grainTileMetres);

  const index = row * (segments + 1) + column;
  const attributes = build.attributes;
  attributes.position.setXYZ(
    index,
    direction.x * radius - build.frame.up.x,
    direction.y * radius - build.frame.up.y,
    direction.z * radius - build.frame.up.z,
  );
  attributes.uv.setXY(index, (latLon.lon + 180) / 360, (latLon.lat + 90) / 180);
  attributes.uv1.setXY(index, grain.u - build.grainOffset.u, grain.v - build.grainOffset.v);
}

function rebuildPatch(globe, patch, walker) {
  const startTime = performance.now();
  const centreGrain = grainUv(patch.anchor, walker.up, GROUND_DETAIL.grainTileMetres);
  const build = {
    globe: globe,
    grid: walker.grid,
    frame: patchFrame(walker.up),
    anchor: patch.anchor,
    grainOffset: {
      u: Math.floor(centreGrain.u),
      v: Math.floor(centreGrain.v),
    },
    attributes: patch.mesh.geometry.attributes,
  };
  for (let row = 0; row <= GROUND_DETAIL.patchSegments; row++) {
    for (let column = 0; column <= GROUND_DETAIL.patchSegments; column++) {
      buildVertex(build, row, column);
    }
  }
  finishGeometry(patch.mesh, walker.up);

  patch.centreUp = walker.up;
  patch.centreRadius = surfaceRadiusAt(globe, walker.grid, latLonOf(walker.up));
  console.log(`Ground patch rebuilt in ${Math.round(performance.now() - startTime)} ms`);
}

function finishGeometry(mesh, up) {
  const geometry = mesh.geometry;
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
  geometry.attributes.uv1.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  mesh.position.set(up.x, up.y, up.z);
  mesh.visible = true;
}

export function updateGroundPatch(globe, walker) {
  if (!GROUND_DETAIL.isEnabled) return;
  if (!globe.groundPatch) {
    globe.groundPatch = {
      mesh: createPatchMesh(globe),
      centreUp: null,
      centreRadius: 0,
      anchor: null,
    };
  }
  const patch = globe.groundPatch;
  if (!needsRebuild(globe, patch, walker)) return;
  updateAnchor(patch, walker.up);
  rebuildPatch(globe, patch, walker);
}

export function hideGroundPatch(globe) {
  if (!globe.groundPatch) return;
  globe.groundPatch.mesh.visible = false;
  globe.groundPatch.centreUp = null;
}
