import { cellCentre, cellSizeKm, distanceKm, dot, dotToKm, toUnitVector } from "./geo.js";
import { findRichCells } from "./richCells.js";

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

export function nearestDistanceKm(point, richCells) {
  let bestDot = -1;
  for (const richCell of richCells) {
    const closeness = dot(point, richCell);
    if (closeness > bestDot) bestDot = closeness;
  }
  return dotToKm(bestDot);
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

function scoreAll(candidates, resources, slopeGrid, settings) {
  const scored = [];
  for (const candidate of candidates) {
    const distancesKm = [];
    for (const resource of resources) {
      distancesKm.push(nearestDistanceKm(candidate.unit, resource.richCells));
    }

    const slope = surroundingSlope(slopeGrid, candidate.row, candidate.column, settings.surroundingsRadiusKm);
    if (slope === null) continue;

    candidate.distancesKm = distancesKm;
    candidate.surroundingSlopeDeg = slope;
    candidate.score = scoreCandidate(distancesKm, slope, settings.slopePenaltyKmPerDegree);
    scored.push(candidate);
  }
  return scored;
}

function prepareResources(resourceGrids, settings) {
  const resources = [];
  for (const resourceGrid of resourceGrids) {
    resources.push({
      name: resourceGrid.name,
      richCells: findRichCells(resourceGrid.grid, settings.richTopFraction, settings.searchStepDeg),
    });
  }
  return resources;
}

export function findLandingSpots(input) {
  const settings = input.settings;
  const resources = prepareResources(input.resourceGrids, settings);
  const candidates = findFlatCandidates(input.slopeGrid, input.flatLimitDeg, settings.searchStepDeg);
  const scored = scoreAll(candidates, resources, input.slopeGrid, settings);

  scored.sort((a, b) => a.score - b.score);
  const best = pickSeparated(scored, settings.resultCount, settings.minSeparationKm);

  const spots = [];
  for (let index = 0; index < best.length; index++) {
    const spot = best[index];
    const distances = [];
    for (let resourceIndex = 0; resourceIndex < resources.length; resourceIndex++) {
      distances.push({
        name: resources[resourceIndex].name,
        km: spot.distancesKm[resourceIndex],
      });
    }
    spots.push({
      rank: index + 1,
      lat: spot.lat,
      lon: spot.lon,
      distances: distances,
      surroundingSlopeDeg: spot.surroundingSlopeDeg,
      score: spot.score,
    });
  }
  return spots;
}
