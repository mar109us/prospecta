# Ground detail near the walker: fractal noise patch + surface grain

## Context
At 2 m eye height, the detail tiles (~1 km triangles) look like flat sheets and the colour texture (~1.3 km/pixel) is a smooth blur. Goal: a fine mesh that follows the walker, shaped as *detail-tile surface + fractal noise*, with a grainy bump texture. Feet follow the same surface.

## Decisions
- **Noise:** fractal value noise, i.e. smooth 3D noise in a few octaves, seeded by world position in metres. Repeatable (same place = same bumps) and has no seams at lat/lon edges or poles. No `Math.random`, no sines.
- **Noise is never negative** (0…sum of amplitudes), so the patch always sits on or above the tile under it. The tile never pokes through, and at the patch edge (noise faded to 0) the two coincide. A stronger `polygonOffset` than the tiles makes the patch win there.
- **Patch:** about 1 km square, 256 segments (~4 m spacing), centred on the walker, rebuilt when you move more than `rebuildMetres` (100 m). Noise fades to 0 between 60% and 95% of the half-width.
- **Smallest octave ≥ 2× vertex spacing** (10 m). Anything finer would alias. Finer grain comes from the bump texture.
- **Float precision:** vertices are stored *relative to the patch centre* and `mesh.position` = centre. World-space Float32 at radius 1 would be about 10 cm steps; local values are millimetre-precise.
- **Grain:** a small seamless noise `DataTexture` (built once in JS) used as Three's built-in `bumpMap` on UV channel 1. UV1 = metres east/north divided by the grain tile size, minus an integer offset per patch. Values stay small, and the grain lines up exactly across rebuilds because the offset is a whole number of tiles.
- **Feet:** ground = tile/coarse surface + the same noise function × the same fade. It matches the mesh to within a few cm.

## Changes
- `view/noiseMath.js` (new, pure): `hash3`, `valueNoise3`, `fractalNoise(point, octaves)`, `periodicNoise2(x, y, period)` (for the seamless grain).
- `view/groundPatchMath.js` (new, pure): `patchFrame(centreUp)` (east/north), `patchPointDirection(frame, eastMetres, northMetres)`, `edgeFade(distance, settings)`, `grainUv(...)`.
- `view/groundPatch.js` (new, Three): create the mesh, rebuild positions/UVs/normals, show/hide. Material: `MeshStandardMaterial` with the moon colour `map` (UV0 = global lon/lat, same as the tiles) and `bumpMap` (grain, `channel = 1`).
- `view/grainTexture.js` (new): builds the grain `DataTexture` (`RepeatWrapping`).
- `view/firstPersonGround.js`: export `surfaceRadiusAt(globe, grid, latLon)` (tile, or coarse fallback) so the patch reuses it, and add noise × fade to the walker's ground.
- `view/firstPerson.js`: call the patch update each frame; hide the patch on exit.
- `settings.js`: `GROUND_DETAIL` = `isEnabled`, `patchMetres: 1000`, `patchSegments: 256`, `rebuildMetres: 100`, `fadeStart: 0.6`, `fadeEnd: 0.95`, `octaves` (e.g. 400 m/8 m, 100 m/2 m, 30 m/0.6 m, 10 m/0.2 m wavelength/amplitude), `grainTileMetres: 4`, `grainTextureSize: 256`, `bumpScale`.
- Tests: `tests/noiseMathTests.js` ("same point gives same noise", "noise stays in range", "periodic noise wraps"), `tests/groundPatchMathTests.js` ("fade is 1 at centre, 0 at edge", "frame vectors are perpendicular", "grain offset is a whole number").
- After acceptance: save as `plan/globe/groundDetailPatch.md`.

## Risks
- Rebuild cost: ~66k vertices × noise + tile sampling ≈ 20–40 ms, so a hitch every 100 m. That's fine when walking, stuttery when sprinting. `patchSegments`/`rebuildMetres` are tunable; spreading the rebuild over frames would be a later step.
- When the patch recentres, the faded rim (300–475 m away) shifts slightly, which can show a faint pop in the distance.
- The sun light is still attached to the camera, so bump shading turns with your view. That's the separate lighting fix noted earlier.
- Near the poles the east/north grain UVs stretch.

## Verification
- Node/tests.html: new tests pass, existing ones still pass.
- Browser: jump to Tycho and walk. Nearby ground has bumps and grain, the patch edge blends into the tile with no visible seam or black gaps, the HUD ground value changes smoothly, and the camera never dips into a bump.
