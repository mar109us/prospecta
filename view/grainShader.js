import * as THREE from "three";
import { GROUND_DETAIL } from "../settings.js";
import { sceneToMetres } from "./firstPersonMath.js";
import { GRAIN_TURN } from "./groundPatchMath.js";

const BUMP_READ = "texture2D( bumpMap,";
const BUMP_READ_COUNT = 3;
const BUMP_SCALE_LINE = "uniform float bumpScale;";
const PIXEL_STEP_X = "normalize( dFdx( surf_pos.xyz ) )";
const PIXEL_STEP_Y = "normalize( dFdy( surf_pos.xyz ) )";

const GRAIN_PARS = `
const float grainMetresPerUnit = float( ${sceneToMetres(1)} );
uniform vec2 grainSecondOffset;
uniform float grainSecondScale;
uniform float grainSecondWeight;
vec4 grainSample( vec2 uv ) {
  vec2 turned = vec2(
    ${GRAIN_TURN.cos} * uv.x - ${GRAIN_TURN.sin} * uv.y,
    ${GRAIN_TURN.sin} * uv.x + ${GRAIN_TURN.cos} * uv.y
  );
  vec2 secondUv = turned * grainSecondScale + grainSecondOffset;
  float first = texture2D( bumpMap, uv ).x;
  float second = texture2D( bumpMap, secondUv ).x;
  return vec4( first * ( 0.5 + second ) + second * grainSecondWeight );
}
`;

export function createGrainUniforms() {
  return {
    grainSecondOffset: {
      value: new THREE.Vector2(0, 0),
    },
    grainSecondScale: {
      value: GROUND_DETAIL.roughness.bigPatchesScale,
    },
    grainSecondWeight: {
      value: GROUND_DETAIL.roughness.bigPatchesStrength,
    },
  };
}

function twoScaleBumpChunk() {
  const chunk = THREE.ShaderChunk.bumpmap_pars_fragment;
  const readCount = chunk.split(BUMP_READ).length - 1;
  if (readCount !== BUMP_READ_COUNT || !chunk.includes(BUMP_SCALE_LINE)) return null;
  if (!chunk.includes(PIXEL_STEP_X) || !chunk.includes(PIXEL_STEP_Y)) return null;
  const twoScale = chunk.replaceAll(BUMP_READ, "grainSample(").replace(BUMP_SCALE_LINE, `${BUMP_SCALE_LINE}\n${GRAIN_PARS}`);
  return twoScale
    .replace(PIXEL_STEP_X, "dFdx( surf_pos.xyz ) * grainMetresPerUnit")
    .replace(PIXEL_STEP_Y, "dFdy( surf_pos.xyz ) * grainMetresPerUnit");
}

export function applyGrainShader(material, uniforms) {
  const bumpChunk = twoScaleBumpChunk();
  if (!bumpChunk) {
    console.error(
      "Two-scale ground grain is off: the three.js bump map shader code is not what view/grainShader.js expects, so the grain will repeat.",
    );
    return;
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grainSecondOffset = uniforms.grainSecondOffset;
    shader.uniforms.grainSecondScale = uniforms.grainSecondScale;
    shader.uniforms.grainSecondWeight = uniforms.grainSecondWeight;
    shader.fragmentShader = shader.fragmentShader.replace("#include <bumpmap_pars_fragment>", bumpChunk);
  };
}
