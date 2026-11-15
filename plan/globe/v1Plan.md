# Overall v1 plan

Browser app: 3D Moon (Three.js, LOLA heightmap); user ticks iron and/or silicon; app proposes landing spots at the midpoints of the closest rich-iron / rich-silicon pairs.

- Three.js local copy in `vendor/` (only app dependency).
- Python converter (numpy, dev-only) downloads sources itself (`urllib`, `tools/convert/raw/`, git-ignored) and writes 0.5° JSON grids (720 × 360), loaded with `fetch`. No live streaming (no service streams raw values).
- Datasets (~12 MB download): LOLA `LDEM_4.IMG` (~2 MB); Lunar Prospector GRS `lpgrs_high1_elem_abundance_2deg.tab` (~10 MB) for FeO + SiO₂ (~5° effective resolution). Output ~1.3 MB per JSON.
- JSON grid: `name`, `unit`, `source`, `resolutionDeg`, `width`, `height`, `values` (row 0 = 90°N, col 0 = 180°W, `null` = no data).
- Scoring: rich = top 10% valid cells; thin to one per 2° block; closest iron/silicon pairs by great-circle distance; 5 midpoints, skip spots within 100 km of a better one; one resource ticked → 5 richest cells.
- Structure: `main.html`, `style.css`, `main.js`, `data/` (datasetLoader, geo, richCells, landingSpots), `view/` (globe, overlay, markers, panel), `tools/convert/`, `tests/` (console tests), `debug/`.
- Risks: blurry/blocky element maps (swap JSON later for Kaguya MI / CLASS); spots will sit on mare/highland borders.
