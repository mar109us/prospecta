import { cellCentre, distanceKm, toUnitVector } from "./geo.js";
import { createMinHeap, isHeapEmpty, popSmallest, pushItem } from "./minHeap.js";

const NEIGHBOUR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function steepestInBlock(slopeGrid, startRow, startColumn, step) {
  let steepest = 0;
  for (let row = startRow; row < startRow + step; row++) {
    for (let column = startColumn; column < startColumn + step; column++) {
      const value = slopeGrid.values[row * slopeGrid.width + column];
      if (value !== null && value > steepest) steepest = value;
    }
  }
  return steepest;
}

export function buildRouteGrid(slopeGrid, stepDeg) {
  const step = Math.max(1, Math.round((stepDeg * slopeGrid.width) / 360));
  const width = Math.floor(slopeGrid.width / step);
  const height = Math.floor(slopeGrid.height / step);
  const gridSize = {
    width: width,
    height: height,
  };
  const nodes = [];

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const centre = cellCentre(gridSize, row, column);
      nodes.push({
        lat: centre.lat,
        lon: centre.lon,
        unit: toUnitVector(centre.lat, centre.lon),
        slope: steepestInBlock(slopeGrid, row * step, column * step, step),
      });
    }
  }

  return {
    width: width,
    height: height,
    nodes: nodes,
  };
}

export function nodeIndexAt(routeGrid, lat, lon) {
  const row = Math.min(Math.floor(((90 - lat) / 180) * routeGrid.height), routeGrid.height - 1);
  const column = Math.floor(((lon + 180) / 360) * routeGrid.width) % routeGrid.width;
  return row * routeGrid.width + column;
}

export function stepCost(fromNode, toNode, settings) {
  const steeper = Math.max(fromNode.slope, toNode.slope);
  if (steeper > settings.maxDriveSlopeDeg) return Infinity;
  return distanceKm(fromNode.unit, toNode.unit) * (1 + settings.slopeCostPerDegree * steeper);
}

function neighbourIndices(routeGrid, index) {
  const row = Math.floor(index / routeGrid.width);
  const column = index % routeGrid.width;
  const indices = [];
  for (const offset of NEIGHBOUR_OFFSETS) {
    const nearRow = row + offset[0];
    if (nearRow < 0 || nearRow >= routeGrid.height) continue;
    const nearColumn = (column + offset[1] + routeGrid.width) % routeGrid.width;
    indices.push(nearRow * routeGrid.width + nearColumn);
  }
  return indices;
}

export function computeCostField(routeGrid, sourceIndices, settings) {
  const nodeCount = routeGrid.nodes.length;
  const cost = new Float64Array(nodeCount).fill(Infinity);
  const routeKm = new Float64Array(nodeCount).fill(Infinity);
  const next = new Int32Array(nodeCount).fill(-1);
  const heap = createMinHeap();

  for (const index of sourceIndices) {
    cost[index] = 0;
    routeKm[index] = 0;
    pushItem(heap, index, 0);
  }

  while (!isHeapEmpty(heap)) {
    const item = popSmallest(heap);
    const index = item.value;
    if (item.priority > cost[index]) continue;

    for (const nearIndex of neighbourIndices(routeGrid, index)) {
      const step = stepCost(routeGrid.nodes[index], routeGrid.nodes[nearIndex], settings);
      if (step === Infinity) continue;

      const newCost = cost[index] + step;
      if (newCost >= cost[nearIndex]) continue;
      cost[nearIndex] = newCost;
      routeKm[nearIndex] = routeKm[index] + distanceKm(routeGrid.nodes[index].unit, routeGrid.nodes[nearIndex].unit);
      next[nearIndex] = index;
      pushItem(heap, nearIndex, newCost);
    }
  }

  return {
    cost: cost,
    routeKm: routeKm,
    next: next,
  };
}

export function tracePath(routeGrid, field, startIndex) {
  const path = [];
  let index = startIndex;
  while (index !== -1) {
    const node = routeGrid.nodes[index];
    path.push({
      lat: node.lat,
      lon: node.lon,
    });
    index = field.next[index];
  }
  return path;
}
