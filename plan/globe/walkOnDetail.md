# Walk on the detail terrain, not the coarse grid

## Context
First person samples ground height from the 0.5° (~15 km) coarse grid, but what you see near you are detail tiles (5° tiles, 160 segments ≈ 1 km vertex spacing). Where the detail surface is higher than the coarse one, the camera ends up *under* it and sees black (back faces culled), as in the screenshot. Goal: your feet follow the exact triangles that are drawn, then drop the eye to human height (2 m).

## Decisions
- Ground = the detail tile under you, sampled from its **current** vertex positions (`geometry.attributes.position`). These already include the coarse→fine morph and edge blend, so ground matches the screen exactly, even while a tile morphs in.
- Same triangle split as the tile index buffer (`topLeft, bottomLeft, bottomRight` / `topLeft, bottomRight, topRight`), i.e. the same rule as `onCoarseTriangle` in `view/tileGeometryMath.js`.
- No visible detail tile under you → fall back to `surfaceElevation` (coarse), as now.
- Eye height 2 m; `nearMetres` 0.5 so the ground under your feet isn't clipped.

## Changes
- `view/groundMath.js` (new, pure, testable): `tileContains(tile, lat, lon)` and `tileSurfaceRadius(positions, tile, segments, lat, lon)`: find row/column, pick the triangle, interpolate the 3 vertices, return the point's length (= radius).
- `view/detailLoader.js`: one line, `globe.detail = detail;`, so first person can see the loaded tiles. Also keep `segments` reachable (it is in `detail.context.segments`).
- `view/firstPerson.js`: `groundRadius(globe, walker)` tries the visible detail tile (`entry.loaded.mesh.visible`) first, then coarse. Stores `walker.groundKm` and `walker.groundSource` ("detail"/"coarse") for the HUD and logs.
- `view/terrainMath.js`: `radiusToElevation(radius, exaggeration)`, the inverse of `elevationToRadius`, so the HUD still shows km.
- `debug/firstPersonHud.js`: add a `source` line.
- `settings.js`: `eyeHeightMetres: 2`, `nearMetres: 0.5`.
- `tests/groundMathTests.js` (new) + `tests/tests.html`: "flat tile gives constant radius", "point on a vertex returns that vertex", "picks the correct triangle across the diagonal", "outside tile is not contained".
- After acceptance: save as `plan/globe/walkOnDetail.md`.

## Risks
- Near 0.5 m / far 400 km is a wide depth range, so distant terrain may flicker (z-fighting). If so, lower `farKm` next; a logarithmic depth buffer would touch every custom shader, so it's not part of this step.
- 300 m/s walking at 2 m eye height will feel extremely fast; tune `walkSpeedMetresPerSecond`.
- Tile edges: when you cross into a tile that isn't loaded yet, you drop back to coarse height for a moment (small jump).

## Verification
- Tests pass in `tests/tests.html` / Node.
- Browser, DEBUG on: jump to Tycho and walk the rim. HUD `source` turns to `detail` once tiles load, and no black underside appears while walking across the crater.
