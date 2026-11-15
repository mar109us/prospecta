function slopeFunctions(thresholdCount) {
  return `
#define SLOPE_THRESHOLD_COUNT ${thresholdCount}
uniform float maxSlope;
uniform float slopeThresholds[SLOPE_THRESHOLD_COUNT];
uniform vec3 slopeColours[SLOPE_THRESHOLD_COUNT + 1];
uniform float showFlat;
uniform float showDots;
uniform float flatLimitDeg;
uniform vec3 flatColour;
uniform float flatOpacity;
uniform float dotRadiusDeg;
uniform float dotSpacingDeg;
uniform float dotOpacity;
uniform float dotMinOpacity;
uniform float showFocus;
uniform vec3 focusCentre;
uniform float focusRadiusAngle;
uniform vec3 focusColour;
uniform float focusFillOpacity;
uniform float focusRingWidthPx;
`;
}

const SLOPE_MAP_FRAGMENT = `
  float slopeDegrees = texture2D(map, vMapUv).r * maxSlope;
  float edgeWidth = max(fwidth(slopeDegrees), 0.0001);
  float flatStrength = 1.0 - smoothstep(flatLimitDeg - edgeWidth, flatLimitDeg, slopeDegrees);
  flatStrength *= showFlat * flatOpacity;

  float lat = (vMapUv.y - 0.5) * 180.0;
  float lon = vMapUv.x * 360.0;
  float degreesPerPixel = max(fwidth(lat), 0.0001);

  float rowLat = floor(lat / dotSpacingDeg + 0.5) * dotSpacingDeg;
  float dotsInRow = max(1.0, floor(360.0 * cos(radians(rowLat)) / dotSpacingDeg + 0.5));
  float columnSpacing = 360.0 / dotsInRow;
  float dotLon = floor(lon / columnSpacing + 0.5) * columnSpacing;
  vec2 offsetDeg = vec2((lon - dotLon) * cos(radians(lat)), lat - rowLat);
  float distanceDeg = length(offsetDeg);

  vec2 dotCentreUv = vec2(dotLon / 360.0, rowLat / 180.0 + 0.5);
  float dotSlope = texture2D(map, dotCentreUv).r * maxSlope;

  vec3 dotColour = slopeColours[1];
  float dotBand = 1.0;
  for (int band = 1; band < SLOPE_THRESHOLD_COUNT; band++) {
    if (dotSlope >= slopeThresholds[band]) {
      dotColour = slopeColours[band + 1];
      dotBand = float(band + 1);
    }
  }
  float steepness = (dotBand - 1.0) / float(SLOPE_THRESHOLD_COUNT - 1);
  float bandOpacity = mix(dotMinOpacity, dotOpacity, steepness);

  float dotStrength = 1.0 - smoothstep(dotRadiusDeg - degreesPerPixel, dotRadiusDeg + degreesPerPixel, distanceDeg);
  if (dotSlope < slopeThresholds[0]) dotStrength = 0.0;
  dotStrength *= showDots * bandOpacity;

  float latRadians = radians(lat);
  float lonRadians = radians(lon - 180.0);
  vec3 direction = vec3(cos(latRadians) * cos(lonRadians), cos(latRadians) * sin(lonRadians), sin(latRadians));
  float angleToFocus = acos(clamp(dot(direction, focusCentre), -1.0, 1.0));
  float anglePerPixel = max(fwidth(angleToFocus), 0.000001);
  float insideFocus = 1.0 - smoothstep(focusRadiusAngle - anglePerPixel, focusRadiusAngle, angleToFocus);
  float isFlatHere = 1.0 - smoothstep(flatLimitDeg - edgeWidth, flatLimitDeg, slopeDegrees);
  float ringDistancePx = abs(angleToFocus - focusRadiusAngle) / anglePerPixel;
  float ring = 1.0 - smoothstep(focusRingWidthPx - 0.5, focusRingWidthPx + 0.5, ringDistancePx);
  float focusStrength = max(insideFocus * isFlatHere * focusFillOpacity, ring) * showFocus;

  float dotShare = dotStrength / max(dotStrength + flatStrength, 0.0001);
  vec3 colour = mix(flatColour, dotColour, dotShare);
  colour = mix(colour, focusColour, focusStrength);
  diffuseColor.rgb *= colour;
  diffuseColor.a = max(max(flatStrength, dotStrength), focusStrength);
`;

export function applySlopeShader(material, uniforms, thresholdCount) {
  material.onBeforeCompile = (shader) => {
    for (const name in uniforms) {
      shader.uniforms[name] = uniforms[name];
    }
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${slopeFunctions(thresholdCount)}\nvoid main() {`)
      .replace("#include <map_fragment>", SLOPE_MAP_FRAGMENT);
  };
}
