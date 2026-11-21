# Crater presets — jump to a known crater for the scale check

## Context
Finding Copernicus by eye was too fiddly. A debug dropdown drops you just outside a crater's west rim, facing its centre, so the scale check from `firstPersonScaleCheck.md` needs no searching or turning.

## Decisions
- Presets live in `settings.js` as `CRATERS.list`. `CRATERS.approachKm` (20 km) is how far outside the rim you start.
- Start point: step back west from the crater centre along a great circle (`approachStart`). Walking forward then goes straight through the centre. A plain 90° heading would drift off-centre over long distances.
- Picking a crater while already walking moves you there and resets the odometer.
- The walk button label is now set inside enter/exit, so it matches whichever way you entered.
- Ptolemaeus left out: its floor is too shallow for the 0.5° grid, so it has no clear rim.

## Expected odometer readings (dry run on the real elevation grid)
| Crater | Real | Grid rim to rim | Depth on grid |
|---|---|---|---|
| Copernicus | 93 km | ~119 km | 3.1 km |
| Clavius | 225 km | ~253 km | 4.0 km |
| Tycho | 85 km | ~99 km | 3.8 km |

The grid reads ~14–28 km wide because rim smoothing spreads each rim out by about one cell.

## Files
- `settings.js`: `CRATERS`.
- `view/firstPersonMath.js`: `eastOf`, `approachStart` (`headingDegrees` reuses them).
- `view/firstPerson.js`: `enterFirstPersonAt`, `screenCentreStart`, `setButtonLabel`.
- `debug/craterJump.js`: the dropdown, behind `DEBUG.isEnabled`, one line in `main.js`.
- `style.css`: `.debug-craters`.
- `tests/firstPersonMathTests.js`: approach start distance, walking forward reaches the centre.
