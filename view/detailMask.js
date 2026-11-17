import * as THREE from "three";
import { maskCells } from "./detailMath.js";

const COLUMNS = 72;
const ROWS = 36;
const OVERLAP_DEG = 0.02;

export const MASK_PARS = `
#if defined( USE_DETAIL_MASK ) && defined( USE_MAP )
uniform sampler2D detailMask;
#endif
`;

export const MASK_DISCARD = `
#if defined( USE_DETAIL_MASK ) && defined( USE_MAP )
  if (texture2D(detailMask, vMapUv).r > 0.5) discard;
#endif
`;

export const MASK_DISCARD_WITH_OVERLAP = `
#if defined( USE_DETAIL_MASK ) && defined( USE_MAP )
  vec2 overlapEast = vec2(${OVERLAP_DEG / 360}, 0.0);
  vec2 overlapNorth = vec2(0.0, ${OVERLAP_DEG / 180});
  float maskedAround = texture2D(detailMask, vMapUv + overlapEast).r
    * texture2D(detailMask, vMapUv - overlapEast).r
    * texture2D(detailMask, vMapUv + overlapNorth).r
    * texture2D(detailMask, vMapUv - overlapNorth).r;
  if (maskedAround > 0.5) discard;
#endif
`;

export function createDetailMask() {
  const pixels = new Uint8Array(COLUMNS * ROWS * 4);
  const texture = new THREE.DataTexture(pixels, COLUMNS, ROWS, THREE.RGBAFormat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return {
    pixels: pixels,
    texture: texture,
    uniform: {
      value: texture,
    },
  };
}

export function useDetailMask(material) {
  material.defines.USE_DETAIL_MASK = "";
}

export function setMaskTiles(mask, tileLooks) {
  mask.pixels.fill(0);
  for (const tileLook of tileLooks) {
    let masked = 0;
    if (tileLook.isMasked) masked = 255;
    for (const cell of maskCells(tileLook.tile)) {
      const index = (cell.row * COLUMNS + cell.column) * 4;
      mask.pixels[index] = masked;
      mask.pixels[index + 1] = Math.round(tileLook.opacity * 255);
    }
  }
  mask.texture.needsUpdate = true;
}
