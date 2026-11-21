import { CRATERS } from "../settings.js";
import { approachStart, metresToScene } from "../view/firstPersonMath.js";
import { enterFirstPersonAt } from "../view/firstPerson.js";
import { latLonToScenePosition } from "../view/terrainMath.js";

const SELECT_ID = "crater-jump";

function createPicker() {
  const picker = document.createElement("section");
  picker.className = "debug-craters";
  picker.innerHTML = `
    <label for="${SELECT_ID}">Crater</label>
    <select id="${SELECT_ID}"></select>
  `;
  document.body.appendChild(picker);
  return document.getElementById(SELECT_ID);
}

function buildOptions(select) {
  select.innerHTML = `<option value="">jump to…</option>`;
  for (let index = 0; index < CRATERS.list.length; index++) {
    const crater = CRATERS.list[index];
    select.innerHTML += `<option value="${index}">${crater.name} (${crater.diameterKm} km)</option>`;
  }
}

function craterStart(crater) {
  const centreUp = latLonToScenePosition(crater.lat, crater.lon, 1);
  const distanceKm = crater.diameterKm / 2 + CRATERS.approachKm;
  return approachStart(centreUp, metresToScene(distanceKm * 1000));
}

function jumpToCrater(globe, grid, select) {
  const crater = CRATERS.list[select.value];
  select.value = "";
  select.blur();
  if (!crater) return;
  console.table(crater);
  enterFirstPersonAt(globe, grid, craterStart(crater));
}

export function connectCraterJump(globe, grid) {
  if (!grid) {
    console.warn("Crater jump is off because the terrain did not load.");
    return;
  }
  const select = createPicker();
  buildOptions(select);
  select.addEventListener("change", () => jumpToCrater(globe, grid, select));
}
