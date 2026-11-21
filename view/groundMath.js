function vertexAt(positions, index) {
  return {
    x: positions[index * 3],
    y: positions[index * 3 + 1],
    z: positions[index * 3 + 2],
  };
}

function addScaled(start, from, to, amount) {
  return {
    x: start.x + (to.x - from.x) * amount,
    y: start.y + (to.y - from.y) * amount,
    z: start.z + (to.z - from.z) * amount,
  };
}

function tileCell(tile, segments, lat, lon) {
  const columnPosition = ((lon - tile.west) / (tile.east - tile.west)) * segments;
  const rowPosition = ((tile.north - lat) / (tile.north - tile.south)) * segments;
  const column = Math.min(Math.floor(columnPosition), segments - 1);
  const row = Math.min(Math.floor(rowPosition), segments - 1);
  return {
    row: row,
    column: column,
    across: columnPosition - column,
    down: rowPosition - row,
  };
}

export function tileContains(tile, lat, lon) {
  let isInside = false;
  if (lat >= tile.south && lat <= tile.north && lon >= tile.west && lon <= tile.east) isInside = true;
  return isInside;
}

export function tileSurfaceRadius(positions, tile, segments, lat, lon) {
  const cell = tileCell(tile, segments, lat, lon);
  const corners = segments + 1;
  const topLeftIndex = cell.row * corners + cell.column;
  const topLeft = vertexAt(positions, topLeftIndex);
  const topRight = vertexAt(positions, topLeftIndex + 1);
  const bottomLeft = vertexAt(positions, topLeftIndex + corners);
  const bottomRight = vertexAt(positions, topLeftIndex + corners + 1);

  if (cell.down <= cell.across) {
    const alongTop = addScaled(topLeft, topLeft, topRight, cell.across);
    const point = addScaled(alongTop, topRight, bottomRight, cell.down);
    return Math.hypot(point.x, point.y, point.z);
  }
  const alongLeft = addScaled(topLeft, topLeft, bottomLeft, cell.down);
  const point = addScaled(alongLeft, bottomLeft, bottomRight, cell.across);
  return Math.hypot(point.x, point.y, point.z);
}
