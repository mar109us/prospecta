import { GROUND_DETAIL, MOON } from "../settings.js";
import { metresToScene } from "./firstPersonMath.js";
import { tileContains, tileSurfaceRadius } from "./groundMath.js";
import { noiseAt } from "./groundPatchMath.js";
import {
  elevationToRadius,
  radiusToElevation,
  scenePositionToLatLon,
  surfaceElevation,
} from "./terrainMath.js";

function detailRadius(detail, latLon) {
  if (!detail) return null;
  for (const entry of detail.cache.values()) {
    if (!entry.loaded) continue;
    if (!entry.loaded.mesh.visible) continue;
    const tile = entry.loaded.tile;
    if (!tileContains(tile, latLon.lat, latLon.lon)) continue;
    const positions = entry.loaded.mesh.geometry.attributes.position.array;
    return tileSurfaceRadius(positions, tile, detail.context.segments, latLon.lat, latLon.lon);
  }
  return null;
}

function coarseRadius(grid, latLon) {
  const km = surfaceElevation(grid, latLon.lat, latLon.lon);
  return elevationToRadius(km, MOON.heightExaggeration);
}

export function surfaceRadiusAt(globe, grid, latLon) {
  const radius = detailRadius(globe.detail, latLon);
  if (radius !== null) return radius;
  return coarseRadius(grid, latLon);
}

export function updateGround(globe, walker) {
  const latLon = scenePositionToLatLon(walker.up.x, walker.up.y, walker.up.z);
  walker.groundSource = "coarse";
  if (detailRadius(globe.detail, latLon) !== null) walker.groundSource = "detail";

  let radius = surfaceRadiusAt(globe, walker.grid, latLon);
  if (GROUND_DETAIL.isEnabled) radius += metresToScene(noiseAt(walker.up, GROUND_DETAIL.octaves));
  walker.groundRadius = radius;
  walker.groundKm = radiusToElevation(radius, MOON.heightExaggeration);
}
