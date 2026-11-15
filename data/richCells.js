import { cellCentre, toUnitVector } from "./geo.js";

export function richThreshold(values, topFraction) {
  const known = [];
  for (const value of values) {
    if (value !== null) known.push(value);
  }
  known.sort((a, b) => a - b);

  const index = Math.floor(known.length * (1 - topFraction));
  return known[Math.min(index, known.length - 1)];
}

function firstRichCellInBlock(grid, startRow, startColumn, step, threshold) {
  for (let row = startRow; row < Math.min(startRow + step, grid.height); row++) {
    for (let column = startColumn; column < Math.min(startColumn + step, grid.width); column++) {
      const value = grid.values[row * grid.width + column];
      if (value !== null && value >= threshold) {
        return {
          row: row,
          column: column,
        };
      }
    }
  }
  return null;
}

export function findRichCells(grid, topFraction, stepDeg) {
  const threshold = richThreshold(grid.values, topFraction);
  const step = Math.max(1, Math.round((stepDeg * grid.width) / 360));
  const richCells = [];

  for (let row = 0; row < grid.height; row += step) {
    for (let column = 0; column < grid.width; column += step) {
      const cell = firstRichCellInBlock(grid, row, column, step, threshold);
      if (!cell) continue;
      const centre = cellCentre(grid, cell.row, cell.column);
      richCells.push(toUnitVector(centre.lat, centre.lon));
    }
  }
  return richCells;
}
