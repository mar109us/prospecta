# Step 5 — Smooth noisy data (self-adjusting)

## Context
Silicon's pixel-to-pixel scatter equals its measurement error, so small patches were noise. Average noisy datasets just enough that the remaining noise is small; leave reliable datasets untouched.

## Decisions
- Noise ratio = 2 × median uncertainty / (98th − 2nd percentile), same as the browser.
- Target 0.2. Try averaging 1, 2, 4 … 64 nearest pixels (closest centres on the sphere) until the ratio after smoothing ≤ 0.2; cap 64, warn if not reached.
- Smoothed uncertainty = uncertainty / √N. Always smooth from the original pixels.
- Runs after missing-pixel fill, before subdivision. Counts pixels, so it scales with each dataset's own resolution.

## Result
- Iron: 1 pixel (untouched), noise 0.10.
- Silicon: 32 pixels (~6° radius), noise 0.47 → 0.17, uncertainty ±0.81, display range 36.8–46.1 wt%.

## Caveat
√N assumes independent errors. Lunar Prospector's footprint (~5°) is larger than its 2° pixels, so neighbouring errors are correlated and the real smoothed uncertainty is larger than ±0.81.
