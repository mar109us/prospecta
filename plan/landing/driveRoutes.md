# Step 15 — Drive routes and route labels

## Context
Straight-line distance ignored the terrain between a landing spot and its deposits. Spots are now scored by the cost of actually driving there, and the routes are drawn on the globe with a label at each deposit.

## Decisions
- Road grid: 1° (64,800 cells, 8 neighbours, wraps at 180°); cell slope = steepest 0.5° cell inside.
- Step cost = distance × (1 + 0.1 × slope°); blocked above 10° (heavy hauling; rovers manage ~15°, Earth haul roads ~5–6°). Settings: `LANDING.maxDriveSlopeDeg`, `slopeCostPerDegree`, `routeStepDeg`.
- One Dijkstra search per resource from all its rich deposits (`data/routes.js`, priority queue in `data/minHeap.js`) gives every cell its drive cost, route km and next step.
- Score uses drive cost; spots that can't reach every ticked resource are dropped.
- Routes for the selected result only (#1 after search, then the clicked card): smoothed with `CatmullRomCurve3`, 3 px `Line2` (Three.js addon, `vendor/addons/lines/`), resource colour; label at the deposit: "Iron · 18.2 wt% · 244 km drive" (route km).
- Search wiring moved from main.js to `app/search.js`.

## Result
Iron + silicon: search 0.22 s; #1 at 16.8°S 56.8°E, 261 km drive to iron, 209 km to silicon.

## Update — HTML labels, routes drawn on top
Route labels are HTML elements positioned over their 3D point each frame (12px, same as the panel, constant size at any zoom). Routes: every smoothed point is dropped onto the terrain height, lines drawn with depthTest off and hidden when their midpoint is past the horizon.

## Update — routes on the mesh
Route points now use `surfaceElevation` (bilinear between the same corner heights the mesh uses), depth test back on so hills hide them, material transparent + renderOrder 1 so they draw after the resource layers, label projection uses the current camera (`updateMatrixWorld`). `liftAboveGround` back to 0.002 (1 = a whole Moon radius).

## Update — flat area share
Score adds `(1 − flat share) × LANDING.flatAreaPenaltyKm` (150), where flat share = fraction of cells within `LANDING.flatAreaRadiusKm` (100 km) below `SLOPE.flatLimitDeg`. Shown on each card. `surroundingSlope` and `flatShareAround` share `slopesWithin`.

## Update — show the flat area of the selected result
Selecting a result (card, marker, or #1 after search) highlights every flat cell (< `SLOPE.flatLimitDeg`) within `LANDING.flatAreaRadiusKm` of it, plus a thin circle at that radius. Drawn in the slope shader (`showFocus`, `focusCentre`, `focusRadiusAngle`); look in `FOCUS` settings (colour white, fill 0.35, ring 1.5 px). Cleared at the start of each search.

## Update — minimum flat share
Distance terms (thousands of km with many resources) swamped the 150 km flat penalty, so a 38%-flat spot ranked #1. Spots below `LANDING.minFlatShare` (0.7) are now skipped entirely; the score only ranks spots with enough room.
