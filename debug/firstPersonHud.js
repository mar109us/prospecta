import { headingDegrees } from "../view/firstPersonMath.js";
import { scenePositionToLatLon } from "../view/terrainMath.js";

function hudLines(walker) {
  const latLon = scenePositionToLatLon(walker.up.x, walker.up.y, walker.up.z);
  return [
    `lat       ${latLon.lat.toFixed(3)}°`,
    `lon       ${latLon.lon.toFixed(3)}°`,
    `heading   ${headingDegrees(walker).toFixed(1)}°`,
    `ground    ${walker.groundKm.toFixed(2)} km`,
    `odometer  ${walker.odometerKm.toFixed(2)} km`,
  ];
}

function updateHud(hud, walker) {
  if (!walker) {
    hud.hidden = true;
    return;
  }
  hud.hidden = false;
  hud.textContent = hudLines(walker).join("\n");
}

export function connectFirstPersonHud(globe) {
  const hud = document.createElement("pre");
  hud.className = "debug-hud";
  hud.hidden = true;
  document.body.appendChild(hud);
  globe.frameCallbacks.push(() => updateHud(hud, globe.firstPerson));
}
