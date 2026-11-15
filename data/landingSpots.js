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

function slopesWithin(slopeGrid, row, column, radiusKm) {
  const centre = cellCentre(slopeGrid, row, column);
  const centreUnit = toUnitVector(centre.lat, centre.lon);
  const rowReach = Math.ceil(radiusKm / cellSizeKm(slopeGrid));
  const cosLat = Math.max(Math.cos((centre.lat * Math.PI) / 180), 0.05);
  const columnReach = Math.min(Math.ceil(rowReach / cosLat), Math.floor(slopeGrid.width / 2));

  const slopes = [];
  for (let nearRow = row - rowReach; nearRow <= row + rowReach; nearRow++) {
    if (nearRow < 0 || nearRow >= slopeGrid.height) continue;

    for (let offset = -columnReach; offset <= columnReach; offset++) {
      const nearColumn = (column + offset + slopeGrid.width) % slopeGrid.width;
      const value = slopeGrid.values[nearRow * slopeGrid.width + nearColumn];
      if (value === null) continue;

      const near = cellCentre(slopeGrid, nearRow, nearColumn);
      if (distanceKm(centreUnit, toUnitVector(near.lat, near.lon)) > radiusKm) continue;
      slopes.push(value);
    }
  }
  return slopes;
}

export function surroundingSlope(slopeGrid, row, column, radiusKm) {
  const slopes = slopesWithin(slopeGrid, row, column, radiusKm);
  if (slopes.length === 0) return null;

  let total = 0;
  for (const slope of slopes) {
    total += slope;
  }
  return total / slopes.length;
}

export function flatShareAround(slopeGrid, row, column, radiusKm, flatLimitDeg) {
  const slopes = slopesWithin(slopeGrid, row, column, radiusKm);
  if (slopes.length === 0) return 0;

  let flatCount = 0;
  for (const slope of slopes) {
    if (slope < flatLimitDeg) flatCount++;
  }
  return flatCount / slopes.length;
}

export function flatAreaPenalty(flatShare, flatAreaPenaltyKm) {
  return (1 - flatShare) * flatAreaPenaltyKm;
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

function scoreAll(candidates, resources, routeGrid, slopeGrid, flatLimitDeg, settings) {
  const scored = [];
  for (const candidate of candidates) {
    const nodeIndex = nodeIndexAt(routeGrid, candidate.lat, candidate.lon);
    const driveCosts = driveCostsFor(resources, nodeIndex);
    if (!driveCosts) continue;

    const slope = surroundingSlope(slopeGrid, candidate.row, candidate.column, settings.surroundingsRadiusKm);
    if (slope === null) continue;

    const flatShare = flatShareAround(slopeGrid, candidate.row, candidate.column, settings.flatAreaRadiusKm, flatLimitDeg);
    if (flatShare < settings.minFlatShare) continue;

    candidate.nodeIndex = nodeIndex;
    candidate.surroundingSlopeDeg = slope;
    candidate.flatShare = flatShare;
    candidate.score =
      scoreCandidate(driveCosts, slope, settings.slopePenaltyKmPerDegree) +
      flatAreaPenalty(flatShare, settings.flatAreaPenaltyKm);
    scored.push(candidate);
  }
  return scored;
}

function richSourceIndices(grids, routeGrid, settings) {
  const sourceIndices = [];
  for (const grid of grids) {
    for (const richCell of findRichCells(grid, settings.richTopFraction, settings.searchStepDeg)) {
      sourceIndices.push(nodeIndexAt(routeGrid, richCell.lat, richCell.lon));
    }
  }
  return sourceIndices;
}

function prepareResources(resourceGrids, routeGrid, settings) {
  const resources = [];
  for (const resourceGrid of resourceGrids) {
    const sourceIndices = richSourceIndices(resourceGrid.grids, routeGrid, settings);
    resources.push({
      name: resourceGrid.name,
      grids: resourceGrid.grids,
      field: computeCostField(routeGrid, sourceIndices, settings),
    });
  }
  return resources;
}

function depositReading(grids, lat, lon) {
  for (const grid of grids) {
    const value = valueAt(grid, lat, lon);
    if (value !== null) {
      return {
        value: value,
        unit: grid.unit,
      };
    }
  }
  return {
    value: null,
    unit: grids[0].unit,
  };
}

function describeRoutes(resources, routeGrid, nodeIndex) {
  const routes = [];
  for (const resource of resources) {
    const path = tracePath(routeGrid, resource.field, nodeIndex);
    const deposit = path[path.length - 1];
    const reading = depositReading(resource.grids, deposit.lat, deposit.lon);
    routes.push({
      name: resource.name,
      unit: reading.unit,
      routeKm: resource.field.routeKm[nodeIndex],
      driveCost: resource.field.cost[nodeIndex],
      depositValue: reading.value,
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
  const scored = scoreAll(candidates, resources, routeGrid, input.slopeGrid, input.flatLimitDeg, settings);

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
      flatShare: spot.flatShare,
      score: spot.score,
    });
  }
  return spots;
}
