# Step 16 — Remaining datasets from the original list

## Context
Add the rest of the original dataset list where a public, login-free, ready-made map exists (researched). Layers load only when first ticked, so startup stays fast despite ~17 layers.

## Datasets in this round
| Layer (group) | Source | Format / size | Coverage |
|---|---|---|---|
| Hydrogen (Volatiles) | LP Neutron Spectrometer `hydrogenhd.dat` (PDS Geosciences) | 720×360 big-endian int16, ÷10, row 0 = south | global |
| Polar hydrogen (Volatiles) | LRO LEND `lend_rdr_alds/aldn` tables (PDS) | fixed-width tables, ~4.5 MB each | poleward of 80° |
| Olivine, Low-Ca pyroxene, High-Ca pyroxene, Plagioclase (Minerals %) | Kaguya MI Lemelin 2016, official **4 ppd** GeoTIFFs (USGS AWS mirror) | ~2.3 MB each | ±50° |
| Soil maturity OMAT (Surface) | same, `OpticalMaturityIndex` 4 ppd | ~2.3 MB | ±50° |
| Silica-rich index (Surface) | Diviner Christiansen Feature, Zenodo 4558194 `diviner_CF_FeO_decorrelated.tiff` | 206 MB, 32 ppd; sign flipped so higher = more silica | ±70° |
| Mg/Al ratio – terranes (Surface & ratios) | Chandrayaan-2 CLASS, Zenodo 16726151 `maps.zip` | 132 MB zip of GeoTIFFs; intensity ratio | global |
| Titanium (Oxides) — **replaces** LP Ti | LROC WAC TiO₂ (Sato 2017), 8 PDS4 IMG tiles | ~1.2 GB one-time converter download (git-ignored `raw/`), read with numpy via `.xml` labels; app JSON stays ~2.7 MB like the others; < 2 wt% stored as 1 | ±70° |

Not possible (no public map): M³ surface ice, ShadowCam ice, Mg number, spinel / pure anorthosite / Mg-suite (only points in papers), M³ water (34 GB).

## 16a — Converter
- New dev-only dependency: `tifffile` (`python3 -m pip install tifffile`), converter only.
- `tools/convert/raster.py`: `read_geotiff` (array + extent from GeoTIFF tie point/scale tags; stop loudly if unexpected), `resample_to_grid` (block-average to 720×360 ignoring no-data/NaN, cells outside coverage → `null`).
- `tools/convert/convertRasters.py`: one entry per dataset (URL, file, unit, scale/sign, no-data value); downloads via `download_file`, unzips CLASS with `zipfile`; writes `datasets/<name>.json` with `save_grid_json`.
- `tools/convert/convertHydrogen.py`: LP hydrogen (flip rows so north is first).
- `tools/convert/convertLend.py`: LEND polar tables → 0.5° grid. Convert epithermal counts to water-equivalent hydrogen with Sanin et al. 2017; if the formula's constants can't be confirmed from the label/paper, show **epithermal neutron suppression (%)** instead and say so in the layer name.
- `convertGrs.py`: titanium entry removed (WAC replaces it).
- Tests: `tests/rasterTests.py` ("block average ignores no-data", "outside coverage becomes null", "north row first after flip").

## 16b — App
- `settings.js` `RESOURCES.layers`: new entries with groups **Volatiles**, **Oxides (wt%)**, **Minerals (%)**, **Trace elements (ppm)**, **Surface & ratios**; colours editable; only iron + silicon on by default.
- **Lazy loading**: overlay chunks start with empty channels; the first tick loads the JSON, fills that channel (`fillChannel` exported from `overlayPixels.js`), updates the texture, curve power and legend. Checkbox label shows "loading…" meanwhile.
- Search only uses ticked layers that have finished loading (message if one is still loading). Layers with no data in places (±50°/±70°) simply have no rich cells there.
- Tests: "filling a channel leaves the other channels untouched".
- Plan saved as `plan/data/step16MoreDatasets.md`.

## Verification
- Python tests pass; each converter prints range and empty-cell count (MI ~44% empty beyond ±50°).
- Live Server: startup only loads iron, silicon, slope, elevation (Network tab); ticking e.g. Olivine loads it once, legend appears; search with new layers works; WAC titanium shows sharp mare detail.

## Done — notes
- LP hydrogen grid is stored south-first (verified: 0.96 correlation with our iron after flipping).
- LEND: big-endian, CSETN rate column, rates <= 0 = no data, south file flipped; Sanin WEH constants not confirmed, so the layer shows neutron suppression vs the 80-82 degree ring. Signal is weak (~3%) against ±3.8% per-cell error.
- Kaguya plagioclase/OMAT: 0 = no data. Diviner: no geo tags; 180°W start confirmed with known silicic domes (sign flipped). CLASS: 296 s bins (98.9% coverage, error 0.006); 2 bands = ratio, error.
- WAC TiO2: image starts after a 27 KB header (offset in Array_2D_Image); values > 20 wt% are artefacts and dropped; 0.81 correlation with LP titanium. LP titanium removed from convertGrs.
- App: layers load on first tick (`app/resourceLayers.js`, `addLayerGrid`), 5 overlay chunks for 17 layers; search waits for loading layers.

## Update — clean-up after first look
- CLASS Mg/Al smoothed over 7×7 cells (gap-aware `smooth_grid` in raster.py) to remove orbit-strip stripes.
- Resource layers fade out over the last `RESOURCES.edgeFadeDeg` (3°) before their coverage limit (`coverageLatLimit`, uniform `layerLatLimits`); global layers are not faded.
- Route labels and cards use the layer labels from settings (`layerLabel`).
- "Clear all" button in the Resources section (`connectClearButton`).
