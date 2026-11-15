function logCameraPosition(camera) {
  console.table({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    distance: camera.position.length(),
  });
}

function logDataset(grid) {
  console.table({
    name: grid.name,
    unit: grid.unit,
    width: grid.width,
    height: grid.height,
    min: grid.min,
    max: grid.max,
    cells: grid.values.length,
  });
}

export function connectDebug(globe) {
  globe.controls.addEventListener("end", () => logCameraPosition(globe.camera));
}

export function connectLayerDebug(layer, grid) {
  logDataset(grid);
  const checkbox = document.getElementById(layer.toggleId);
  checkbox.addEventListener("change", () => {
    console.log(`${layer.datasetName} layer visible:`, checkbox.checked);
  });
}

export function logLandingSpots(spots) {
  const rows = [];
  for (const spot of spots) {
    rows.push({
      rank: spot.rank,
      lat: spot.lat,
      lon: spot.lon,
      surroundingSlopeDeg: spot.surroundingSlopeDeg,
      score: spot.score,
    });
  }
  console.table(rows);
}
