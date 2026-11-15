# Step 14 — All Lunar Prospector elements + legends

## Context
Add the remaining elements from the Lunar Prospector GRS table we already download, and show a legend next to every layer.

## 14a — Converter
- `convertGrs.py` now has a `DATASETS` list (`make_dataset`): iron, silicon, titanium, magnesium, aluminium, calcium (wt%, ×100) and potassium, thorium (ppm, ×1). Uranium skipped: the table defines it as 0.27 × thorium.
- `is_zero_missing` per dataset (true only for iron). TiO₂, MgO, Al₂O₃, K have many exact zeros that are real "practically none" values.
- Smoothing picked automatically: Mg 32, Ca 32, Al 8 pixels; Ti, K, Th untouched (Th is the cleanest map, noise 0.07).

## 14b — Layers and panel
- `RESOURCES.layers` in settings.js holds all 8 (label, group, colour, defaults); only iron and silicon on by default.
- Resource checkboxes are built from settings by `view/resourcePanel.js`, in groups "Oxides (wt%)" and "Trace elements (ppm)".
- One texture holds 4 layers (RGBA), so the resource overlay is split into chunks of 4 meshes; `setLayerVisible` picks chunk and channel. Overlays expose `meshes` for the normal map.

## 14c — Legends
- `view/legend.js`: resource strip of 5 band swatches (real colour and opacities, incl. the noise curve) + display range; slope dots per band with degree tooltips; flat areas swatch "< 5°".

## Trade-off
~22 MB of JSON loads at startup; lazy loading per ticked layer is a possible later step.
