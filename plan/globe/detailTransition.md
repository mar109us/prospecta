# Detail tiles — smooth transition

## Context
Detail tiles switch on and off suddenly. Make the switch gradual in both directions, about 2 s in total.

## Decisions
- One number per tile, its **level**, from 0 (hidden) to 2 (fully shown).
  - 0 → 1, fade (`DETAIL.fadeMs` 800): the tile sits exactly on the coarse surface and fades in over the coarse globe.
  - At 1: the coarse globe is masked under the tile and the tile's overlay clones show. It looks identical, so nothing changes visibly.
  - 1 → 2, morph (`DETAIL.morphMs` 1200): heights move from coarse to fine.
  - Leaving a tile plays the same steps in reverse.
- The tile's "coarse" positions lie exactly on the coarse globe's triangles (same split as `SphereGeometry`). The fading tile therefore covers the coarse globe with no patches, and tile edges meet it with no crack.
- The tile is drawn first among the transparent meshes with a small depth offset, so it wins over the coarse globe and overlays stay on top.
- Choosing tiles still runs every 300 ms. The animation runs every frame. A tile with level > 0 is never dropped from the cache.

## Files
- `settings.js`, `view/detailMath.js` (`stepLevel`, `levelLook`), `view/tileGeometryMath.js` (`coarseSurfacePoint`, coarse and fine positions), `view/detailGeometry.js` (`setMorph`), `view/detailShader.js`, `view/detailTile.js` (`applyLevel`), `view/detailLoader.js`, `main.js` (coarse mesh size), and tests.
