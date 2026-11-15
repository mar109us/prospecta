import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, startRenderLoop } from "./view/globe.js";
import { createOverlay, setLayerVisible } from "./view/overlay.js";
import { connectDebug, connectLayerDebug } from "./debug/logState.js";

const IS_DEBUG = false;

const LAYERS = [
  {
    datasetName: "iron",
    colour: "#B7410E",
    toggleId: "iron-toggle",
  },
  {
    datasetName: "silicon",
    colour: "#2F7FD8",
    toggleId: "silicon-toggle",
  },
];

function showError(message) {
  const errorElement = document.getElementById("error");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

async function loadGrids(layers) {
  const grids = [];
  for (const layer of layers) {
    const grid = await loadDataset(layer.datasetName);
    grids.push(grid);
    if (IS_DEBUG) connectLayerDebug(layer, grid);
  }
  return grids;
}

function connectToggles(layers, overlay) {
  for (let index = 0; index < layers.length; index++) {
    const checkbox = document.getElementById(layers[index].toggleId);
    checkbox.addEventListener("change", () => {
      setLayerVisible(overlay, index, checkbox.checked);
    });
  }
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
    const grids = await loadGrids(LAYERS);
    const overlay = createOverlay(globe, LAYERS, grids);
    connectToggles(LAYERS, overlay);
  } catch (error) {
    console.error(error);
    showError(`The resource layers could not be shown. ${error.message}`);
  }
}

main();
