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
