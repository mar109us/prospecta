# Step 6 — LOLA heightmap

## Context
Give the Moon real relief from LRO LOLA elevation, so basins and highlands are visible and the resource layers follow the terrain.

## Decisions
- LDEM_4 (2 MB, 1440×720, LSB int16, 0.5 m units, relative to 1737.4 km; column 0 = 0°E) → averaged to our 0.5° grid (720×360), km.
- Baked into the sphere geometry in JS (vertices moved once, normals recomputed); overlay shares the geometry so layers follow terrain.
- `HEIGHT_EXAGGERATION = 10` in globe.js.

## 6a — Converter
- `tools/convert/convertLola.py`: download, read `<i2`, ×0.5/1000 → km, roll columns 180° to start at 180°W, average 2×2 blocks, `save_grid_json` → `datasets/elevation.json`.
- `tests/convertLolaTests.py`.
- Result: −8.33 to +9.79 km; South Pole–Aitken −7.3 km, far-side highlands +8.7 km.

## 6b — Globe
- `view/terrainMath.js`: `uvToCell(u, v, grid)` (seam wraps), `elevationToRadius(km, exaggeration)`.
- `view/terrain.js`: `applyElevation(geometry, grid, exaggeration)`; pole vertices get their row's average; `computeVertexNormals()`.
- `view/globe.js`: sphere 720×360 segments. `main.js`: load + apply elevation.
- `tests/terrainMathTests.js`.
- Known: thin lighting seam possible along 180°.
