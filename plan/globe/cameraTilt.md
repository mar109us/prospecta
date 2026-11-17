# Camera tilt — right-drag to tilt, zoom inside spot orbit

## Context
The camera can only tilt during a spot orbit, and only to a fixed 60°. In free mode OrbitControls always looks at the Moon's centre. You want to tilt anytime with a right-drag, and to zoom inside a spot orbit without leaving it.

## Decisions (from your answers)
- Right-drag up/down tilts, 0° to 80°. Works in free mode and in spot orbit.
- In spot orbit: right-drag changes the orbit tilt, the scroll wheel changes the orbit distance. Only a left-drag cancels the orbit.
- Orbit zoom range = free-mode range (`minDistance`/`maxDistance`, measured from the Moon's centre).
- Leaving the orbit keeps the tilt. The release animation only turns the heading back to north; then free mode carries on at that tilt.
- My proposal: switching to another spot keeps your current orbit tilt and distance (not reset to 60°/7).

## How free-mode tilt works
OrbitControls drives a hidden, untilted "base camera" (`globe.tilt.baseCamera`, straight down, looking at the centre). Each frame the real camera copies the base camera's pose and adds the tilt, using the existing map-camera math (`cameraPosition` in `view/spotOrbit.js`).

Why: OrbitControls keeps working untouched, and we reuse the orbit math instead of writing new camera code.

Revision 1: the first version had OrbitControls move the real camera and saved/restored an untilted pose around each frame. That broke zoom, because OrbitControls also calls `update()` inside the wheel event, between frames, and the restore threw that zoom away. A separate base camera has nothing to restore.

## Files
- `view/cameraView.js` (new): `toVector3`, `lookRotation`, `viewFromCamera`, `applyView`, moved out of `spotFocus.js` so both files can use them. spotFocus.js is already 161 lines.
- `view/cameraTilt.js` (new): the base camera, apply the tilt each frame, the right-drag listener, block the browser right-click menu.
- `view/spotFocus.js`: left button only cancels; wheel zooms the orbit; right-drag tilts the orbit; release keeps tilt and eases heading to north; start orbit from the current tilt.
- `view/globe.js`: OrbitControls drive `globe.tilt.baseCamera`; frame order (speed → controls → tilt); `controls.mouseButtons.RIGHT = null`.
- `view/cameraMath.js`: pure helpers `clampTilt(degrees)` and `zoomOrbitDistance(distance, wheelDelta)`.
- `settings.js`: `CAMERA.maxTiltDegrees: 80`, `tiltDegreesPerPixel: 0.3`, `orbitZoomStep: 1.1`.
- `tests/cameraMathTests.js`: tests for the two helpers ("clamps tilt above 80", "zoom stays inside min distance", ...).
- After approval: save this plan as `plan/globe/cameraTilt.md`.

## Verification
- Open `tests/tests.html`, check the console: all tests pass.
- Free mode: right-drag down tilts toward the horizon, stops at 80°; left-drag and wheel still rotate/zoom while tilted; no context menu.
- Select a spot: wheel zooms, right-drag tilts, orbit keeps going. Left-drag exits with no jump, tilt kept.
- `console.log` of tilt/distance on every right-drag and orbit zoom.
