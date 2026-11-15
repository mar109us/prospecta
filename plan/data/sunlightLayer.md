# Sunlight layer (average illumination)

## Data
LOLA average illumination (Mazarico et al. 2011, 2016 update), imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/
`AVGVISIB_65N_240M_201608.IMG` / `AVGVISIB_65S_…` (82 MB each): polar stereographic, 6420 × 6420, 240 m/px,
int16 LSB × 0.00004 = sunlit fraction (0 = permanent shadow, 1 = always lit). Complete from 65° to the pole.
Below 65° there is no map (everything gets ~50%).

## Converter
`tools/convert/convertSunlight.py`: pixel → lat/lon (PDS polar stereographic), keep |lat| > 65°,
90th percentile per 0.5° cell (like slope), save `datasets/sunlight.json` in "sunlit %".
Orientation check: correlation with `elevation.json` (higher ground = sunnier) is printed.

## App
- `settings.js`: `SUNLIGHT` (datasetName, label "Sunlight", colour `#FFD54F`, isOnByDefault false).
- `app/sunlightLayer.js`: own one-layer overlay, stepped ramp like resources, loads on first tick, legend above its row.
- Terrain panel: third row; panel wider (~720 px). Toggle `isFill: false` so it does not hide resources.
- Map only; search scoring comes later.

## Tests
Python: polar pixel → lat/lon, 90th percentile per cell, cells outside coverage stay empty.
JS: sunlight toggle does not hide resources.
