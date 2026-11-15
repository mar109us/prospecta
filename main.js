import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, HEIGHT_EXAGGERATION, startRenderLoop } from "./view/globe.js";
import { createOverlay, setLayerVisible } from "./view/overlay.js";
import { applyElevation } from "./view/terrain.js";
import { applyMoonTexture, applyNormalMap } from "./view/moonTexture.js";
import { createSlopeOverlay, setSlopeVisible } from "./view/slopeOverlay.js";
import { connectCategoryToggles, createToggle } from "./view/layerToggles.js";
import { connectDebug, connectLayerDebug } from "./debug/logState.js";

const IS_DEBUG = false;
const MOON_TEXTURE_URL = "assets/textures/moonColour8k.jpg";
const NORMAL_MAP_URL = "assets/textures/moonNormal16.png";

const RESOURCE_LAYERS = [
  {
    datasetName: "iron",
    colour: "#B7410E",
    toggleId: "iron-toggle",
    category: "resources",
  },
  {
    datasetName: "silicon",
    colour: "#2F7FD8",
    toggleId: "silicon-toggle",
    category: "resources",
  },
];

const SLOPE_LAYER = {
  datasetName: "slope",
  toggleId: "slope-toggle",
  category: "terrain",
};

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

async function addTerrain(globe) {
  const elevation = await loadDataset("elevation");
  applyElevation(globe.moon.geometry, elevation, HEIGHT_EXAGGERATION);
}

async function addResourceLayers(globe) {
  const grids = await loadGrids(RESOURCE_LAYERS);
  return createOverlay(globe, RESOURCE_LAYERS, grids);
}

async function addSlopeLayer(globe) {
  const grid = await loadDataset(SLOPE_LAYER.datasetName);
  return createSlopeOverlay(globe, grid);
}

function buildToggles(resourceOverlay, slopeOverlay) {
  const toggles = [];
  if (resourceOverlay) {
    for (let index = 0; index < RESOURCE_LAYERS.length; index++) {
      const setVisible = (isVisible) => setLayerVisible(resourceOverlay, index, isVisible);
      toggles.push(createToggle(RESOURCE_LAYERS[index], setVisible));
    }
  }
  if (slopeOverlay) {
    const setVisible = (isVisible) => setSlopeVisible(slopeOverlay, isVisible);
    toggles.push(createToggle(SLOPE_LAYER, setVisible));
  }
  return toggles;
}

function overlayMaterials(overlays) {
  const materials = [];
  for (const overlay of overlays) {
    if (overlay) materials.push(overlay.mesh.material);
  }
  return materials;
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

  let resourceOverlay = null;
  try {
    resourceOverlay = await addResourceLayers(globe);
  } catch (error) {
    console.error(error);
    showError(`The resource layers could not be shown. ${error.message}`);
  }

  let slopeOverlay = null;
  try {
    slopeOverlay = await addSlopeLayer(globe);
  } catch (error) {
    console.error(error);
    showError(`The slope layer could not be shown. ${error.message}`);
  }

  connectCategoryToggles(buildToggles(resourceOverlay, slopeOverlay));

  try {
    const materials = overlayMaterials([resourceOverlay, slopeOverlay]);
    await applyNormalMap(globe, materials, NORMAL_MAP_URL, HEIGHT_EXAGGERATION);
  } catch (error) {
    console.error(error);
    showError(`The normal map could not be loaded from ${NORMAL_MAP_URL}.`);
  }
}

main();
