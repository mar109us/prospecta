# Step 2a — Iron converter

## Context
First half of step 2 (iron on the Moon). Turn the Lunar Prospector GRS table into `datasets/iron.json` (0.5° grid). Step 2b paints it on the globe.

## Source
`lpgrs_high1_elem_abundance_2deg.tab` (9.9 MB, PDS Geosciences). 11,306 equal-area pixels in 91 latitude bands; each row has MIN_LAT, MAX_LAT, MIN_LON, MAX_LON (cols 1–4) and W_FEO as a fraction (col 12). FeO range 0.2–30.7 wt%.

## Files
| File | Why |
|---|---|
| `tools/convert/download.py` | `download_file(url, path)`: skip if present, clear error on failure, no half-finished files |
| `tools/convert/grid.py` | 720 × 360 numpy grid, cell centres, fill a pixel, save JSON |
| `tools/convert/convertGrs.py` | read table, fill grid, write `datasets/iron.json` (FeO wt%, 2 decimals) |
| `tests/gridTests.py` | plain `assert` tests, print PASS/FAIL |
| `.gitignore` | ignore `tools/convert/raw/` |

## Details
- A pixel fills every cell whose centre lies inside its edges (min inclusive, max exclusive, so neighbours never overlap).
- Column number is a setting, so silicon is one extra entry later.
- JSON gets `min` and `max` so the browser can scale opacity (`value / max`) without searching.
- Files camelCase, Python functions snake_case.

## Verification
`python3 tools/convert/convertGrs.py` prints min/max/null count; `datasets/iron.json` ~1.5 MB; `python3 tests/gridTests.py` all PASS.
