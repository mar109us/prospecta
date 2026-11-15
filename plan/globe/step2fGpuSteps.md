# Step 2f — Stepped opacity on the GPU (smooth band edges)

## Context
Stepping each 0.5° cell in JavaScript makes band edges follow the grid → visible staircase. Fix: the texture keeps the **smooth** value, and the graphics card applies the 5 steps per screen pixel after `LinearFilter` has blended the cells. Band edges become smooth curves at any zoom. Look (5 steps, eased 0/6/25/56/100%, rust) stays the same.

## How it works
- Texture alpha = smooth position between min and max: `t = (value − min) / (max − min)` → 0–255. RGB stays rust. `null` → 0.
- `material.onBeforeCompile` (Three.js hook to edit its built-in shader) swaps the `map_fragment` chunk so lighting from `MeshStandardMaterial` is kept:
  ```glsl
  vec4 sampled = texture2D(map, vMapUv);
  float position = sampled.a * stepCount;
  float edgeWidth = fwidth(position);
  float step = floor(position) + smoothstep(1.0 - edgeWidth, 1.0, fract(position));
  step = min(step, stepCount - 1.0);
  float strength = step / (stepCount - 1.0);
  diffuseColor.rgb *= sampled.rgb;
  diffuseColor.a *= strength * strength;
  ```
  `fwidth` = how much `position` changes across one screen pixel → the edge is blended over exactly ~1 pixel (anti-aliased, crisp).

## Files
| File | Change |
|---|---|
| `view/steppedOpacityShader.js` (new) | `applySteppedOpacity(material, stepCount)`: sets `onBeforeCompile`, adds `uniform float stepCount`, swaps the chunk above |
| `view/overlay.js` | `STEP_COUNT = 5` moves here; call `applySteppedOpacity(material, STEP_COUNT)` |
| `view/overlayPixels.js` | remove `STEP_COUNT`, `easeIn`, `valueToStep`, `stepToAlpha`; `valueToAlpha` returns linear `t × 255` |
| `tests/overlayPixelsTests.js` | step tests removed; tests: "min is 0", "max is 255", "half is 128", "null is 0", "flat map is 255", plus existing row-flip + colour tests |
| `plan/globe/step2fGpuSteps.md` | save this plan |

## Verification
- `node tests/overlayPixelsTests.js` / `tests/tests.html` → all PASS.
- Live Server, Cmd+Shift+R → same 5 bands, edges smooth curves, no staircase when zooming in close; checkbox still toggles; no shader errors in console.
