# Step 2e — Stepped opacity

## Context
Smooth opacity made it hard to read iron amounts. Condense values into 5 equal steps between each map's own min and max, so every dataset gets bands automatically (no per-dataset tuning).

## Decisions
- `STEP_COUNT = 5`, one global constant in `view/overlayPixels.js`.
- `step = floor(t × 5)`, max capped into the top step (`t` = 0–1 position between min and max).
- Step opacity eased: 0, 6, 25, 56, 100% (`(step / 4)²`).
- `null` transparent, flat map fully opaque; soft LinearFilter edges kept.
- Iron steps start at ~1.8 / 7.1 / 12.4 / 17.6 / 22.9 wt%.

## Files
- `view/overlayPixels.js`: `valueToStep`, `stepToAlpha`, `valueToAlpha` uses both.
- `tests/overlayPixelsTests.js`: step tests.
