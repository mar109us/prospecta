# First-person walk — stand on the Moon and walk with WASD

## Context
Add a "walk" button in the bottom-right corner. Pressing it drops you onto the surface point at the centre of the screen, in first person. Mouse looks around (pointer lock), WASD walks, and your feet follow the terrain. Pressing the button again ("exit") returns to the orbit view exactly where you left it.

## Decisions (from questionnaire)
- Drop point: screen centre. This is the tilt pivot (`viewFromBase(globe.tilt).point`), or `globe.spotFocus.view.point` while a spot is focused. No raycast needed.
- You face whatever was "up" on screen when you entered (`view.away`).
- Mouse look: Pointer Lock API. Click the canvas to capture the mouse, Esc releases it (Esc does not exit walk mode, the button does).
- Ground height: `surfaceElevation()` + `elevationToRadius()` from `view/terrainMath.js`, sampled every frame.
- Movement is frame-rate independent (speed × seconds since last frame).

## How it works
- State lives on `globe.firstPerson` (null when off), like `globe.spotFocus`.
- Position = a unit "up" vector; heading = a tangent "forward" vector; plus pitch in degrees.
- Walking forward = rotate up and forward together around their cross product by `distance / moonRadius`. Strafing does the same with "right". Reuses `normalize`, `flattenOnto`, `turnAround` from `view/spotOrbit.js`, so the poles need no special case.
- Each frame: camera position = up × (ground radius + eye height), oriented from up/forward/pitch.
- While walking: OrbitControls disabled, camera `near`/`far`/`fov` switched to walk values; on exit they and the saved base camera + tilt are restored.

## Files
- `view/firstPersonMath.js` (new): pure math — step position along the surface, turn heading by yaw, clamp pitch, metres → scene units. No Three.js, so testable.
- `view/firstPerson.js` (new): enter, exit, per-frame update, keyboard + pointer-lock listeners, `console.table` of lat/lon/heading on enter, exit and key release.
- `view/globe.js`: `firstPerson: null` on the globe; `renderGlobe` calls `updateFirstPerson` first; `updateNearPlane` skipped while walking. (File goes from 147 to ~152 lines.)
- `main.js`: `connectFirstPerson(globe, loaded)` after terrain loads; button stays disabled if elevation failed.
- `main.html`: `<button type="button" id="walk-button" class="walk-button">walk</button>`.
- `style.css`: `.walk-button` absolute, `bottom: 16px; right: 16px`, same look as `.panel__button`.
- `settings.js`: new `FIRST_PERSON` object — `eyeHeightMetres`, `walkSpeedMetresPerSecond`, `mouseDegreesPerPixel`, `maxPitchDegrees`, `fov`, `nearMetres`, `farKm`.
- `tests/firstPersonMathTests.js` (new) + register in `tests/tests.html`.
- After acceptance: save this plan as `plan/globe/firstPersonWalk.md`.

## Known risks (flag, not fixing now)
- Scale: 1 scene unit = 1737 km, and the elevation grid is 0.5° (~15 km cells). Detail tiles show hills the grid doesn't know, so a real 2 m eye height would clip into them. Default `eyeHeightMetres` starts high (~300 m) and walk speed fast (~300 m/s); both are tunable.
- The sun light is a child of the camera, so shading will rotate as you turn your head. Fixing that is a separate step.

## Verification
- Open `tests/tests.html`, check console: step-forward, strafe, pitch clamp, pole-crossing tests pass.
- Open `main.html`: press "walk" → standing on the surface at screen centre; click canvas → mouse looks; WASD moves and the camera follows terrain up and down a crater; press "exit" → orbit view and tilt restored; also try entering while a landing spot is focused.
