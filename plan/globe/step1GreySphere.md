# Step 1 — Grey Moon in Three.js

## Context
First small step of Prospector (overall plan below, saved to `plan/globe/v1Plan.md`). Goal: prove Three.js runs locally — a grey sphere you can rotate and zoom. No data, texture or heightmap yet.

## Files
| File | Why |
|---|---|
| `plan/globe/v1Plan.md` | save the overall plan (CLAUDE.md rule) |
| `plan/globe/step1GreySphere.md` | save this step plan |
| `vendor/three.module.js`, `vendor/three.core.js` | Three.js itself, pinned exact version from jsDelivr (module.js imports core.js) |
| `vendor/addons/controls/OrbitControls.js` | drag-to-rotate / scroll-to-zoom, from Three.js's own addons |
| `main.html` | `<main>` holding the canvas; an **import map** so `import "three"` points at `vendor/` |
| `style.css` | canvas fills the window, black background |
| `main.js` | entry: calls `createGlobe()` and starts the render loop |
| `view/globe.js` | small functions: `createScene`, `createCamera`, `createRenderer`, `createLights`, `createMoon`, `createControls`, `handleResize` |
| `debug/logState.js` | logs camera position (`console.table`) when the user stops dragging |

## Details
- Units: 1 = Moon radius (real distances come in a later step).
- Moon: `SphereGeometry(1, 128, 64)` + grey `MeshStandardMaterial`; one directional "sun" light + soft ambient light so the sphere looks round.
- Camera at distance 3, OrbitControls with min/max zoom so you can't go inside the Moon.
- New concepts, explained in chat when used: `import`/`export`, import maps, classes/`new`, `requestAnimationFrame`, `addEventListener` (resize).
- No tests this step: nothing calculable yet. Tests start with `geo.js`.

## Verification
Open `main.html` with Live Server → grey shaded sphere; drag rotates, scroll zooms; resizing the window keeps it round; console shows camera position after each drag and no errors.

