# Step 13 — "Find suitable flat areas" (landing-spot ranking)

## Context
The core of the app: a button that finds the 5 best flat landing areas for the resources the user has ticked. A good spot is flat, close to rich deposits of every ticked resource, about equally far from each, and not boxed in by steep ground.

## Rules
- **Targets:** each ticked resource layer (iron, silicon …). Its *rich cells* = the top 10% of its map (`LANDING.richTopFraction`). Distance to a resource = great-circle distance to its nearest rich cell.
- **Candidates:** cells with slope < `SLOPE.flatLimitDeg` (5°), checked on a 1° grid (`LANDING.searchStepDeg`) to keep it fast.
- **Score (km, lower = better):**
  `average distance + (farthest − nearest distance) + surroundingSlopeDeg × LANDING.slopePenaltyKmPerDegree (20)`
  - surroundingSlope = average slope of all cells within `LANDING.surroundingsRadiusKm` (50 km).
- **Results:** best 5 (`LANDING.resultCount`), each at least `LANDING.minSeparationKm` (200 km) from better ones.
- No resource ticked → message "Tick at least one resource first." (no search).
- Search runs on button click (~1 s); a "Searching…" status shows meanwhile.

## Step 13a — logic + tests (no UI)
| File | What |
|---|---|
| `settings.js` | new `LANDING` category (richTopFraction, searchStepDeg, surroundingsRadiusKm, slopePenaltyKmPerDegree, minSeparationKm, resultCount) |
| `data/geo.js` (new) | `cellCentre(grid, row, column)` → lat/lon, `toUnitVector(lat, lon)`, `distanceKm(a, b)` (great circle via dot product) |
| `data/richCells.js` (new) | `richThreshold(values, topFraction)`, `findRichCells(grid, topFraction, stepDeg)` → list of unit vectors |
| `data/landingSpots.js` (new) | `findFlatCandidates`, `surroundingSlope`, `nearestDistanceKm`, `scoreCandidate`, `pickSeparated`, `findLandingSpots(input)` → 5 ranked spots `{ rank, lat, lon, distancesKm, surroundingSlopeDeg, score }` |
| `tests/geoTests.js`, `tests/landingSpotsTests.js` (new) | e.g. "90° apart is a quarter circumference", "top 10% threshold", "equal distances beat uneven ones", "steep surroundings lower the rank", "results are at least 200 km apart" |

## Step 13b — button, markers, list
| File | What |
|---|---|
| `main.html` | `<section>` in panel: button "Find suitable flat areas", status `<p>`, results `<ol>` |
| `view/markers.js` (new) | numbered markers (small sprites with a number, drawn on a canvas) placed on the terrain surface (radius from elevation) |
| `view/results.js` (new) | renders the list with `textContent` (rank, lat/lon, distances, surrounding slope); clicking an item turns the camera to that spot |
| `main.js` | keep loaded grids; wire the button: ticked resources → `findLandingSpots` → markers + list; `console.table` of results |
| `plan/landing/findFlatAreas.md` | save this plan |

## Verification
- `node tests/geoTests.js`, `node tests/landingSpotsTests.js` → all PASS.
- Live Server: tick iron + silicon, click the button → 5 numbered markers on flat (green) ground near the rust/blue border, list sorted by score, items 200+ km apart; clicking an item turns the globe; with no resource ticked → message.

## Update — result cards
Results moved from the left panel list to cards in a right-side panel (`<aside class="results">`); each card is a button that turns the globe to the spot.

## Update — fly to a card
Clicking a card flies the camera to the spot: direction slerped and distance moved to `CAMERA.focusDistance` (8) over `CAMERA.flyDurationMs` (500 ms) with cubic ease-in-out; controls paused during the flight.
