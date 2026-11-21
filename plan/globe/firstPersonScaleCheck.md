# First-person scale check: crater test

## Context
We need to know whether first-person scale matches the real Moon. The check compares what the terrain shows with an outside fact: Copernicus crater is 93 km rim to rim. We find the rims with a ground-elevation readout, sprint across the crater, and read an odometer. A result of about 93 km ±15 km (one 0.5° grid cell) passes.

## Test procedure (goes into the plan doc for later reuse)
1. Orbit view: centre Copernicus (9.6°N, 20.1°W), press walk, and set DEBUG.isEnabled = true.
2. Turn to heading 90° (east). Shift+S west until the elevation readout peaks (west rim).
3. Press R (odometer = 0). Shift+W east, across the floor (~−3 km), until the elevation peaks again (east rim).
4. Read the odometer. About 93 km means the scale is right.

## Result of a dry run (Node, real elevation grid, lat 9.62°)
- Rims found at lon −22.0° and −18.0°, floor at −20.0°: **~120 km rim to rim**, depth ~3.3 km (real: 93 km, ~3.8 km).
- The extra ~27 km is ~1 grid cell per rim: `elevationAtVertex` averages 4 cells, which blurs the rims outward.
- So on this grid, **~110–125 km = pass**. Something like 12 km or 1200 km would mean a scale bug.

## Changes
- `settings.js`: `FIRST_PERSON.sprintMultiplier: 50`.
- `view/firstPersonMath.js`: `walkSpeed(keys, settings)` returns metres/second, multiplied when `keys.sprint`.
- `view/firstPerson.js`:
  - Shift (left or right) sets `keys.sprint`.
  - Each frame, adds the distance actually moved to `walker.odometerKm`, using `distanceKm()` from `data/geo.js` (old up → new up, both unit vectors).
  - Saves `walker.groundKm` when it samples the ground. R resets the odometer.
- `view/firstPersonInput.js` (new): the keyboard and pointer-lock listeners move here from `firstPerson.js`, which would otherwise pass ~210 lines. Behaviour stays the same.
- `debug/firstPersonHud.js` (new): `connectFirstPersonHud(globe)` creates the HUD box and adds one entry to `globe.frameCallbacks`. It shows lat, lon, heading, ground elevation (km) and odometer (km) with `textContent`, and stays hidden when not walking.
- `main.js`: one line, `if (DEBUG.isEnabled) connectFirstPersonHud(globe);`.
- `style.css`: `.debug-hud`, bottom-right above the walk button, monospace, semi-transparent black.
- `tests/firstPersonMathTests.js`: "sprint multiplies walk speed", "no sprint uses base speed".
- After acceptance: save as `plan/globe/firstPersonScaleCheck.md`.

## Verification
- `tests/tests.html` (or `node tests/firstPersonMathTests.js`): all PASS.
- In the browser, with DEBUG on: the HUD appears only while walking, Shift speeds up 50×, R zeroes the odometer, and the console logs on key release still work.
- Run the crater procedure above and report the odometer reading.
