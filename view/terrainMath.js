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
