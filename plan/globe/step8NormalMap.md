# Step 8 — LOLA normal map (fine crater shading)

## Context
The mesh only carries ~15 km relief. A normal map adds fine crater shading to the lighting without extra vertices, so the Moon looks as detailed as its 8k colour texture.

## Decisions
- Source LDEM_16 (33 MB, 5760×2880, same format as LDEM_4).
- Fine detail only: elevation minus its 0.5° moving average (window 9 px), so the mesh relief is not shaded twice.
- Slopes in m/m; east-west pixel width × cos(lat), clamped at 0.05 near the poles.
- Normal = normalize(−slopeEast, −slopeNorth, 1) with slopes × 4 baked in (avoids banding); RGB 0–255.
- Written as PPM (no library) and converted with `sips` to PNG.
- Applied to both the Moon and the overlay; `normalScale = HEIGHT_EXAGGERATION / 4`.

## 8a — Converter (done)
- `tools/convert/normalMap.py`, `tools/convert/convertNormalMap.py`, `read_lola(path, height, width)`.
- `tests/normalMapTests.py`.
- Result: 5760×2880 PNG, 35 MB; fine detail −2.6 to +2.0 km; typical fine slope 0.048.

## 8b — Globe
- `view/moonTexture.js`: `applyNormalMap(globe, overlay, url)` (`NoColorSpace`, anisotropy).
- `main.js`: layer code returns the overlay; normal map applied after, own `try/catch`.
- Check crater lighting direction; flip green with `normalScale.y` if wrong.
