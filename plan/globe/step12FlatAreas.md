# Step 12 — "Flat areas only" filter

## Context
First step towards landing spots: show where the ground is flat enough for a vehicle or a base. The solid slope colour fill is removed; slope dots stay.

## Decisions
- Flat = slope below `SLOPE.flatLimitDeg` (default 5°). Apollo LM tolerated ~12°, the rover climbed ~20–25°; bases want a few degrees. Our ~2 km slopes are smoother than metre-scale reality, so this marks candidate regions.
- Flat ground tinted `SLOPE.flatColour` (green) at `SLOPE.flatOpacity` (0.45), anti-aliased edge.
- Not a clashing fill: iron/silicon stay visible underneath.

## Files
`settings.js` (flatLimitDeg, flatColour, flatOpacity, isFlatOnByDefault; fill settings removed), `view/slopeShader.js` (fill code removed, flat tint added), `view/slopeOverlay.js` (`setFlatVisible`), `main.js`, `main.html` ("Flat areas only").
