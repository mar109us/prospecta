# Step 4 — Band count from measurement uncertainty

## Context
Silicon's measurement error (±4.6 wt%) is bigger than its band width (~2.5 wt%), so its bands showed noise. Every dataset now gets as many bands as its uncertainty honestly allows, automatically.

## 4a — Converter
- Each dataset has an `uncertainty_column` (error-matrix diagonal; iron 51, silicon 33); pixel uncertainty = √variance × 100 (wt%).
- Missing-pixel fill averages uncertainty too; subdivided quarters keep the parent's uncertainty (interpolation does not improve precision).
- JSON gains `uncertainty` (median) and `uncertainties` (per cell, for future scoring). Files ~2.6–2.8 MB.

## 4b — Browser
- `view/layerBands.js`: `bandCount(grid)` = floor(displayRange / (2 × uncertainty)), clamped 2–5; no uncertainty → 5.
- Shader: `bandStrength(value, bandCount)` with `uniform vec4 layerBandCounts`.
- Result: iron 5 bands, silicon 2 bands.

## 4c — Uncertainty sets the curve, not the band count
4b's 2-band silicon painted half the Moon solid blue (still noise). Now every layer keeps 5 bands; noise only changes how strongly they show.
- `noiseRatio = 2 × uncertainty / displayRange` (capped 0.95; none → 0). Iron ≈ 0.10, silicon ≈ 0.72.
- `curvePower = 2 / (1 − noise)`, `maxOpacity = 1 − noise`.
- Shader: `bandStrength(value, power, ceiling) = pow(band / 4, power) × ceiling`.
- Result: iron ≈ as before (top band 90%), silicon only faint top-band patches (~28%).

## 4c update
Ceiling removed after viewing: steeper curve only (`pow(band / 4, power)`), top band always 100%.
