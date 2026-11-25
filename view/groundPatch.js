import * as THREE from "three";
import { distanceKm } from "../data/geo.js";
import { GROUND_DETAIL } from "../settings.js";
import { surfaceRadiusAt } from "./firstPersonGround.js";
import { metresToScene, sceneToMetres } from "./firstPersonMath.js";
import { applyGrainShader, createGrainUniforms } from "./grainShader.js";
import { createGrainTexture } from "./grainTexture.js";
import {
  edgeFade,
  grainUv,
  noiseAt,
  patchFrame,
  patchPointDirection,
  patchPointMetres,
  secondGrainOffset,
  snapToGrid,
} from "./groundPatchMath.js";
import { scenePositionToLatLon } from "./terrainMath.js";
import { fillIndices } from "./tileGeometryMath.js";

function createPatchMesh(globe, grainUniforms) {
  const segments = GROUND_DETAIL.mesh.squaresPerSide;
  const vertexCount = (segments + 1) * (segments + 1);
  const indices = new Uint32Array(segments * segments * 6);
  fillIndices(segments, indices);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  geometry.setAttribute("uv1", new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const grain = createGrainTexture(
    GROUND_DETAIL.roughness.pixels,
    GROUND_DETAIL.roughness.bumpsPerRepeat,
    globe.renderer.capabilities.getMaxAnisotropy(),
  );
  grain.channel = 1;
  const material = new THREE.MeshStandardMaterial({
    map: globe.moon.material.map,
    bumpMap: grain,
    bumpScale: GROUND_DETAIL.roughness.bumpHeightMetres,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  applyGrainShader(material, grainUniforms);
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
  if (distanceKm(patch.centreUp, walker.up) * 1000 > GROUND_DETAIL.mesh.rebuildAfterWalkingMetres) return true;
  const radiusNow = surfaceRadiusAt(globe, walker.grid, latLonOf(patch.centreUp));
  const changedMetres = sceneToMetres(Math.abs(radiusNow - patch.centreRadius));
  if (changedMetres > GROUND_DETAIL.mesh.rebuildIfGroundShiftsMetres) return true;
  return false;
}

function updateAnchor(patch, up) {
  if (patch.anchor && distanceKm(patch.anchor.up, up) < GROUND_DETAIL.roughness.realignAfterKm) return;
  patch.anchor = patchFrame(up);
  console.log("Ground grain anchor moved");
}

function buildVertex(build, row, column) {
  const segments = GROUND_DETAIL.mesh.squaresPerSide;
  const eastMetres = (column / segments - 0.5) * GROUND_DETAIL.mesh.widthMetres;
  const northMetres = (0.5 - row / segments) * GROUND_DETAIL.mesh.widthMetres;
  const direction = patchPointDirection(
    build.anchor,
    build.centre.eastMetres + eastMetres,
    build.centre.northMetres + northMetres,
  );
  const latLon = latLonOf(direction);

  const ratio = Math.hypot(eastMetres, northMetres) / (GROUND_DETAIL.mesh.widthMetres / 2);
  const noiseMetres = noiseAt(direction, GROUND_DETAIL.hills.sizes) * edgeFade(ratio, GROUND_DETAIL.hills);
  const radius = surfaceRadiusAt(build.globe, build.grid, latLon) + metresToScene(noiseMetres);
  const grain = grainUv(build.anchor, direction, GROUND_DETAIL.roughness.repeatsEveryMetres);

  const index = row * (segments + 1) + column;
  const attributes = build.attributes;
  attributes.position.setXYZ(
    index,
    direction.x * radius - build.centreUp.x,
    direction.y * radius - build.centreUp.y,
    direction.z * radius - build.centreUp.z,
  );
  attributes.uv.setXY(index, (latLon.lon + 180) / 360, (latLon.lat + 90) / 180);
  attributes.uv1.setXY(index, grain.u - build.grainOffset.u, grain.v - build.grainOffset.v);
}

function snappedCentre(anchor, up) {
  const spacingMetres = GROUND_DETAIL.mesh.widthMetres / GROUND_DETAIL.mesh.squaresPerSide;
  const exact = patchPointMetres(anchor, up);
  return {
    eastMetres: snapToGrid(exact.eastMetres, spacingMetres),
    northMetres: snapToGrid(exact.northMetres, spacingMetres),
  };
}

function rebuildPatch(globe, patch, walker) {
  const startTime = performance.now();
  const centre = snappedCentre(patch.anchor, walker.up);
  const centreGrain = grainUv(patch.anchor, walker.up, GROUND_DETAIL.roughness.repeatsEveryMetres);
  const build = {
    globe: globe,
    grid: walker.grid,
    centre: centre,
    centreUp: patchPointDirection(patch.anchor, centre.eastMetres, centre.northMetres),
    anchor: patch.anchor,
    grainOffset: {
      u: Math.floor(centreGrain.u),
      v: Math.floor(centreGrain.v),
    },
    attributes: patch.mesh.geometry.attributes,
  };
  for (let row = 0; row <= GROUND_DETAIL.mesh.squaresPerSide; row++) {
    for (let column = 0; column <= GROUND_DETAIL.mesh.squaresPerSide; column++) {
      buildVertex(build, row, column);
    }
  }
  finishGeometry(patch.mesh, build.centreUp);
  const secondOffset = secondGrainOffset(build.grainOffset, GROUND_DETAIL.roughness.bigPatchesScale);
  patch.grainUniforms.grainSecondOffset.value.set(secondOffset.u, secondOffset.v);

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
    const grainUniforms = createGrainUniforms();
    globe.groundPatch = {
      mesh: createPatchMesh(globe, grainUniforms),
      grainUniforms: grainUniforms,
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
