import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, startRenderLoop } from "./view/globe.js";
import { createOverlay, setOverlayVisible } from "./view/overlay.js";
import { connectDebug, connectLayerDebug } from "./debug/logState.js";

const IS_DEBUG = false;

const IRON_LAYER = {
  datasetName: "iron",
  colour: "#B7410E",
  toggleId: "iron-toggle",
};

function showError(message) {
  const errorElement = document.getElementById("error");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function connectToggle(layer, overlay) {
  const checkbox = document.getElementById(layer.toggleId);
  checkbox.addEventListener("change", () => {
    setOverlayVisible(overlay, checkbox.checked);
  });
}

async function addLayer(globe, layer) {
  const grid = await loadDataset(layer.datasetName);
  const overlay = createOverlay(globe, grid, layer.colour);
  connectToggle(layer, overlay);
  if (IS_DEBUG) connectLayerDebug(layer, grid);
}

async function main() {
  const container = document.getElementById("globe");
  if (!container) {
    console.error('Could not start: no element with id "globe" in main.html.');
    return;
  }

  const globe = createGlobe(container);
  if (IS_DEBUG) connectDebug(globe);
  startRenderLoop(globe);

  try {
    await addLayer(globe, IRON_LAYER);
  } catch (error) {
    console.error(error);
    showError(`The iron layer could not be shown. ${error.message}`);
  }
}

main();
