# Detail tiles — blend the edges

## Context
Where detail tiles meet the coarse globe, the edge is visible: sharp 240 m texture next to the smooth coarse globe, plus a thin dotted line. Average brightness matches within 5% (measured), so the problem is contrast and cracks, not colour.

## Decisions
- **Dotted line:** gaps where the tile edge (a vertex every 1/32°) meets the coarse edge (a vertex every 0.5°). The coarse globe now keeps drawing a hair (0.02°) into the masked area, so gaps show coarse ground. The tile sits exactly on top there and wins with its depth offset. Overlays keep the exact edge, so they don't draw twice.
- **Feather:** the tile shader blends from a "coarse look" to the "tile look" over `DETAIL.featherDeg` (1°) next to cells whose tile isn't shown.
  - The coarse look is the coarse vertex normals (taken from the globe's own mesh) plus the LDEM_16 normal map, with no WAC shade. That is exactly how the coarse globe is lit.
  - The mask texture's G channel holds each 5° cell's tile opacity, so feathering fades in and out smoothly as neighbours load, and edges between two shown tiles stay sharp.
- Tile triangles now use the same diagonal as the coarse mesh, so the fading tile lies on the coarse surface everywhere, not only at its vertices.

## Files
`view/detailMask.js`, `view/moonShader.js`, `view/detailShader.js`, `view/tileGeometryMath.js`, `view/detailGeometry.js`, `view/detailTile.js`, `view/detailLoader.js`, `main.js`, `settings.js`, and tests.
