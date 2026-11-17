import * as THREE from "three";

export function addTileOverlays(geometry, normalTexture, overlayMeshes, normalStrength) {
  const clones = [];
  for (const source of overlayMeshes) {
    const material = source.material.clone();
    material.onBeforeCompile = source.material.onBeforeCompile;
    material.normalMap = normalTexture;
    material.normalScale.set(normalStrength, normalStrength);

    const clone = new THREE.Mesh(geometry, material);
    clone.renderOrder = source.renderOrder;
    clone.visible = false;
    source.add(clone);
    clones.push(clone);
  }
  return clones;
}

export function removeTileOverlays(clones) {
  for (const clone of clones) {
    clone.removeFromParent();
    clone.material.dispose();
  }
}
