const SLOPE_FUNCTIONS = `
uniform float maxSlope;
uniform vec4 slopeThresholds;
uniform vec3 slopeColours[5];

vec3 slopeColour(float slopeDegrees, float edgeWidth) {
  vec3 colour = slopeColours[0];
  for (int band = 0; band < 4; band++) {
    float threshold = slopeThresholds[band];
    float blend = smoothstep(threshold - edgeWidth, threshold, slopeDegrees);
    colour = mix(colour, slopeColours[band + 1], blend);
  }
  return colour;
}
`;

const SLOPE_MAP_FRAGMENT = `
  float slopeDegrees = texture2D(map, vMapUv).r * maxSlope;
  float edgeWidth = max(fwidth(slopeDegrees), 0.0001);
  diffuseColor.rgb *= slopeColour(slopeDegrees, edgeWidth);
`;

export function applySlopeShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    for (const name in uniforms) {
      shader.uniforms[name] = uniforms[name];
    }
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${SLOPE_FUNCTIONS}\nvoid main() {`)
      .replace("#include <map_fragment>", SLOPE_MAP_FRAGMENT);
  };
}
