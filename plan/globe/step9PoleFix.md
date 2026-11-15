# Step 9 — Fix the pole pinwheel

## Context
Both poles (worst at the south) show a radial "pinwheel" in the shading. It existed before the normal map. Two causes:
1. **Data:** near the poles, an equirectangular row holds thousands of samples for a tiny circle of ground. LOLA values vary along those rows (90°S edge row spreads 237 m), which the sphere turns into radial streaks — in the elevation grid and in the normal map.
2. **Mesh normals:** `SphereGeometry` has 721 separate pole vertices, each in one thin wedge triangle, so `computeVertexNormals()` gives every wedge a different normal.

## Fix
- **Latitude-aware longitude blur (converter):** each row is averaged along longitude over a window covering the same *ground* width as one equator pixel: `window = ceil(1 / cos(lat))` pixels, odd, capped at the row width, wrapping around 180°. Equator rows are untouched; rows near the pole become nearly uniform, as the real ground there is one small area.
  - Apply to the elevation grid (`convertLola.py`, after block averaging) and to the LDEM_16 elevation before the fine-detail step (`convertNormalMap.py`).
- **Pole normals (browser):** after `computeVertexNormals()`, set every pole vertex (uv.y = 0 or 1) to point straight out of the pole (0, ±1, 0).

## Files
| File | Change |
|---|---|
| `tools/convert/polar.py` (new) | `blur_longitude_by_latitude(grid, pixels_per_degree)` using the per-row cumulative-sum moving average (wrap) |
| `tools/convert/convertLola.py`, `tools/convert/convertNormalMap.py` | call it |
| `view/terrain.js` | `fixPoleNormals(geometry)` after `computeVertexNormals()` |
| `tests/polarTests.py` (new) | "equator row unchanged", "pole row becomes uniform", "60° row averages over ~2 pixels" |
| `datasets/elevation.json`, `assets/textures/moonNormal16.png` | regenerated |
| `plan/globe/step9PoleFix.md` | save this plan |

## Not in scope
The colour photo is also squeezed at the poles; check it after this fix and handle separately if still visible.

## Verification
- Python tests pass; converters re-run.
- Live Server, Cmd+Shift+R, look straight down at both poles: no radial wedges in the lighting; craters near the pole still visible.
