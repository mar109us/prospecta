import * as THREE from "three";

const CLICK_TOLERANCE_PX = 5;

function pointerToScreen(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

function markerUnderPointer(event, globe, group, raycaster) {
  raycaster.setFromCamera(pointerToScreen(event, globe.renderer.domElement), globe.camera);
  for (const hit of raycaster.intersectObjects(group.children)) {
    if (hit.object.visible) return hit.object;
  }
  return null;
}

export function connectMarkerPicking(globe, group, onSelect) {
  const canvas = globe.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  let pressX = 0;
  let pressY = 0;

  canvas.addEventListener("pointerdown", (event) => {
    pressX = event.clientX;
    pressY = event.clientY;
  });

  canvas.addEventListener("pointerup", (event) => {
    const movedPx = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (movedPx > CLICK_TOLERANCE_PX) return;

    const marker = markerUnderPointer(event, globe, group, raycaster);
    if (marker) onSelect(marker.userData.spot);
  });

  canvas.addEventListener("pointermove", (event) => {
    const marker = markerUnderPointer(event, globe, group, raycaster);
    if (marker) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "";
    }
  });
}
