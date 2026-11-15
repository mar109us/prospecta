import { cellCentre, cellSizeKm, distanceKm, toUnitVector, valueAt } from "./geo.js";
import { findRichCells } from "./richCells.js";
import { buildRouteGrid, computeCostField, nodeIndexAt, tracePath } from "./routes.js";

export function findFlatCandidates(slopeGrid, flatLimitDeg, stepDeg) {
  const step = Math.max(1, Math.round((stepDeg * slopeGrid.width) / 360));
  const half = Math.floor(step / 2);
  const candidates = [];

  for (let row = half; row < slopeGrid.height; row += step) {
    for (let column = half; column < slopeGrid.width; column += step) {
      const slope = slopeGrid.values[row * slopeGrid.width + column];
      if (slope === null || slope >= flatLimitDeg) continue;

      const centre = cellCentre(slopeGrid, row, column);
      candidates.push({
        row: row,
        column: column,
        lat: centre.lat,
        lon: centre.lon,
        unit: toUnitVector(centre.lat, centre.lon),
      });
    }
  }
  return candidates;
}

export function surroundingSlope(slopeGrid, row, column, radiusKm) {
  const centre = cellCentre(slopeGrid, row, column);
  const centreUnit = toUnitVector(centre.lat, centre.lon);
  const rowReach = Math.ceil(radiusKm / cellSizeKm(slopeGrid));
  const cosLat = Math.max(Math.cos((centre.lat * Math.PI) / 180), 0.05);
  const columnReach = Math.min(Math.ceil(rowReach / cosLat), Math.floor(slopeGrid.width / 2));

  let total = 0;
  let count = 0;
  for (let nearRow = row - rowReach; nearRow <= row + rowReach; nearRow++) {
    if (nearRow < 0 || nearRow >= slopeGrid.height) continue;

    for (let offset = -columnReach; offset <= columnReach; offset++) {
      const nearColumn = (column + offset + slopeGrid.width) % slopeGrid.width;
      const value = slopeGrid.values[nearRow * slopeGrid.width + nearColumn];
      if (value === null) continue;

      const near = cellCentre(slopeGrid, nearRow, nearColumn);
      if (distanceKm(centreUnit, toUnitVector(near.lat, near.lon)) > radiusKm) continue;
      total += value;
      count++;
    }
  }

  if (count === 0) return null;
  return total / count;
}

export function scoreCandidate(distancesKm, surroundingSlopeDeg, slopePenaltyKmPerDegree) {
  let total = 0;
  let nearest = Infinity;
  let farthest = 0;
  for (const distance of distancesKm) {
    total += distance;
    nearest = Math.min(nearest, distance);
    farthest = Math.max(farthest, distance);
  }

  const average = total / distancesKm.length;
  const unevenness = farthest - nearest;
  return average + unevenness + surroundingSlopeDeg * slopePenaltyKmPerDegree;
}

export function pickSeparated(sortedSpots, count, minSeparationKm) {
  const picked = [];
  for (const spot of sortedSpots) {
    if (picked.length === count) break;

    let isTooClose = false;
    for (const chosen of picked) {
      if (distanceKm(spot.unit, chosen.unit) < minSeparationKm) isTooClose = true;
    }
    if (!isTooClose) picked.push(spot);
  }
  return picked;
}

function driveCostsFor(resources, nodeIndex) {
  const costs = [];
  for (const resource of resources) {
    const cost = resource.field.cost[nodeIndex];
    if (cost === Infinity) return null;
    costs.push(cost);
  }
  return costs;
}

function scoreAll(candidates, resources, routeGrid, slopeGrid, settings) {
  const scored = [];
  for (const candidate of candidates) {
    const nodeIndex = nodeIndexAt(routeGrid, candidate.lat, candidate.lon);
    const driveCosts = driveCostsFor(resources, nodeIndex);
    if (!driveCosts) continue;

    const slope = surroundingSlope(slopeGrid, candidate.row, candidate.column, settings.surroundingsRadiusKm);
    if (slope === null) continue;

    candidate.nodeIndex = nodeIndex;
    candidate.surroundingSlopeDeg = slope;
    candidate.score = scoreCandidate(driveCosts, slope, settings.slopePenaltyKmPerDegree);
    scored.push(candidate);
  }
  return scored;
}

function prepareResources(resourceGrids, routeGrid, settings) {
  const resources = [];
  for (const resourceGrid of resourceGrids) {
    const sourceIndices = [];
    for (const richCell of findRichCells(resourceGrid.grid, settings.richTopFraction, settings.searchStepDeg)) {
      sourceIndices.push(nodeIndexAt(routeGrid, richCell.lat, richCell.lon));
    }
    resources.push({
      name: resourceGrid.name,
      unit: resourceGrid.grid.unit,
      grid: resourceGrid.grid,
      field: computeCostField(routeGrid, sourceIndices, settings),
    });
  }
  return resources;
}

function describeRoutes(resources, routeGrid, nodeIndex) {
  const routes = [];
  for (const resource of resources) {
    const path = tracePath(routeGrid, resource.field, nodeIndex);
    const deposit = path[path.length - 1];
    routes.push({
      name: resource.name,
      unit: resource.unit,
      routeKm: resource.field.routeKm[nodeIndex],
      driveCost: resource.field.cost[nodeIndex],
      depositValue: valueAt(resource.grid, deposit.lat, deposit.lon),
      path: path,
    });
  }
  return routes;
}

export function findLandingSpots(input) {
  const settings = input.settings;
  const routeGrid = buildRouteGrid(input.slopeGrid, settings.routeStepDeg);
  const resources = prepareResources(input.resourceGrids, routeGrid, settings);
  const candidates = findFlatCandidates(input.slopeGrid, input.flatLimitDeg, settings.searchStepDeg);
  const scored = scoreAll(candidates, resources, routeGrid, input.slopeGrid, settings);

  scored.sort((a, b) => a.score - b.score);
  const best = pickSeparated(scored, settings.resultCount, settings.minSeparationKm);

  const spots = [];
  for (let index = 0; index < best.length; index++) {
    const spot = best[index];
    spots.push({
      rank: index + 1,
      lat: spot.lat,
      lon: spot.lon,
      routes: describeRoutes(resources, routeGrid, spot.nodeIndex),
      surroundingSlopeDeg: spot.surroundingSlopeDeg,
      score: spot.score,
    });
  }
  return spots;
}
