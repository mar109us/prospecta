# Settings file

## Context
Tunable values were spread over many files. Collect every *setting* (something you'd tweak) in one `settings.js`, one object per category. Behaviour unchanged.

## Categories (settings.js)
- `DEBUG`: isEnabled
- `CAMERA`: fov, startDistance, minDistance, maxDistance, rotateSpeedPerAltitude, zoomSpeedPerAltitude
- `MOON`: widthSegments, heightSegments, heightExaggeration
- `LIGHTS`: sunIntensity, sunDirection, ambientIntensity
- `TEXTURES`: moonColourUrl, normalMapUrl
- `RESOURCES`: opacity, layers (iron, silicon)
- `RESOURCE_BANDS`: bandCount, baseCurvePower, maxNoiseRatio, errorsPerBand
- `SLOPE`: maxDegrees, thresholds, colours, fillOpacity, dotSpacingDeg, dotRadiusDeg, dotOpacity

## Not moved
Fixed facts stay in their code: `MOON_RADIUS_KM`, `MAX_LAYERS`, `NORMAL_MAP_BAKED_STRENGTH`, scene `MOON_RADIUS = 1`; wiring like slope checkbox ids. Python converters keep their own constants.

## Files
`settings.js` (new); `main.js`, `view/globe.js`, `view/overlay.js`, `view/layerBands.js`, `view/slopeOverlay.js` import from it.

## Defaults
Layer on/off defaults (`isOnByDefault`, `SLOPE.isFillOnByDefault`, `SLOPE.isDotsOnByDefault`) and open panel sections (`PANEL.openCategories`) moved from HTML attributes into settings. `applyDefaultToggles` applies them at startup; clashing fill defaults: the later one wins.
