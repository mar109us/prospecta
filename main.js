import { loadDataset } from "./data/datasetLoader.js";
import { createGlobe, startRenderLoop } from "./view/globe.js";
import { applyElevation } from "./view/terrain.js";
import { applyMoonTexture, applyNormalMap, NORMAL_MAP_BAKED_STRENGTH } from "./view/moonTexture.js";
import { connectDetail } from "./view/detailLoader.js";
import { connectFirstPerson } from "./view/firstPerson.js";
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
import { connectPanelToggle } from "./view/panelToggle.js";
import { drawFlatLegend, drawSlopeLegend } from "./view/legend.js";
import { createResourceLayers, resourceToggles } from "./app/resourceLayers.js";
import { precompileMeshes } from "./view/overlay.js";
import { connectLandingSearch } from "./app/search.js";
import { createSunlightLayer, sunlightToggle } from "./app/sunlightLayer.js";
import { connectDebug } from "./debug/logState.js";
import { connectFirstPersonHud } from "./debug/firstPersonHud.js";
import { connectCraterJump } from "./debug/craterJump.js";
import { DEBUG, DETAIL, MOON, RESOURCES, SLOPE, SUNLIGHT, TEXTURES } from "./settings.js";

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

function buildToggles(resources, slopeOverlay, sunlight) {
  let toggles = [];
  if (resources) toggles = resourceToggles(resources);
  if (sunlight) toggles.push(sunlightToggle(sunlight));
  if (slopeOverlay) {
    const setFlatOnlyVisible = (isVisible) => setFlatVisible(slopeOverlay, isVisible);
    const setDotsVisible = (isVisible) => setSlopeDotsVisible(slopeOverlay, isVisible);
    toggles.push(createToggle(FLAT_LAYER, setFlatOnlyVisible));
    toggles.push(createToggle(SLOPE_DOTS_LAYER, setDotsVisible));
  }
  return toggles;
}

function overlayMeshes(overlays) {
  const meshes = [];
  for (const overlay of overlays) {
    if (!overlay) continue;
    for (const mesh of overlay.meshes) {
      meshes.push(mesh);
    }
  }
  return meshes;
}

function overlayMaterials(overlays) {
  const materials = [];
  for (const mesh of overlayMeshes(overlays)) {
    materials.push(mesh.material);
  }
  return materials;
}

async function addDetail(globe, loaded, overlays) {
  if (!DETAIL.isEnabled) return;
  if (!loaded.elevation) {
    console.warn("Detail tiles are off because the terrain did not load.");
    return;
  }
  if (!globe.moon.material.map) {
    console.warn("Detail tiles are off because the Moon texture did not load.");
    return;
  }
  const context = {
    folderUrl: DETAIL.folderUrl,
    coarseGrid: loaded.elevation,
    coarseMesh: {
      width: MOON.widthSegments,
      height: MOON.heightSegments,
      normals: globe.moon.geometry.attributes.normal.array,
    },
    featherDeg: DETAIL.featherDeg,
    exaggeration: MOON.heightExaggeration,
    normalStrength: MOON.heightExaggeration / NORMAL_MAP_BAKED_STRENGTH,
    blendVertices: DETAIL.edgeBlendVertices,
    overlayMeshes: overlayMeshes(overlays),
  };
  try {
    await connectDetail(globe, context, showError);
  } catch (error) {
    console.warn(`Detail tiles are off. ${error.message}`);
  }
}

async function main() {
  const container = document.getElementById("globe");
  if (!container) {
    console.error('Could not start: no element with id "globe" in main.html.');
    return;
  }

  buildResourceOptions("resource-options", RESOURCE_LAYERS);
  connectPanelToggle({
    buttonId: "panel-toggle",
    panelId: "resource-panel",
  });
  colourToggleRow(FLAT_LAYER.toggleId, SLOPE.flatColour);
  colourToggleRow(SLOPE_DOTS_LAYER.toggleId, SLOPE.colours[SLOPE.colours.length - 1]);
  colourToggleRow(SUNLIGHT.toggleId, SUNLIGHT.colour);
  drawFlatLegend("flat-legend");
  drawSlopeLegend("slope-dots-legend");

  const globe = createGlobe(container);
  const loaded = {
    elevation: null,
    slope: null,
    resourceGrids: [],
  };
  if (DEBUG.isEnabled) connectDebug(globe);
  if (DEBUG.isEnabled) connectFirstPersonHud(globe);
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
  connectFirstPerson(globe, loaded.elevation);
  if (DEBUG.isEnabled) connectCraterJump(globe, loaded.elevation);

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

  let sunlight = null;
  try {
    sunlight = createSunlightLayer(globe, showError);
  } catch (error) {
    console.error(error);
    showError(`The sunlight layer could not be shown. ${error.message}`);
  }

  const toggles = buildToggles(resources, slopeOverlay, sunlight);
  applyDefaultToggles(toggles);
  connectCategoryToggles(toggles);
  connectClearButton("clear-resources", toggles, "resources");

  connectLandingSearch(globe, loaded, slopeOverlay);

  let resourceOverlay = null;
  if (resources) resourceOverlay = resources.overlay;
  let sunlightOverlay = null;
  if (sunlight) sunlightOverlay = sunlight.overlay;
  const overlays = [resourceOverlay, slopeOverlay, sunlightOverlay];

  try {
    await applyNormalMap(globe, overlayMaterials(overlays), TEXTURES.normalMapUrl, MOON.heightExaggeration);
  } catch (error) {
    console.error(error);
    showError(`The normal map could not be loaded from ${TEXTURES.normalMapUrl}.`);
  }
  precompileMeshes(globe, overlayMeshes(overlays));
  await addDetail(globe, loaded, overlays);
}

main();
