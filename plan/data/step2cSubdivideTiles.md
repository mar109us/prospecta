# Step 2c — Subdivide source tiles (interpolated "fake" sub-tiles)

## Context
The Lunar Prospector pixels are ~2° blocks, so iron shows as hard squares on the globe. Split every source pixel into 4 quarters and give each quarter an interpolated value that leans towards the neighbours on its side, giving smoother gradients. This is interpolation, not new data. Runs in the Python converter; the browser code does not change.

## Decisions (agreed)
- Split both ways → 4 quarters (NW, NE, SW, SE).
- Quarter value = (parent + average of the pixels touching that quarter) / 2. No touching neighbours → keep the parent value.
- `SUBDIVISION_LEVELS = 1` in `convertGrs.py`; each level splits the previous result again. Level 2 ≈ the 0.5° grid; level 3+ adds nothing visible at 0.5°.
- Missing-pixel fill still runs **before** subdividing.

## Files
| File | Why |
|---|---|
| `tools/convert/neighbours.py` (new) | `ranges_touch`, `lons_touch`, `is_touching` **moved here** from `convertGrs.py` (now shared); new `find_neighbours(pixel, pixels, arrays)` checks all pixels at once with numpy so 11k–45k pixels stay fast (plain loops would take minutes) |
| `tools/convert/subdivide.py` (new) | `split_into_quarters(pixel)`, `quarter_value(parent, quarter, parent_neighbours)`, `subdivide_once(pixels)`, `subdivide(pixels, levels)` |
| `tools/convert/convertGrs.py` | import from `neighbours.py`; `average_of_neighbours` uses `find_neighbours`; call `subdivide` after `fill_missing_pixels`; print pixel count per level |
| `tests/convertGrsTests.py` | import `is_touching` from `neighbours.py` |
| `tests/subdivideTests.py` (new) | "pixel splits into 4 quarters covering it", "quarter without neighbours keeps parent value", "quarter blends half parent, half neighbour", "two levels give 16 tiles" |
| `datasets/iron.json` | regenerated |
| `plan/data/step2cSubdivideTiles.md` | save this plan |

## How a quarter finds its neighbours
Neighbours of a quarter are always among its parent's neighbours. So: find the parent's neighbours once (numpy, fast), then check only those few against each quarter with `is_touching`.

## Verification
- `python3 tests/convertGrsTests.py`, `tests/gridTests.py`, `tests/subdivideTests.py` → all PASS.
- `python3 tools/convert/convertGrs.py` → prints 11,306 → 45,224 pixels, min/max, 0 empty cells.
- Live Server → iron edges visibly softer than before; try `SUBDIVISION_LEVELS = 2` and compare.
