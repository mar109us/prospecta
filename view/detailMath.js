import { dot, toUnitVector } from "../data/geo.js";
import { easeInOut } from "./cameraMath.js";

const MASK_CELL_DEG = 5;
const MASK_COLUMNS = 72;
const MASK_ROWS = 36;

export function tileUvTransform(tile) {
  const uMin = (tile.west + 180) / 360;
  const uMax = (tile.east + 180) / 360;
  const vMin = (tile.south + 90) / 180;
  const vMax = (tile.north + 90) / 180;
  const repeatU = 1 / (uMax - uMin);
  const repeatV = 1 / (vMax - vMin);
  return {
    repeatU: repeatU,
    repeatV: repeatV,
    offsetU: -uMin * repeatU,
    offsetV: -vMin * repeatV,
  };
}

export function maskCells(tile) {
  const cells = [];
  for (let row = (tile.south + 90) / MASK_CELL_DEG; row < (tile.north + 90) / MASK_CELL_DEG; row++) {
    for (let column = (tile.west + 180) / MASK_CELL_DEG; column < (tile.east + 180) / MASK_CELL_DEG; column++) {
      cells.push({
        row: row,
        column: column,
      });
    }
  }
  return cells;
}

export function lookPoint(position, forward) {
  const along = dot(position, forward);
  const insideSphere = dot(position, position) - 1;
  const gap = along * along - insideSphere;
  if (gap < 0) return null;

  const distance = -along - Math.sqrt(gap);
  if (distance < 0) return null;
  return {
    x: position.x + forward.x * distance,
    y: position.y + forward.y * distance,
    z: position.z + forward.z * distance,
  };
}

export function wrapDegrees(lon) {
  let wrapped = (lon + 180) % 360;
  if (wrapped < 0) wrapped += 360;
  return wrapped - 180;
}

export function angularDistanceDeg(a, b) {
  const clamped = Math.min(Math.max(dot(a, b), -1), 1);
  return (Math.acos(clamped) * 180) / Math.PI;
}

export function nearestPointInTile(tile, lat, lon) {
  const centreLon = (tile.west + tile.east) / 2;
  const halfWidth = (tile.east - tile.west) / 2;
  const lonOffset = Math.min(Math.max(wrapDegrees(lon - centreLon), -halfWidth), halfWidth);
  return {
    lat: Math.min(Math.max(lat, tile.south), tile.north),
    lon: centreLon + lonOffset,
  };
}

export function tileDistanceDeg(tile, lat, lon) {
  const nearest = nearestPointInTile(tile, lat, lon);
  return angularDistanceDeg(toUnitVector(lat, lon), toUnitVector(nearest.lat, nearest.lon));
}

export function wantedTiles(tiles, lat, lon, settings) {
  const nearby = [];
  for (const tile of tiles) {
    const distance = tileDistanceDeg(tile, lat, lon);
    if (distance > settings.loadRadiusDeg) continue;
    nearby.push({
      tile: tile,
      distance: distance,
    });
  }
  nearby.sort((a, b) => a.distance - b.distance);

  const wanted = [];
  for (const entry of nearby.slice(0, settings.maxTiles)) {
    wanted.push(entry.tile);
  }
  return wanted;
}

export function blendWeight(row, column, segments, blendVertices) {
  const edgeDistance = Math.min(row, column, segments - row, segments - column);
  return Math.min(edgeDistance / blendVertices, 1);
}

export function stepLevel(level, target, deltaMs, timing) {
  if (target > level) {
    let end = 2;
    let duration = timing.morphMs;
    if (level < 1) {
      end = 1;
      duration = timing.fadeMs;
    }
    return Math.min(level + deltaMs / duration, end);
  }

  let end = 0;
  let duration = timing.fadeMs;
  if (level > 1) {
    end = 1;
    duration = timing.morphMs;
  }
  return Math.max(level - deltaMs / duration, end);
}

export function levelLook(level) {
  let isVisible = false;
  if (level > 0) isVisible = true;
  let isMasked = false;
  if (level >= 1) isMasked = true;
  return {
    isVisible: isVisible,
    isMasked: isMasked,
    opacity: easeInOut(Math.min(level, 1)),
    morph: easeInOut(Math.max(level - 1, 0)),
  };
}

function neighbourDetail(detailAt, column, row) {
  if (row < 0 || row >= MASK_ROWS) return 1;
  const wrappedColumn = (column + MASK_COLUMNS) % MASK_COLUMNS;
  return detailAt(wrappedColumn, row);
}

function gapToNeighbourDeg(direction, inside) {
  if (direction === -1) return inside * MASK_CELL_DEG;
  if (direction === 1) return (1 - inside) * MASK_CELL_DEG;
  return 0;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function tileLookWeight(u, v, detailAt, featherDeg) {
  const lat = v * 180 - 90;
  const lonScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.05);
  const columnPosition = u * MASK_COLUMNS;
  const rowPosition = v * MASK_ROWS;
  const column = Math.floor(columnPosition);
  const row = Math.floor(rowPosition);

  let coarseAmount = 0;
  for (let stepColumn = -1; stepColumn <= 1; stepColumn++) {
    for (let stepRow = -1; stepRow <= 1; stepRow++) {
      if (stepColumn === 0 && stepRow === 0) continue;
      const gapEast = gapToNeighbourDeg(stepColumn, columnPosition - column) * lonScale;
      const gapNorth = gapToNeighbourDeg(stepRow, rowPosition - row);
      const nearness = 1 - smoothstep(0, featherDeg, Math.hypot(gapEast, gapNorth));
      const missing = 1 - neighbourDetail(detailAt, column + stepColumn, row + stepRow);
      coarseAmount = Math.max(coarseAmount, nearness * missing);
    }
  }
  return 1 - coarseAmount;
}
