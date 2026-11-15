# Render cost (branch perf/render-cost)

## Problem
GPU at 100%: the whole Moon sphere is drawn ~7 times per frame (Moon, 4 resource meshes, slope, sunlight),
even when no layer on a mesh is ticked, at full Retina resolution.

## Changes
- `view/overlay.js`: each mesh tracks which of its 4 layers are ticked and loaded; `mesh.visible` only when
  at least one is both (`isChunkNeeded` in `overlayPixels.js`, testable without Three.js).
- `precompileMeshes`: after the normal map, briefly show all overlay meshes and `renderer.compile`,
  so hiding them does not move shader compilation to the first tick.
- `settings.js` `RENDER.maxPixelRatio: 1.5`, used in `view/globe.js`.

## Later (not now)
Render on demand (camera fly-to and async loads must request redraws), cache rich-cell thresholds and
unit vectors for the search.
