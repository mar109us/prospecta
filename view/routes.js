import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { elevationToRadius, latLonToScenePosition, scenePositionToLatLon, surfaceElevation } from "./terrainMath.js";
import { isOnNearSide, MARKER_SIZE } from "./markers.js";
import { stackBoxes } from "./labelStack.js";
import { formatValue, layerLabel, shortUnit } from "./text.js";
import { ROUTES } from "../settings.js";

function groundPoint(lat, lon, elevation, exaggeration) {
  let radius = 1;
  if (elevation) radius = elevationToRadius(surfaceElevation(elevation, lat, lon), exaggeration);
  const position = latLonToScenePosition(lat, lon, radius + ROUTES.liftAboveGround);
  return new THREE.Vector3(position.x, position.y, position.z);
}

function dropOntoGround(point, elevation, exaggeration) {
  const latLon = scenePositionToLatLon(point.x, point.y, point.z);
  return groundPoint(latLon.lat, latLon.lon, elevation, exaggeration);
}

function smoothRoutePoints(path, elevation, exaggeration) {
  const points = [];
  for (const step of path) {
    points.push(groundPoint(step.lat, step.lon, elevation, exaggeration));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const smoothPoints = [];
  for (const curvePoint of curve.getPoints(points.length * ROUTES.curvePointsPerStep)) {
    smoothPoints.push(dropOntoGround(curvePoint, elevation, exaggeration));
  }
  return smoothPoints;
}

function createRouteLine(points, colour) {
  const positions = [];
  for (const point of points) {
    positions.push(point.x, point.y, point.z);
  }
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  const material = new LineMaterial({
    color: colour,
    linewidth: ROUTES.lineWidthPx,
    transparent: true,
    depthWrite: false,
  });
  const line = new Line2(geometry, material);
  line.renderOrder = 1;
  return line;
}

function labelText(route) {
  const value = `${formatValue(route.depositValue)} ${shortUnit(route.unit)}`;
  return layerLabel(route.name);
}

function createLabel(text, colour) {
  const element = document.createElement("div");
  element.className = "route-label";
  element.style.borderLeftColor = colour;
  element.textContent = text;
  return element;
}

function colourFor(layers, name) {
  for (const layer of layers) {
    if (layer.datasetName === name) return layer.colour;
  }
  return "white";
}

function clearRoutes(routeGroups) {
  while (routeGroups.lines.children.length > 0) {
    const line = routeGroups.lines.children[0];
    routeGroups.lines.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  }
  routeGroups.labelLayer.textContent = "";
  routeGroups.labels = [];
  routeGroups.markerAnchor = null;
}

export function createRouteGroups(globe) {
  const lines = new THREE.Group();
  globe.scene.add(lines);

  const labelLayer = document.createElement("div");
  labelLayer.className = "route-labels";
  document.body.appendChild(labelLayer);

  return {
    lines: lines,
    labelLayer: labelLayer,
    labels: [],
    markerAnchor: null,
  };
}

export function showRoutes(routeGroups, spot, layers, elevation, exaggeration) {
  clearRoutes(routeGroups);
  routeGroups.markerAnchor = groundPoint(spot.lat, spot.lon, elevation, exaggeration);

  for (const route of spot.routes) {
    const colour = colourFor(layers, route.name);
    if (route.path.length > 1) {
      routeGroups.lines.add(createRouteLine(smoothRoutePoints(route.path, elevation, exaggeration), colour));
    }

    const deposit = route.path[route.path.length - 1];
    const element = createLabel(labelText(route), colour);
    routeGroups.labelLayer.appendChild(element);
    routeGroups.labels.push({
      element: element,
      anchor: groundPoint(deposit.lat, deposit.lon, elevation, exaggeration),
    });
  }
}

function markerBox(anchor, camera, width, height) {
  const screen = anchor.clone().project(camera);
  const distance = anchor.distanceTo(camera.position);
  const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const sizePx = (MARKER_SIZE / viewHeight) * height;
  return {
    x: ((screen.x + 1) / 2) * width - sizePx / 2,
    y: ((1 - screen.y) / 2) * height - sizePx / 2,
    width: sizePx,
    height: sizePx,
  };
}

export function updateRoutes(routeGroups, camera) {
  camera.updateMatrixWorld();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const boxes = [];
  const anchor = routeGroups.markerAnchor;
  if (anchor && isOnNearSide(anchor, camera)) boxes.push(markerBox(anchor, camera, width, height));
  for (const label of routeGroups.labels) {
    label.element.hidden = !isOnNearSide(label.anchor, camera);
    if (label.element.hidden) continue;

    const screen = label.anchor.clone().project(camera);
    boxes.push({
      element: label.element,
      x: ((screen.x + 1) / 2) * width,
      y: ((1 - screen.y) / 2) * height,
      width: label.element.offsetWidth,
      height: label.element.offsetHeight,
    });
  }

  stackBoxes(boxes, ROUTES.labelStackGapPx);
  for (const box of boxes) {
    if (!box.element) continue;
    box.element.style.transform = `translate(${box.x}px, ${box.y}px)`;
  }
}
