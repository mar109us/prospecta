import * as THREE from "three";

const NORMAL_MAP_BAKED_STRENGTH = 4;

async function loadTexture(globe, url, colorSpace) {
  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync(url);
  texture.colorSpace = colorSpace;
  texture.anisotropy = globe.renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function setNormalMap(material, texture, strength) {
  material.normalMap = texture;
  material.normalScale.set(strength, strength);
  material.needsUpdate = true;
}

export async function applyMoonTexture(globe, url) {
  const texture = await loadTexture(globe, url, THREE.SRGBColorSpace);
  const material = globe.moon.material;
  material.map = texture;
  material.color.set("white");
  material.needsUpdate = true;
}

export async function applyNormalMap(globe, overlay, url, exaggeration) {
  const texture = await loadTexture(globe, url, THREE.NoColorSpace);
  const strength = exaggeration / NORMAL_MAP_BAKED_STRENGTH;

  setNormalMap(globe.moon.material, texture, strength);
  if (overlay) setNormalMap(overlay.mesh.material, texture, strength);
}
