const MOON_RADIUS_KM = 1737.4;

export function elevationToRadius(km, exaggeration) {
  return 1 + (km / MOON_RADIUS_KM) * exaggeration;
}

export function rowAverage(grid, row) {
  let total = 0;
  for (let column = 0; column < grid.width; column++) {
    total += grid.values[row * grid.width + column];
  }
  return total / grid.width;
}

export function elevationAtVertex(u, v, grid) {
  const cornerColumn = Math.round(u * grid.width);
  const cornerRow = Math.round((1 - v) * grid.height);

  if (cornerRow === 0) return rowAverage(grid, 0);
  if (cornerRow === grid.height) return rowAverage(grid, grid.height - 1);

  const westColumn = (cornerColumn - 1 + grid.width) % grid.width;
  const eastColumn = cornerColumn % grid.width;
  const rows = [cornerRow - 1, cornerRow];
  const columns = [westColumn, eastColumn];

  let total = 0;
  for (const row of rows) {
    for (const column of columns) {
      total += grid.values[row * grid.width + column];
    }
  }
  return total / 4;
}

export function latLonToScenePosition(lat, lon, radius) {
  const phi = ((lon + 180) / 360) * 2 * Math.PI;
  const theta = ((90 - lat) / 180) * Math.PI;
  return {
    x: -Math.cos(phi) * Math.sin(theta) * radius,
    y: Math.cos(theta) * radius,
    z: Math.sin(phi) * Math.sin(theta) * radius,
  };
}

export function elevationAt(grid, lat, lon) {
  const row = Math.min(Math.floor(((90 - lat) / 180) * grid.height), grid.height - 1);
  const column = Math.floor(((lon + 180) / 360) * grid.width) % grid.width;
  return grid.values[row * grid.width + column];
}

export function scenePositionToLatLon(x, y, z) {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const theta = Math.acos(y / radius);
  const phi = Math.atan2(z, -x);
  let lon = (phi / (2 * Math.PI)) * 360 - 180;
  if (lon < -180) lon += 360;
  return {
    lat: 90 - (theta / Math.PI) * 180,
    lon: lon,
  };
}

export function surfaceElevation(grid, lat, lon) {
  const columnPosition = ((lon + 180) / 360) * grid.width;
  const rowPosition = ((90 - lat) / 180) * grid.height;
  const leftColumn = Math.floor(columnPosition);
  const topRow = Math.min(Math.floor(rowPosition), grid.height - 1);
  const across = columnPosition - leftColumn;
  const down = rowPosition - topRow;

  const leftU = leftColumn / grid.width;
  const rightU = (leftColumn + 1) / grid.width;
  const topV = 1 - topRow / grid.height;
  const bottomV = 1 - (topRow + 1) / grid.height;

  const top = elevationAtVertex(leftU, topV, grid) * (1 - across) + elevationAtVertex(rightU, topV, grid) * across;
  const bottom = elevationAtVertex(leftU, bottomV, grid) * (1 - across) + elevationAtVertex(rightU, bottomV, grid) * across;
  return top * (1 - down) + bottom * down;
}
