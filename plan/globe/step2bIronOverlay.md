# Step 2b — Iron overlay on the Moon

## Context
Second half of step 2. Paint `datasets/iron.json` onto the grey Moon as a see-through rust layer, with an on/off checkbox. Legend comes later.

## Decisions
- Colour `#B7410E` (rust); opacity = `value / max` (max iron = fully opaque), `null` = transparent.
- Smooth blending between cells (LinearFilter).
- Overlay is a second mesh **sharing the Moon's geometry** (bends with the future heightmap), `polygonOffset` to stop flicker.
- Checkbox now; legend later.

## Files
| File | What and why |
|---|---|
| `data/datasetLoader.js` | `loadDataset(name)`: fetch, check `response.ok`, throw a descriptive error on failure |
| `view/overlayPixels.js` | grid → RGBA bytes; row flip so north is at the top; no Three.js, easy to test |
| `view/overlay.js` | `createOverlay(globe, grid, colour)`, `setOverlayVisible(overlay, isVisible)` |
| `main.html` | `<aside>` panel, checkbox with `<label for>`, `<p role="alert">` for errors |
| `style.css` | panel top-left over the globe |
| `main.js` | async `main`, loads iron, wires checkbox, shows load errors |
| `debug/logState.js` | log grid info + toggles (behind `IS_DEBUG`) |
| `tests/tests.html`, `tests/overlayPixelsTests.js` | console tests |

## Verification
Live Server → near-side maria rust, highlands grey; checkbox hides/shows iron; `tests/tests.html` all PASS.
