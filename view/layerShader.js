const STEPPED_MAP_FRAGMENT = `
  vec4 sampledColour = texture2D(map, vMapUv);
  float position = sampledColour.a * stepCount;
  float edgeWidth = fwidth(position);
  float band = floor(position) + smoothstep(1.0 - edgeWidth, 1.0, fract(position));
  band = min(band, stepCount - 1.0);
  float strength = band / (stepCount - 1.0);
  diffuseColor.rgb *= sampledColour.rgb;
  diffuseColor.a *= strength * strength;
`;

export function applySteppedOpacity(material, stepCount) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.stepCount = {
      value: stepCount,
    };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float stepCount;\nvoid main() {")
      .replace("#include <map_fragment>", STEPPED_MAP_FRAGMENT);
  };
}
