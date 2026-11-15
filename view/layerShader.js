const LAYER_FUNCTIONS = `
uniform float bandCount;
uniform vec4 layerCurvePowers;
uniform vec3 layerColours[4];
uniform vec4 layerVisible;

float bandStrength(float value, float power) {
  float position = value * bandCount;
  float edgeWidth = fwidth(position);
  float band = floor(position) + smoothstep(1.0 - edgeWidth, 1.0, fract(position));
  band = min(band, bandCount - 1.0);
  float strength = band / (bandCount - 1.0);
  return pow(strength, power);
}
`;

const LAYER_MAP_FRAGMENT = `
  vec4 layerValues = texture2D(map, vMapUv);
  vec4 strengths = vec4(
    bandStrength(layerValues.r, layerCurvePowers.r),
    bandStrength(layerValues.g, layerCurvePowers.g),
    bandStrength(layerValues.b, layerCurvePowers.b),
    bandStrength(layerValues.a, layerCurvePowers.a)
  ) * layerVisible;

  vec3 colourSum = vec3(0.0);
  float strengthSum = 0.0;
  float strongest = 0.0;
  for (int layer = 0; layer < 4; layer++) {
    colourSum += layerColours[layer] * strengths[layer];
    strengthSum += strengths[layer];
    strongest = max(strongest, strengths[layer]);
  }

  if (strengthSum == 0.0) {
    diffuseColor.a = 0.0;
  } else {
    diffuseColor.rgb *= colourSum / strengthSum;
    diffuseColor.a *= strongest;
  }
`;

export function applyLayerShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    for (const name in uniforms) {
      shader.uniforms[name] = uniforms[name];
    }
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${LAYER_FUNCTIONS}\nvoid main() {`)
      .replace("#include <map_fragment>", LAYER_MAP_FRAGMENT);
  };
}
