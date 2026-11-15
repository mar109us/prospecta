# Step 11 — Slope contour lines next to resources

## Context
Making categories exclusive means you can't see iron/silicon and slope together. Slope gets a second display style, contour lines, which doesn't compete with the resource colours. The Terrain category gets two checkboxes: **Slope (colours)** (current spectrum) and **Slope (lines)**.

## Rules
- Layers are either a **fill** (colours areas: iron, silicon, slope colours) or **lines** (slope lines).
- Ticking a fill hides fills of other categories (rust/blue vs green…red would clash). Lines never hide anything and are never hidden.
- Lines at 5°, 10°, 15° in the slope colours (yellow, orange, red), fully opaque, ~1.5 px wide at any zoom.

## How the lines are drawn (GPU)
Per pixel: `distancePx = |slope − threshold| / fwidth(slope)` = how many screen pixels away the contour is. `line = 1 − smoothstep(width − 0.5, width + 0.5, distancePx)` → a crisp, anti-aliased line of constant screen width. Strongest of the three lines wins.

## Files
| File | Change |
|---|---|
| `view/slopeShader.js` | add line drawing; uniforms `showFill`, `showLines`, `fillOpacity` (0.7), `lineWidthPx` (1.5); alpha = max(fill, line) so lines stay solid |
| `view/slopeOverlay.js` | material opacity 1 (opacity now in the shader); `renderOrder = 1` so slope draws above resources; `setSlopeFillVisible`, `setSlopeLinesVisible` (mesh hidden when both off) |
| `view/layerToggles.js` | toggles carry `isFill`; new pure `shouldHide(toggle, changedToggle)`; only fills hide fills of other categories |
| `main.js` | `SLOPE_FILL_LAYER`, `SLOPE_LINES_LAYER`, resource layers get `isFill: true` |
| `main.html` | Terrain: `slope-fill-toggle` "Slope (colours)", `slope-lines-toggle` "Slope (lines)" |
| `tests/layerTogglesTests.js` (new) + `tests/tests.html` | "fill hides fills of other categories", "fill keeps same-category layers", "lines never hide anything", "lines are never hidden" |
| `plan/globe/step11SlopeLines.md` | save this plan |

## Verification
- `node tests/layerTogglesTests.js` → all PASS.
- Live Server: iron + silicon + Slope (lines) together → rust/blue with yellow/orange/red contours; ticking Slope (colours) hides iron/silicon; lines stay thin when zooming; no console errors.

## Update — stripes instead of contour lines
Contour lines replaced by screen-anchored 45° stripes, no outline. Only 5° and steeper: yellow (5–10°) every 14 px, orange (10–15°) every 10 px, red (> 15°) every 7 px; 3 px wide; divided by pixel ratio so Retina matches. Checkbox "Slope (stripes)".

## Update — dots instead of stripes
Stripes slid when rotating and were too strong. Replaced by surface-anchored dots, no outline, every band from 1°: yellow-green every 2.4°, yellow 1.6°, orange 1.1°, red 0.75°; radius 0.18°, 80% opacity. Rows of dots with per-row count = circumference / spacing, so no pole squeeze. Checkbox "Slope (dots)".

## Update — one dot spacing
Density-by-steepness looked bad. All dots now share one grid (every 0.6°, radius 0.1°); colour from the slope at each dot centre, so dots are never cut in half at band edges.
