import { loadDataset } from "../data/datasetLoader.js";
import { addLayerGrid, createOverlay, setLayerVisible } from "../view/overlay.js";
import { drawResourceLegend } from "../view/legend.js";
import { createToggle } from "../view/layerToggles.js";
import { SUNLIGHT } from "../settings.js";

const LAYER_INDEX = 0;

async function loadSunlight(state) {
  const grid = await loadDataset(SUNLIGHT.datasetName);
  addLayerGrid(state.overlay, LAYER_INDEX, grid, true);
  drawResourceLegend(SUNLIGHT, grid);
  return grid;
}

function showSunlight(state, isVisible) {
  setLayerVisible(state.overlay, LAYER_INDEX, isVisible);
  if (!isVisible) return;

  if (!state.loadingPromise) state.loadingPromise = loadSunlight(state);
  state.loadingPromise.catch((error) => {
    state.loadingPromise = null;
    console.error(error);
    state.onError(`The sunlight layer could not be loaded. ${error.message}`);
  });
}

export function createSunlightLayer(globe, onError) {
  return {
    overlay: createOverlay(globe, [SUNLIGHT]),
    loadingPromise: null,
    onError: onError,
  };
}

export function sunlightToggle(state) {
  const setVisible = (isVisible) => showSunlight(state, isVisible);
  return createToggle(SUNLIGHT, setVisible);
}
