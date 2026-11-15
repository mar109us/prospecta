import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, startRenderLoop } from "./view/globe.js";
import { applyElevation } from "./view/terrain.js";
import { applyMoonTexture, applyNormalMap } from "./view/moonTexture.js";
import {
  createSlopeOverlay,
  setFlatVisible,
  setSlopeDotsVisible,
} from "./view/slopeOverlay.js";
import {
  applyDefaultToggles,
  connectCategoryToggles,
  connectClearButton,
  createToggle,
} from "./view/layerToggles.js";
import { buildResourceOptions, colourToggleRow } from "./view/resourcePanel.js";
import { drawFlatLegend, drawSlopeLegend } from "./view/legend.js";
import { createResourceLayers, resourceToggles } from "./app/resourceLayers.js";
import { connectLandingSearch } from "./app/search.js";
import { connectDebug } from "./debug/logState.js";
import { DEBUG, MOON, RESOURCES, SLOPE, TEXTURES } from "./settings.js";

const RESOURCE_LAYERS = RESOURCES.layers;

const SLOPE_DATASET = "slope";

const FLAT_LAYER = {
  toggleId: "flat-toggle",
  category: "terrain",
  isFill: false,
  isOnByDefault: SLOPE.isFlatOnByDefault,
};

const SLOPE_DOTS_LAYER = {
  toggleId: "slope-dots-toggle",
  category: "terrain",
  isFill: false,
  isOnByDefault: SLOPE.isDotsOnByDefault,
};

function showError(message) {
  const errorElement = document.getElementById("error");
  errorElement.textContent = message;
  errorElement.hidden = false;
}


async function addTerrain(globe, loaded) {
  loaded.elevation = await loadDataset("elevation");
  applyElevation(globe.moon.geometry, loaded.elevation, MOON.heightExaggeration);
}


async function addSlopeLayer(globe, loaded) {
  loaded.slope = await loadDataset(SLOPE_DATASET);
  return createSlopeOverlay(globe, loaded.slope);
}

function buildToggles(resources, slopeOverlay) {
  let toggles = [];
  if (resources) toggles = resourceToggles(resources);
  if (slopeOverlay) {
    const setFlatOnlyVisible = (isVisible) => setFlatVisible(slopeOverlay, isVisible);
    const setDotsVisible = (isVisible) => setSlopeDotsVisible(slopeOverlay, isVisible);
    toggles.push(createToggle(FLAT_LAYER, setFlatOnlyVisible));
    toggles.push(createToggle(SLOPE_DOTS_LAYER, setDotsVisible));
  }
  return toggles;
}

function overlayMaterials(overlays) {
  const materials = [];
  for (const overlay of overlays) {
    if (!overlay) continue;
    for (const mesh of overlay.meshes) {
      materials.push(mesh.material);
    }
  }
  return materials;
}

async function main() {
  const container = document.getElementById("globe");
  if (!container) {
    console.error('Could not start: no element with id "globe" in main.html.');
    return;
  }

  buildResourceOptions("resource-options", RESOURCE_LAYERS);
  colourToggleRow(FLAT_LAYER.toggleId, SLOPE.flatColour);
  colourToggleRow(SLOPE_DOTS_LAYER.toggleId, SLOPE.colours[SLOPE.colours.length - 1]);
  drawFlatLegend("flat-legend");
  drawSlopeLegend("slope-dots-legend");

  const globe = createGlobe(container);
  const loaded = {
    elevation: null,
    slope: null,
    resourceGrids: [],
  };
  if (DEBUG.isEnabled) connectDebug(globe);
  startRenderLoop(globe);

  try {
    await applyMoonTexture(globe, TEXTURES.moonColourUrl);
  } catch (error) {
    console.error(error);
    showError(`The Moon texture could not be loaded from ${TEXTURES.moonColourUrl}.`);
  }

  try {
    await addTerrain(globe, loaded);
  } catch (error) {
    console.error(error);
    showError(`The terrain could not be shown. ${error.message}`);
  }

  let resources = null;
  try {
    resources = createResourceLayers(globe, loaded, showError);
  } catch (error) {
    console.error(error);
    showError(`The resource layers could not be shown. ${error.message}`);
  }

  let slopeOverlay = null;
  try {
    slopeOverlay = await addSlopeLayer(globe, loaded);
  } catch (error) {
    console.error(error);
    showError(`The slope layer could not be shown. ${error.message}`);
  }

  const toggles = buildToggles(resources, slopeOverlay);
  applyDefaultToggles(toggles);
  connectCategoryToggles(toggles);
  connectClearButton("clear-resources", toggles, "resources");

  connectLandingSearch(globe, loaded, slopeOverlay);

  try {
    let resourceOverlay = null;
    if (resources) resourceOverlay = resources.overlay;
    const materials = overlayMaterials([resourceOverlay, slopeOverlay]);
    await applyNormalMap(globe, materials, TEXTURES.normalMapUrl, MOON.heightExaggeration);
  } catch (error) {
    console.error(error);
    showError(`The normal map could not be loaded from ${TEXTURES.normalMapUrl}.`);
  }
}

main();
