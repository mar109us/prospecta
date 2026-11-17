# Step 13 — Detail tiles (sharp terrain up close)

## Context
Zoomed in, one screen pixel ≈ 0.3 km, but the colour texture is 1.3 km/px, the normal map 1.9 km/px and the mesh has a vertex every 15 km, so the terrain looks blurry and smooth. Fix: when the camera is close, load high-res tiles for only the area in view.

## Decisions (from your answers)
- Pre-baked tiles from a Python converter into `assets/detail/` (gitignored, not in git or the Docker image; mounted by docker-compose).
- Elevation: LOLA LDEM_128 (128 px/°, 2.1 GB download).
- Imagery: LROC WAC 100 m mosaic (10 files, 18.7 GB download) shrunk to 128 px/°, tinted with the 8k colour so tiles match the globe.
- Marker/route heights on the fine terrain: a later step.

## Tile design
- **Tiles:** 5° × 5° below 60° latitude. Toward the poles they get wider in longitude (10°, 15°, 20°, 30°, 60°) so they stay about the same size on the ground. Each tile is 640×640 px (about 240 m/px), about 1,990 tiles in total.
- **Files per tile:**
  - `{id}.bin`: 161×161 raw Int16 heights. The browser reads it with `Int16Array`, with no decoder.
  - `{id}_normal.jpg`: normals baked in Python, reusing `normalMap.py`.
  - `{id}_shade.jpg`: WAC brightness ÷ blurred WAC brightness, which multiplies the 8k colour.
  - `tiles.json` lists all tiles.
- **Mesh:** 160×160 segments per tile (about 1.2 km between vertices). At most 24 tiles are shown, which is about 620k vertices.
- **Which tiles to load:** where the camera's centre ray hits the Moon, only below 520 km altitude, tiles within 8°, nearest first. It checks every 300 ms and fetches only when the view has stopped moving. A cache of 40 tiles, oldest dropped.
- **Coarse globe vs tiles:** a 72×36 mask texture makes the coarse globe and the overlays skip pixels where a tile is shown. Tile geometry uses the same global UVs as the sphere, so resource/slope overlays are cloned onto tiles unchanged, except for the tile's normal map. Tile edges blend down to the coarse height, so there are no cracks.
- **Size:** about 0.7 GB baked, 5–7 MB per zoomed-in view, about 55 MB of GPU textures.

## Steps (all run in one go, in order, each with its tests; report at the end)
a. `tools/convert/detailTiles.py`: tile layout and ids. Tests in `tests/detailTilesTests.py`.
b. Elevation tiles from LDEM_128 (`ldemWindow.py`, `convertDetail.py --tile`), streamed with `np.memmap`.
c. Normal-map tiles (`tile_slopes` in `normalMap.py`).
d. WAC equator files → shade tiles (`wacMosaic.py`).
e. WAC polar files (polar stereographic reprojection) with a visual check against the 8k texture.
f. Full bake (`--all`, `--region`), plus `.gitignore`, `.dockerignore`, `nginx.conf` (gzip `.bin`) and `docker-compose.yml` mount.
g. `settings.js` `DETAIL` object, and `view/detailMath.js` for pure maths (look point, wanted tiles, UV transform, edge blend). Tests in `tests/detailMathTests.js`.
h. Tile geometry (`view/tileGeometryMath.js` pure, `view/detailGeometry.js`) with tests.
i. One hard-coded tile on screen (`view/detailShader.js`, `view/detailTile.js`).
j. Mask (`view/detailMask.js`, `view/moonShader.js`, plus small additions to `layerShader.js`/`slopeShader.js`).
k. Overlays on tiles (`view/detailOverlays.js`).
l. Loader (`view/detailLoader.js`), wired in `main.js` with its own `try/catch`.

## Risks
- Polar reprojection conventions are easy to get wrong, hence the visual check in step e.
- The tile pops in when it loads (a fade can come later). The first tile causes a short shader-compile hitch.
- 19 GB of downloads; `download_file` can't resume. Bake one region first.

## Verification
- Python tests (`tests/*Tests.py`) and `tests/tests.html` console: all PASS.
- Bake one region, zoom to it: crisp craters, no seams between tiles, overlays still on top, no coarse globe poking through.
- `console.table` of shown tiles whenever the set changes.

## Revisions during implementation
- Elevation source: wustl's LDEM_128 downloaded at about 50 KB/s, so the converter reads the USGS copy of the same LOLA data instead (`Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif`, 256 px/°, 8.5 GB, from S3). It is an uncompressed BigTIFF whose rows sit back to back from byte 738233, so `ldemWindow.py` memory-maps it like a raw `.img` (int16, 0.5 m units, column 0 = 180°W) and averages 2×2 pixels down to 128 px/°.
- Polar check: instead of a `--check-polar` preview, the polar file's row just south of 60° was correlated with the equatorial file's row just north of it. 0.59 as written, about 0 for every flipped axis, so the projection is right.
- Mask: the moon, resource and slope shaders share `MASK_PARS` / `MASK_DISCARD` from `view/detailMask.js`, switched on per material with the `USE_DETAIL_MASK` define. Tile overlay clones lose that define automatically, because `MeshStandardMaterial.copy` resets `defines`.
- WAC mosaic seams: NASA's polar mosaics join four quadrants at 0°, ±90° and 180°, and the equatorial files join at those meridians and at 0° / ±60° latitude. Each part was lit differently, so the shade jumped 3–5× across the joins. The bake now fades the WAC shade to neutral within 8 km of every join (`seam_weight` in `wacMosaic.py`, `SEAM_FADE_KM`). After the rebake, the jumps measure 0.01–0.03× the normal pixel change.
