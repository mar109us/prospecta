# Step 3b — Iron + silicon in one overlay, diagonal stripes on overlap

## Context
Show silicon next to iron. Where both are present, diagonal stripes alternate the layer colours instead of mixing them, so both stay readable. Built to scale to more datasets (up to 4 per texture).

## Decisions
- One RGBA texture, one dataset per channel (R iron, G silicon, B/A free), values 0–255 across each dataset's display range (2nd–98th percentile), clamped; `NoColorSpace` (data, not colour).
- Shader: per layer band strength (5 eased bands, anti-aliased); present = band ≥ 1; none → transparent, one → its colour, several → 2° diagonal stripes `(lon + lat) / 2°` cycling through present layers, anti-aliased with `fwidth`.
- Colours (`#B7410E` iron, `#2F7FD8` silicon) and visibility are uniforms; checkboxes flip `layerVisible`.
- Known limitation: stripes squeeze near the poles (lat/lon based).

## Files
- `view/overlayPixels.js`: `valueToByte`, `buildLayerPixels(grids)` (throws on size mismatch / > 4 grids).
- `view/layerShader.js` (renamed from `steppedOpacityShader.js`): `applyLayerShader(material, uniforms)`.
- `view/overlay.js`: `createOverlay(globe, layers, grids)` → `{ mesh, uniforms }`, `setLayerVisible(overlay, index, isVisible)`.
- `main.js`: `LAYERS` array, `loadGrids`, `connectToggles`.
- `main.html`: silicon checkbox.
- `tests/overlayPixelsTests.js`: channel packing + clamping tests.

## Update
Stripes looked too busy (silicon is present almost everywhere). Replaced with a colour blend: colour = strength-weighted average of layer colours, opacity = strongest layer. Stripe width constant and uniform removed.
