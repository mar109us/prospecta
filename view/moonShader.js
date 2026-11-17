import { MASK_DISCARD_WITH_OVERLAP, MASK_PARS, useDetailMask } from "./detailMask.js";

export function applyMoonMask(material, mask) {
  useDetailMask(material);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.detailMask = mask.uniform;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${MASK_PARS}\nvoid main() {`)
      .replace("#include <map_fragment>", `${MASK_DISCARD_WITH_OVERLAP}\n#include <map_fragment>`);
  };
  material.needsUpdate = true;
}
