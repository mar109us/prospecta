import * as THREE from "three";
import { toUnitVector } from "../data/geo.js";
import { DETAIL } from "../settings.js";
import { setMaskTiles } from "./detailMask.js";
import { angularDistanceDeg, lookPoint, stepLevel, wantedTiles } from "./detailMath.js";
import { applyLevel, disposeTile, loadTile } from "./detailTile.js";
import { scenePositionToLatLon } from "./terrainMath.js";

const CAMERA_FORWARD = new THREE.Vector3(0, 0, -1);
const MAX_FRAME_MS = 100;

async function fetchTileList(folderUrl) {
  const url = `${folderUrl}/tiles.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No detail tiles at ${url} (HTTP ${response.status}). Bake them with tools/convert/convertDetail.py.`);
  }
  return response.json();
}

function cameraLook(camera) {
  const forward = CAMERA_FORWARD.clone().applyQuaternion(camera.quaternion);
  let point = lookPoint(camera.position, forward);
  if (!point) point = camera.position.clone().normalize();
  return scenePositionToLatLon(point.x, point.y, point.z);
}

function hasSettled(detail, look) {
  const here = toUnitVector(look.lat, look.lon);
  let hasMovedLittle = true;
  if (detail.lastLook) hasMovedLittle = angularDistanceDeg(here, detail.lastLook) < DETAIL.settleDeg;
  detail.lastLook = here;
  return hasMovedLittle;
}

async function loadIntoCache(globe, detail, tile, entry) {
  detail.loadingCount++;
  try {
    entry.loaded = await loadTile(globe, tile, detail.context);
    entry.status = "ready";
  } catch (error) {
    entry.status = "failed";
    console.error(error);
    detail.onError(`Detail tile ${tile.id} could not be loaded. ${error.message}`);
  }
  detail.loadingCount--;
}

function startLoads(globe, detail, wanted) {
  for (const tile of wanted) {
    if (detail.loadingCount >= DETAIL.maxConcurrentLoads) return;
    if (detail.cache.has(tile.id)) continue;
    const entry = {
      status: "loading",
      loaded: null,
      level: 0,
    };
    detail.cache.set(tile.id, entry);
    loadIntoCache(globe, detail, tile, entry);
  }
}

function markRecentlyUsed(detail, wantedIds) {
  for (const id of wantedIds) {
    const entry = detail.cache.get(id);
    if (!entry) continue;
    detail.cache.delete(id);
    detail.cache.set(id, entry);
  }
}

function logMaskedTiles(detail, tileLooks) {
  const masked = [];
  for (const tileLook of tileLooks) {
    if (tileLook.isMasked) masked.push(tileLook.tile);
  }
  let maskedIds = "";
  for (const tile of masked) {
    maskedIds += `${tile.id} `;
  }
  if (maskedIds === detail.maskedIds) return;
  detail.maskedIds = maskedIds;
  console.table(masked);
}

function animateTiles(globe, detail, deltaMs) {
  const tileLooks = [];
  let hasChanged = false;
  for (const id of detail.cache.keys()) {
    const entry = detail.cache.get(id);
    if (!entry.loaded) continue;
    let target = 0;
    if (detail.wantedIds.includes(id)) target = 2;
    const level = stepLevel(entry.level, target, deltaMs, DETAIL);
    if (level !== entry.level) hasChanged = true;
    entry.level = level;
    const look = applyLevel(entry.loaded, level);
    if (!look.isVisible) continue;
    tileLooks.push({
      tile: entry.loaded.tile,
      isMasked: look.isMasked,
      opacity: look.opacity,
    });
  }
  if (!hasChanged) return;
  setMaskTiles(globe.detailMask, tileLooks);
  logMaskedTiles(detail, tileLooks);
}

function evictOldTiles(detail, wantedIds) {
  for (const id of detail.cache.keys()) {
    if (detail.cache.size <= DETAIL.cacheTiles) return;
    const entry = detail.cache.get(id);
    if (wantedIds.includes(id)) continue;
    if (entry.status === "loading") continue;
    if (entry.level > 0) continue;
    if (entry.loaded) disposeTile(entry.loaded);
    detail.cache.delete(id);
  }
}

function updateDetail(globe, detail) {
  const now = performance.now();
  const deltaMs = Math.min(now - detail.lastFrame, MAX_FRAME_MS);
  detail.lastFrame = now;
  animateTiles(globe, detail, deltaMs);
  if (now - detail.lastCheck < DETAIL.updateIntervalMs) return;
  detail.lastCheck = now;

  let wanted = [];
  const altitude = globe.camera.position.length() - 1;
  if (altitude < DETAIL.maxAltitude) {
    const look = cameraLook(globe.camera);
    wanted = wantedTiles(detail.tiles, look.lat, look.lon, DETAIL);
    if (hasSettled(detail, look)) startLoads(globe, detail, wanted);
  }

  const wantedIds = [];
  for (const tile of wanted) {
    wantedIds.push(tile.id);
  }
  detail.wantedIds = wantedIds;
  markRecentlyUsed(detail, wantedIds);
  evictOldTiles(detail, wantedIds);
}

export async function connectDetail(globe, context, onError) {
  const listing = await fetchTileList(context.folderUrl);
  context.segments = listing.segments;
  const detail = {
    tiles: listing.tiles,
    context: context,
    onError: onError,
    cache: new Map(),
    loadingCount: 0,
    lastCheck: 0,
    lastFrame: performance.now(),
    lastLook: null,
    wantedIds: [],
    maskedIds: "",
  };
  globe.frameCallbacks.push(() => updateDetail(globe, detail));
  console.log(`Detail tiles: ${listing.tiles.length} tiles available`);
}
