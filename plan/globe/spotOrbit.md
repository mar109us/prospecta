# Spot orbit — circle the selected landing spot

## Context
Selecting a landing spot flies the camera straight down to it. Add a showcase effect: the camera tilts to 45° and slowly orbits the spot, with the numbered marker always centred on screen.

## Decisions
- The tilt blends into the fly-in (no pause between fly-in and orbit).
- Cancel at any time (fly-in included) by scrolling or dragging more than a few pixels. A plain click does not cancel, so another marker can still be clicked.
- On cancel the camera eases back (0.5 s) to looking at the Moon's centre, then OrbitControls take over. No jump.
- Speed: one turn per 60 s.
- Tilt changed to 60° after trying 45°.
- Revision 2: blending two camera positions swung the camera through empty space. The camera is now described like a map camera: focus point, heading ("away" = up on screen), tilt, distance. These four values animate, so the camera always looks at a point on the Moon.
- Switching spots = pan: the focus point slides along the surface, tilt stays at 60°.
- First selection: pan + zoom straight down (`flyDurationMs`), then tilt to 60° (`tiltDurationMs`).
- The heading is carried from frame to frame (flattened onto the new surface), so the poles need no special case.
- Cancel: tilt eases back to 0°, then OrbitControls take over.
- Near the poles "north" is undefined, so the orbit math uses a backup reference direction.
- The camera centres on the marker's real 3D position (it includes elevation), not on lat/lon at radius 1.

## Files
- `view/spotOrbit.js`: pure math (orbit basis, start angle, orbit position). No Three.js, so it is testable.
- `view/spotFocus.js`: the effect itself (start, per-frame update, cancel, release, input listeners). Separate from globe.js to keep that file under ~150 lines.
- `view/globe.js`: calls the effect each frame. The old `flyToSpot` / `updateCameraFlight` are replaced.
- `app/search.js`: passes the marker position.
- `settings.js`: `CAMERA.orbitTiltDegrees`, `orbitSecondsPerTurn`, `orbitDistance`, `releaseDurationMs`.
- `tests/spotOrbitTests.js` + `tests/tests.html`.
