# Resource panel restructure

## Goal
One flat main list + a collapsed "More layers" section, fewer layers, merged hydrogen and pyroxene.

Main: Iron, Titanium (TiO₂), Aluminium, Silicon, Water ice (H), Thorium.
More layers: Magnesium, Calcium, Potassium, Olivine, Pyroxene, Plagioclase.
Removed: soil maturity (OMAT), Diviner silica, CLASS Mg/Al.

## Converters
- `convertRasters.py`: drop OMAT, silica, Mg/Al code. `convert_pyroxene` = low-Ca + high-Ca, cell by cell (same MI source, % units, 4 ppd grid; checked before summing) → `pyroxene.json`.
- `convertHydrogen.py`: LP hydrogen poleward of 80° → null, so LEND is shown at the poles.
- Delete datasets: soilMaturity, silica, magnesiumAluminium, lowCaPyroxene, highCaPyroxene.

## App
- `settings.js`: no `group`; `isExtra: true` for "More layers"; `note` = label tooltip; `polarHydrogen` has `partOf: "hydrogen"` (no own checkbox, follows the hydrogen toggle).
- `resourcePanel.js`: flat list + `<details>` "More layers"; `partOf` layers only get a legend row under their parent.
- `resourceLayers.js`: a toggle also shows its `partOf` companions.
- `search.js` / `landingSpots.js`: a resource has `grids: [...]`; rich cells from all grids → water ice is one resource.
- Legend: Water ice shows two rows (ppm global, % polar) + tooltip "measured as hydrogen, indicates likely water ice".

## Tests
- Python: pyroxene sum, hydrogen cut beyond 80°.
- JS: water ice = one resource from two grids, panel builds flat list + More layers; landing tests updated to `grids`.
