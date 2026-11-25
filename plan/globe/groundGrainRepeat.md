# FPV ground grain: remove the repeating pattern, steady sun

## Context
In walk mode the ground grain shows a clear repeating pattern. What the code does today:
- `view/grainTexture.js` builds one 256 px noise texture; `view/groundPatch.js` uses it as `bumpMap` and repeats it **exactly every 4 m** (`GROUND_DETAIL.grainTileMetres`). From 2 m eye height hundreds of identical copies line up to the horizon.
- The texture has no `anisotropy`, so it smears at shallow angles (the moon and tile textures do set it).
- The sun is a child of the camera (`view/globe.js` `createLights`), so bump shading turns when you look around.

Chosen fixes: (1) bigger, sharper grain texture, (2) blend the grain at two sizes that never line up, (3) in FPV the sun sits at a fixed height above the local horizon.

## Decisions
- **Texture:** 512 px over 16 m (was 256 px over 4 m), periods `[8, 16, 32, 64, 128]` = bumps from 2 m down to 12 cm. Built once, about 0.1 s. Anisotropy set to the renderer's maximum.
- **Two-scale blend:** the bump height becomes `first sample + second sample × weight`. The second sample reads the same texture with the UV turned 36.87° (the 0.8/0.6 rotation) and scaled by `grainSecondScale` (0.23, so one copy is about 70 m). The two grids never line up, so no repeat is visible.
- **How:** an `onBeforeCompile` patch (same technique as `view/detailShader.js`). It takes three.js's own `bumpmap_pars_fragment` chunk and swaps its three `texture2D( bumpMap, ...)` reads for a small `grainSample(uv)` function. Nothing else in the lighting changes.
- **No popping on rebuild:** UV1 is shifted by a whole number of tiles per rebuild. That keeps sample one still, but would move sample two. So JS computes the leftover fraction for sample two and passes it as a uniform (`grainSecondOffset`), updated in `rebuildPatch`.
- **Sun in FPV:** on enter, move the sun light from the camera to the scene; each frame set its position to `up × sin(elevation) + compass direction × cos(elevation)` using the walker's local east/north (`patchFrame` already gives these). On exit, put it back on the camera with its `LIGHTS.sunDirection` position. Never night, does not turn with the head. Orbit view unchanged.

## Changes
- `settings.js`
  - `GROUND_DETAIL`: `grainTileMetres: 16`, `grainTextureSize: 512`, `grainPeriods: [8, 16, 32, 64, 128]`, new `grainSecondScale: 0.23`, `grainSecondWeight: 0.6`.
  - `FIRST_PERSON`: new `sunElevationDegrees: 30`, `sunAzimuthDegrees: 90` (east).
- `view/grainShader.js` (new, ~40 lines): `applyGrainShader(material, uniforms)` sets `onBeforeCompile` with the `grainSample` GLSL.
- `view/grainTexture.js`: extra `anisotropy` parameter, set on the texture.
- `view/groundPatch.js`: pass `globe.renderer.capabilities.getMaxAnisotropy()`, call `applyGrainShader`, update the `grainSecondOffset` uniform in `rebuildPatch`.
- `view/groundPatchMath.js`: new pure `secondGrainOffset(offset, scale)` (turn, scale, keep only the fraction).
- `view/firstPersonMath.js`: new pure `sunDirection(frame, elevationDegrees, azimuthDegrees)`.
- `view/firstPersonSun.js` (new, ~30 lines): `enterGroundSun(globe)`, `updateGroundSun(globe, walker)`, `exitGroundSun(globe)`.
- `view/globe.js`: `createLights` returns the sun light; store it as `globe.sunLight`.
- `view/firstPerson.js`: three one-line calls (enter, update, exit).
- Tests: `tests/groundPatchMathTests.js` ("second grain offset stays between 0 and 1", "whole-tile shift gives the same grain"), `tests/firstPersonMathTests.js` or the existing equivalent ("sun is at the chosen height above the horizon", "sun direction has length 1").
- After acceptance: save this plan as `plan/globe/groundGrainRepeat.md`.

## Risks
- The patch string-replaces text inside a three.js chunk (r187, vendored). If the text is not found, log a descriptive `console.error` and keep the plain bump map.
- Bump strength changes with the new texture; `bumpScale` and `grainSecondWeight` will need a tweak by eye.
- The FPV sun is not astronomically real; it follows you around the Moon.

## Verification
- Open `tests/tests.html`: new and existing tests pass.
- Browser: enter walk mode at Tycho. No grid of repeated grain towards the horizon; grain stays sharp at shallow angles; walking 100 m+ (a rebuild) shows no jump in the grain; looking around does not change the ground shading; exiting returns the orbit view lighting exactly as before.

## Revision: roughness missing near the camera
- Cause: three.js bump mapping uses the height change per screen pixel, so magnified ground near the camera went smooth and distant ground was exaggerated into streaks.
- Fix: `view/grainShader.js` also removes the two `normalize(...)` calls in `perturbNormalArb` and converts the pixel step to metres, so the slope is height change per metre of ground. The bump scale is now a real height: `roughness.bumpHeightMetres` (replaces `roughness.strength`).

## Revision: ground looked alive while walking
- Cause: the mesh was centred exactly on the walker, so after each rebuild its corners sampled the hills at different spots.
- Fix: `view/groundPatch.js` snaps the mesh centre to a grid with the corner spacing, measured in the grain anchor frame (`patchPointMetres`, `snapToGrid` in `view/groundPatchMath.js`). Corners land on the same ground points after every rebuild.
- Rule for settings: corner spacing (`mesh.widthMetres / mesh.squaresPerSide`) should be at most half the smallest `hills.sizes` width.
