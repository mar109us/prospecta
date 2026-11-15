import { findLandingSpots } from "../data/landingSpots.js";
import { flyToSpot } from "../view/globe.js";
import { createMarkerGroup, showMarkers, updateMarkerVisibility } from "../view/markers.js";
import { createRouteGroups, showRoutes, updateRoutes } from "../view/routes.js";
import { connectSearchPanel } from "../view/searchPanel.js";
import { connectMarkerPicking } from "../view/markerPicking.js";
import { logLandingSpots } from "../debug/logState.js";
import { DEBUG, LANDING, MOON, RESOURCES, SLOPE } from "../settings.js";

function tickedResources(loaded) {
  const ticked = [];
  for (let index = 0; index < loaded.resourceGrids.length; index++) {
    const layer = RESOURCES.layers[index];
    const checkbox = document.getElementById(layer.toggleId);
    if (!checkbox.checked) continue;
    ticked.push({
      name: layer.datasetName,
      grid: loaded.resourceGrids[index],
    });
  }
  return ticked;
}

function selectSpot(search, spot) {
  flyToSpot(search.globe, spot.lat, spot.lon);
  showRoutes(search.routeGroups, spot, RESOURCES.layers, search.loaded.elevation, MOON.heightExaggeration);
}

function runSearch(search) {
  const resourceGrids = tickedResources(search.loaded);
  if (!search.loaded.slope) {
    return {
      spots: [],
      message: "Cannot search: the slope data did not load.",
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
  if (LANDING.isFlyToBestOnSearch && spots.length > 0) selectSpot(search, spots[0]);
  if (DEBUG.isEnabled) logLandingSpots(spots);

  if (spots.length === 0) {
    return {
      spots: spots,
      message: `No flat area can reach all ticked resources within ${LANDING.maxDriveSlopeDeg}° slopes.`,
    };
  }
  return {
    spots: spots,
    message: `Found ${spots.length} flat areas — see the list on the right.`,
  };
}

export function connectLandingSearch(globe, loaded) {
  const search = {
    globe: globe,
    loaded: loaded,
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
