# Step 10 — Layer categories + slope layer

## Context
The panel will hold more than resources. Group layers into collapsible categories and add a **Terrain → Slope** layer that colours ground steepness in landing-relevant bands. Only one category is visible at a time (a colour spectrum on top of rust/blue would be unreadable).

## Decisions
- Panel: `<details>`/`<summary>` per category — **Resources** (iron, silicon, open) and **Terrain** (slope, unchecked). Built-in HTML, no JS needed to open/close.
- Exclusive categories: ticking a layer in one category unticks and hides every layer of the other category.
- Slope bands (degrees): green < 1, yellow-green 1–5, yellow 5–10, orange 10–15, red > 15. Smooth anti-aliased edges like the resource bands.
- Slope from LOLA LDEM_16 (~1.9 km scale) after the polar blur, averaged to our 0.5° grid → `datasets/slope.json`. Note: real slopes at lander scale (metres) are rougher.

## Files
| File | Change |
|---|---|
| `tools/convert/convertSlope.py` (new) | read LDEM_16 (`read_lola`), shift to 180°W, `blur_longitude_by_latitude`, `slopes()` from `normalMap.py`, degrees = `atan(hypot(east, north))`, `average_blocks` 8×8 → 720×360, `save_grid_json` (unit "degrees") |
| `tests/convertSlopeTests.py` (new) | "flat ground is 0°", "a 1:1 ramp is 45°" |
| `view/slopeShader.js` (new) | `applySlopeShader(material, uniforms)`: texture value → degrees (0–45), band by thresholds `[1, 5, 10, 15]`, colour from 5-colour uniform array, `fwidth` edge smoothing |
| `view/slopeOverlay.js` (new) | `createSlopeOverlay(globe, grid)` → `{ mesh, uniforms }` sharing the Moon geometry (`polygonOffsetFactor -2`), reuses `buildLayerPixels` with range 0–45°; `setSlopeVisible(overlay, isVisible)`; starts hidden |
| `main.html` | panel: two `<details>` sections, slope checkbox `<label for="slope-toggle">` |
| `style.css` | small styles for `details`/`summary` |
| `main.js` | each layer gets a `category`; `addSlopeLayer(globe)`; `connectCategoryToggles` keeps categories exclusive; normal map also applied to the slope mesh |
| `view/moonTexture.js` | `applyNormalMap` accepts a list of extra materials instead of one overlay |
| `plan/globe/step10SlopeLayer.md` | save this plan |

## Verification
- `python3 tests/convertSlopeTests.py` PASS; `python3 tools/convert/convertSlope.py` prints slope range (maria mostly < 5°, basin walls > 15°).
- Live Server: sections open/close; ticking Slope hides iron/silicon and unticks them, and vice versa; maria green, crater walls orange/red; no console errors.

## Update — steepest spot per cell
Slope cells now store the 90th-percentile slope of their 8×8 LDEM_16 pixels instead of the average, so crater walls and rough ground keep their steepness.

## Update — 8 bands
Thresholds 1, 3, 5, 7, 10, 15, 20° with 8 colours (user palette white → yellow → orange → red, extended). Shader arrays are sized from settings via `#define SLOPE_THRESHOLD_COUNT`; createSlopeOverlay throws if colours ≠ thresholds + 1.

## Update — green → purple palette
Warm slope colours clashed with the rust iron layer and the near-white 1–3° band dominated. New palette uses hues free of rust and blue: pale lime → green → lavender → purple → magenta. Dot opacity rises with steepness from `dotMinOpacity` (0.35) to `dotOpacity` (1).
