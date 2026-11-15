import { findLandingSpots } from "../data/landingSpots.js";
import { focusOnSpot } from "../view/spotFocus.js";
import { latLonToScenePosition } from "../view/terrainMath.js";
import { createMarkerGroup, showMarkers, updateMarkerVisibility } from "../view/markers.js";
import { createRouteGroups, showRoutes, updateRoutes } from "../view/routes.js";
import { connectSearchPanel } from "../view/searchPanel.js";
import { connectMarkerPicking } from "../view/markerPicking.js";
import { setFocus } from "../view/slopeOverlay.js";
import { partIndices } from "../data/layerParts.js";
import { logLandingSpots } from "../debug/logState.js";
import { DEBUG, LANDING, MOON, RESOURCES, SLOPE } from "../settings.js";

function loadedGrids(loaded, index) {
  const indices = [index];
  for (const partIndex of partIndices(RESOURCES.layers, RESOURCES.layers[index].datasetName)) {
    indices.push(partIndex);
  }

  const grids = [];
  for (const layerIndex of indices) {
    const grid = loaded.resourceGrids[layerIndex];
    if (!grid) return null;
    grids.push(grid);
  }
  return grids;
}

function tickedResources(loaded) {
  const ticked = [];
  const stillLoading = [];
  for (let index = 0; index < RESOURCES.layers.length; index++) {
    const layer = RESOURCES.layers[index];
    if (layer.partOf) continue;
    const checkbox = document.getElementById(layer.toggleId);
    if (!checkbox.checked) continue;

    const grids = loadedGrids(loaded, index);
    if (!grids) {
      stillLoading.push(layer.label);
      continue;
    }
    ticked.push({
      name: layer.datasetName,
      grids: grids,
    });
  }
  return {
    ticked: ticked,
    stillLoading: stillLoading,
  };
}

function markerPosition(group, spot) {
  for (const marker of group.children) {
    if (marker.userData.spot === spot) return marker.position;
  }
  return latLonToScenePosition(spot.lat, spot.lon, 1);
}

function selectSpot(search, spot) {
  focusOnSpot(search.globe, markerPosition(search.markerGroup, spot));
  showRoutes(search.routeGroups, spot, RESOURCES.layers, search.loaded.elevation, MOON.heightExaggeration);
  if (search.slopeOverlay) setFocus(search.slopeOverlay, spot);
}

function runSearch(search) {
  const resources = tickedResources(search.loaded);
  const resourceGrids = resources.ticked;
  if (!search.loaded.slope) {
    return {
      spots: [],
      message: "Cannot search: the slope data did not load.",
    };
  }
  if (resources.stillLoading.length > 0) {
    return {
      spots: [],
      message: `Still loading: ${resources.stillLoading.join(", ")}. Try again in a moment.`,
    };
  }
  if (resourceGrids.length === 0) {
    return {
      spots: [],
      message: "Tick at least one resource first.",
    };
  }

  const spots = findLandingSpots({
    resourceGrids: resourceGrids,
    slopeGrid: search.loaded.slope,
    flatLimitDeg: SLOPE.flatLimitDeg,
    settings: LANDING,
  });
  showMarkers(search.markerGroup, spots, search.loaded.elevation, MOON.heightExaggeration);
  if (search.slopeOverlay) setFocus(search.slopeOverlay, null);
  if (LANDING.isFlyToBestOnSearch && spots.length > 0) selectSpot(search, spots[0]);
  if (DEBUG.isEnabled) logLandingSpots(spots);

  if (spots.length === 0) {
    return {
      spots: spots,
      message: `No area with at least ${Math.round(LANDING.minFlatShare * 100)}% flat ground can reach all ticked resources within ${LANDING.maxDriveSlopeDeg}° slopes.`,
    };
  }
  return {
    spots: spots,
    message: "",
  };
}

export function connectLandingSearch(globe, loaded, slopeOverlay) {
  const search = {
    globe: globe,
    loaded: loaded,
    slopeOverlay: slopeOverlay,
    markerGroup: createMarkerGroup(globe),
    routeGroups: createRouteGroups(globe),
  };

  globe.frameCallbacks.push(() => updateMarkerVisibility(search.markerGroup, globe.camera));
  globe.frameCallbacks.push(() => updateRoutes(search.routeGroups, globe.camera));
  connectSearchPanel(
    () => runSearch(search),
    (spot) => selectSpot(search, spot),
  );
  connectMarkerPicking(globe, search.markerGroup, (spot) => selectSpot(search, spot));
}
