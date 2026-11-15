import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, HEIGHT_EXAGGERATION, startRenderLoop } from "./view/globe.js";
import { createOverlay, setLayerVisible } from "./view/overlay.js";
import { applyElevation } from "./view/terrain.js";
import { applyMoonTexture, applyNormalMap } from "./view/moonTexture.js";
import { connectDebug, connectLayerDebug } from "./debug/logState.js";

const IS_DEBUG = false;
const MOON_TEXTURE_URL = "assets/textures/moonColour8k.jpg";
const NORMAL_MAP_URL = "assets/textures/moonNormal16.png";

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

async function addTerrain(globe) {
  const elevation = await loadDataset("elevation");
  applyElevation(globe.moon.geometry, elevation, HEIGHT_EXAGGERATION);
}

async function addResourceLayers(globe) {
  const grids = await loadGrids(LAYERS);
  const overlay = createOverlay(globe, LAYERS, grids);
  connectToggles(LAYERS, overlay);
  return overlay;
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
    await applyMoonTexture(globe, MOON_TEXTURE_URL);
  } catch (error) {
    console.error(error);
    showError(`The Moon texture could not be loaded from ${MOON_TEXTURE_URL}.`);
  }

  try {
    await addTerrain(globe);
  } catch (error) {
    console.error(error);
    showError(`The terrain could not be shown. ${error.message}`);
  }

  let overlay = null;
  try {
    overlay = await addResourceLayers(globe);
  } catch (error) {
    console.error(error);
    showError(`The resource layers could not be shown. ${error.message}`);
  }

  try {
    await applyNormalMap(globe, overlay, NORMAL_MAP_URL, HEIGHT_EXAGGERATION);
  } catch (error) {
    console.error(error);
    showError(`The normal map could not be loaded from ${NORMAL_MAP_URL}.`);
  }
}

main();
