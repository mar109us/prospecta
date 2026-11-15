# Step 7 — 8k Moon colour texture

## Context
The globe is plain grey under the overlays. A high-resolution NASA colour photo of the Moon makes it look real and visually masks the coarse 15 km heightmap. Overlays fade to 70% so the surface shows through. A LOLA-derived normal map (fine crater shading) follows as step 8.

## Source
NASA SVS CGI Moon Kit, `lroc_color_poles_8k.tif` (8192×4096, 24-bit, 48 MB, equirectangular, centred on 0° → matches our UV mapping). Credit: NASA's Scientific Visualization Studio.

## Files
| File | Change |
|---|---|
| `tools/convert/downloadTexture.py` (new) | `download_file()` the TIFF into `tools/convert/raw/`, convert once with macOS's built-in `sips` (via `subprocess.run`, check return code) to `assets/textures/moonColour8k.jpg` (~10 MB) |
| `view/moonTexture.js` (new) | `async applyMoonTexture(globe, url)`: `TextureLoader.loadAsync`, `SRGBColorSpace`, max anisotropy (sharp at glancing angles), set as the Moon material's `map`, colour white |
| `view/overlay.js` | `OVERLAY_OPACITY = 0.7` → `material.opacity` (shader already multiplies alpha) |
| `main.js` | `addMoonTexture(globe)` in its own `try/catch` with a readable error |
| `main.html` + `style.css` | `<footer class="credits">` with the NASA SVS credit |

## Notes
- ~128 MB GPU memory; fine on recent Macs/PCs. 16k rejected (512 MB, often over GPU limits).
- The JPG is committed like the datasets; the raw TIFF stays git-ignored in `raw/`.

## Verification
- `python3 tools/convert/downloadTexture.py` → JPG exists, 8192×4096 (`sips -g pixelWidth -g pixelHeight`).
- Live Server, Cmd+Shift+R → real Moon surface; maria line up with the iron layer and LOLA basins (proves orientation); overlays at 70%; credit visible; no console errors.
