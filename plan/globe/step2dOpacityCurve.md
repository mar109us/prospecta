# Step 2d — Ease-in-out opacity curve for the iron overlay

## Context
With linear opacity (`value / max`) mid-iron areas are already half visible, so the richest spots don't stand out. Add an ease-in-out curve so low iron stays faint, high iron stays strong, and the middle changes fast. Display only: `iron.json` and future scoring are unchanged.

## Decisions (agreed)
- Ease-in-out, power fixed at 2 ("easeInOutQuad"):
  - `t < 0.5` → `2 × t²`
  - otherwise → `1 − 2 × (1 − t)²`
- Scale starts at the map's min: `t = (value − min) / (max − min)` → lowest iron (1.80 wt%) fully transparent, richest (28.18) fully opaque.
- `null` stays transparent; if `max === min` every valid cell is fully opaque (avoids dividing by 0).

## Files
| File | Change |
|---|---|
| `view/overlayPixels.js` | new `easeInOut(t)`; `valueToAlpha(value, minValue, maxValue)` uses it; `buildOverlayPixels` passes `grid.min` and `grid.max` |
| `tests/overlayPixelsTests.js` | update to new signature; tests: "min iron is transparent", "max iron is fully opaque", "half iron is half opaque", "quarter iron is eased down to 12.5%" (alpha 32), "null is transparent", "flat map is fully opaque" |
| `plan/globe/step2dOpacityCurve.md` | save this plan |

## Verification
- `tests/tests.html` via Live Server (or `node tests/overlayPixelsTests.js`) → all PASS.
- Reload `main.html` (Cmd+Shift+R) → highlands nearly clear, maria cores clearly rust, sharper edge between them.

## Update
Switched from ease-in-out to plain ease-in (`t²`) after viewing: richest cores should stand out more. Half iron = 25% opacity, quarter = 6.25%.
