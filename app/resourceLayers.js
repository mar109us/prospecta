import { loadDataset } from "../data/datasetLoader.js";
import { addLayerGrid, createOverlay, setLayerVisible } from "../view/overlay.js";
import { drawResourceLegend } from "../view/legend.js";
import { createToggle } from "../view/layerToggles.js";
import { partIndices } from "../data/layerParts.js";
import { connectLayerDebug } from "../debug/logState.js";
import { DEBUG, RESOURCES } from "../settings.js";

function setLoadingLabel(layer, isLoading) {
  const label = document.getElementById(`${layer.datasetName}-label`);
  if (!label) return;
  if (isLoading) {
    label.textContent = `${layer.label} (loading…)`;
  } else {
    label.textContent = layer.label;
  }
}

async function loadLayer(state, index) {
  const layer = RESOURCES.layers[index];
  setLoadingLabel(layer, true);
  try {
    const grid = await loadDataset(layer.datasetName);
    addLayerGrid(state.overlay, index, grid);
    drawResourceLegend(layer, grid);
    state.loaded.resourceGrids[index] = grid;
    if (DEBUG.isEnabled) connectLayerDebug(layer, grid);
    return grid;
  } finally {
    setLoadingLabel(layer, false);
  }
}

function ensureLayerLoaded(state, index) {
  if (!state.loadingPromises[index]) state.loadingPromises[index] = loadLayer(state, index);
  return state.loadingPromises[index];
}

function showLayer(state, index, isVisible) {
  setLayerVisible(state.overlay, index, isVisible);
  if (!isVisible) return;

  ensureLayerLoaded(state, index).catch((error) => {
    state.loadingPromises[index] = null;
    console.error(error);
    state.onError(`The ${RESOURCES.layers[index].label} layer could not be loaded. ${error.message}`);
  });
}

function showLayerWithParts(state, index, isVisible) {
  showLayer(state, index, isVisible);
  for (const partIndex of partIndices(RESOURCES.layers, RESOURCES.layers[index].datasetName)) {
    showLayer(state, partIndex, isVisible);
  }
}

export function createResourceLayers(globe, loaded, onError) {
  loaded.resourceGrids = [];
  for (let index = 0; index < RESOURCES.layers.length; index++) {
    loaded.resourceGrids.push(null);
  }
  return {
    overlay: createOverlay(globe, RESOURCES.layers),
    loaded: loaded,
    loadingPromises: [],
    onError: onError,
  };
}

export function resourceToggles(state) {
  const toggles = [];
  for (let index = 0; index < RESOURCES.layers.length; index++) {
    const layer = RESOURCES.layers[index];
    if (layer.partOf) continue;
    const setVisible = (isVisible) => showLayerWithParts(state, index, isVisible);
    toggles.push(createToggle(layer, setVisible));
  }
  return toggles;
}
