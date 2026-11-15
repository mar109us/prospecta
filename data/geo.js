const MOON_RADIUS_KM = 1737.4;

export function cellCentre(grid, row, column) {
  return {
    lat: 90 - (row + 0.5) * (180 / grid.height),
    lon: -180 + (column + 0.5) * (360 / grid.width),
  };
}

export function toUnitVector(lat, lon) {
  const latRadians = (lat * Math.PI) / 180;
  const lonRadians = (lon * Math.PI) / 180;
  return {
    x: Math.cos(latRadians) * Math.cos(lonRadians),
    y: Math.cos(latRadians) * Math.sin(lonRadians),
    z: Math.sin(latRadians),
  };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function dotToKm(dotProduct) {
  const clamped = Math.min(Math.max(dotProduct, -1), 1);
  return Math.acos(clamped) * MOON_RADIUS_KM;
}

export function distanceKm(a, b) {
  return dotToKm(dot(a, b));
}

export function cellSizeKm(grid) {
  return (Math.PI * MOON_RADIUS_KM) / grid.height;
}
