import { MOON } from "../settings.js";
import { tileContains, tileSurfaceRadius } from "./groundMath.js";
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

export function updateGround(globe, walker) {
  const latLon = scenePositionToLatLon(walker.up.x, walker.up.y, walker.up.z);
  const radius = detailRadius(globe.detail, latLon);
  if (radius === null) {
    walker.groundSource = "coarse";
    walker.groundRadius = coarseRadius(walker.grid, latLon);
  } else {
    walker.groundSource = "detail";
    walker.groundRadius = radius;
  }
  walker.groundKm = radiusToElevation(walker.groundRadius, MOON.heightExaggeration);
}
