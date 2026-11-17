import * as THREE from "three";

const VERTEX_PARS = `
attribute vec3 coarseNormal;
varying vec3 vCoarseNormal;
`;

const VERTEX_NORMAL = `
#include <defaultnormal_vertex>
  vCoarseNormal = normalize(normalMatrix * coarseNormal);
`;

const FRAGMENT_PARS = `
uniform sampler2D detailShade;
uniform sampler2D detailMask;
uniform float featherDeg;
uniform sampler2D coarseNormalMap;
uniform vec2 coarseNormalScale;
varying vec3 vCoarseNormal;

float neighbourDetail(float column, float row) {
  if (row < 0.0 || row >= 36.0) return 1.0;
  float wrappedColumn = mod(column + 72.0, 72.0);
  return texture2D(detailMask, vec2((wrappedColumn + 0.5) / 72.0, (row + 0.5) / 36.0)).g;
}

float gapToNeighbourDeg(float direction, float inside) {
  if (direction < -0.5) return inside * 5.0;
  if (direction > 0.5) return (1.0 - inside) * 5.0;
  return 0.0;
}

float tileLookWeight(vec2 uv) {
  float lat = uv.y * 180.0 - 90.0;
  float lonScale = max(cos(radians(lat)), 0.05);
  vec2 cellPosition = vec2(uv.x * 72.0, uv.y * 36.0);
  vec2 cell = floor(cellPosition);
  vec2 inside = cellPosition - cell;

  float coarseAmount = 0.0;
  for (int stepColumn = -1; stepColumn <= 1; stepColumn++) {
    for (int stepRow = -1; stepRow <= 1; stepRow++) {
      if (stepColumn == 0 && stepRow == 0) continue;
      float gapEast = gapToNeighbourDeg(float(stepColumn), inside.x) * lonScale;
      float gapNorth = gapToNeighbourDeg(float(stepRow), inside.y);
      float nearness = 1.0 - smoothstep(0.0, featherDeg, length(vec2(gapEast, gapNorth)));
      float missing = 1.0 - neighbourDetail(cell.x + float(stepColumn), cell.y + float(stepRow));
      coarseAmount = max(coarseAmount, nearness * missing);
    }
  }
  return 1.0 - coarseAmount;
}
`;

const COLOUR_FRAGMENT = `
#include <map_fragment>
  float tileWeight = tileLookWeight(vMapUv);
  float shade = texture2D(detailShade, vNormalMapUv).r * 2.0;
  diffuseColor.rgb *= mix(1.0, shade, tileWeight);
`;

const NORMAL_FRAGMENT = `
#include <normal_fragment_maps>
  vec3 coarseSurface = normalize(vCoarseNormal);
  mat3 coarseTbn = getTangentFrame(-vViewPosition, coarseSurface, vMapUv);
  vec3 coarseMapN = texture2D(coarseNormalMap, vMapUv).xyz * 2.0 - 1.0;
  coarseMapN.xy *= coarseNormalScale;
  vec3 coarseLook = normalize(coarseTbn * coarseMapN);
  normal = normalize(mix(coarseLook, normal, tileWeight));
`;

function flatNormalTexture() {
  const pixels = new Uint8Array([128, 128, 255, 255]);
  const texture = new THREE.DataTexture(pixels, 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

const FLAT_NORMAL = flatNormalTexture();

export function createTileMaterial(textures, surface) {
  const material = new THREE.MeshStandardMaterial({
    map: surface.colourMap,
    normalMap: textures.normal,
    roughness: 1,
    transparent: true,
    opacity: 0,
    polygonOffset: true,
    polygonOffsetFactor: -0.5,
    polygonOffsetUnits: -0.5,
  });
  material.normalScale.set(surface.normalStrength, surface.normalStrength);

  let coarseNormalMap = surface.coarseNormalMap;
  if (!coarseNormalMap) coarseNormalMap = FLAT_NORMAL;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.detailShade = {
      value: textures.shade,
    };
    shader.uniforms.detailMask = surface.detailMask;
    shader.uniforms.featherDeg = {
      value: surface.featherDeg,
    };
    shader.uniforms.coarseNormalMap = {
      value: coarseNormalMap,
    };
    shader.uniforms.coarseNormalScale = {
      value: surface.coarseNormalScale,
    };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", `${VERTEX_PARS}\nvoid main() {`)
      .replace("#include <defaultnormal_vertex>", VERTEX_NORMAL);
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${FRAGMENT_PARS}\nvoid main() {`)
      .replace("#include <map_fragment>", COLOUR_FRAGMENT)
      .replace("#include <normal_fragment_maps>", NORMAL_FRAGMENT);
  };
  return material;
}
