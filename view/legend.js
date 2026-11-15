import { curvePower, noiseRatio } from "./layerBands.js";
import { RESOURCE_BANDS, RESOURCES, SLOPE } from "../settings.js";

function hexToRgba(hexColour, alpha) {
  const red = parseInt(hexColour.slice(1, 3), 16);
  const green = parseInt(hexColour.slice(3, 5), 16);
  const blue = parseInt(hexColour.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatValue(value) {
  if (Math.abs(value) >= 100) return `${Math.round(value)}`;
  return value.toFixed(1);
}

function createSwatch(className, background, title) {
  const swatch = document.createElement("span");
  swatch.className = className;
  swatch.style.background = background;
  swatch.title = title;
  return swatch;
}

function createLabel(text) {
  const label = document.createElement("span");
  label.className = "legend__label";
  label.textContent = text;
  return label;
}

function fillLegend(legendId, parts) {
  const legend = document.getElementById(legendId);
  if (!legend) {
    console.error(`Cannot draw legend: no element with id "${legendId}".`);
    return;
  }
  legend.textContent = "";
  for (const part of parts) {
    legend.appendChild(part);
  }
}

export function bandOpacities(grid) {
  const power = curvePower(noiseRatio(grid));
  const opacities = [];
  const lastBand = RESOURCE_BANDS.bandCount - 1;
  for (let band = 0; band <= lastBand; band++) {
    opacities.push(Math.pow(band / lastBand, power) * RESOURCES.opacity);
  }
  return opacities;
}

export function drawResourceLegends(layers, grids) {
  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index];
    const grid = grids[index];
    const parts = [];
    for (const opacity of bandOpacities(grid)) {
      parts.push(createSwatch("legend__swatch", hexToRgba(layer.colour, opacity), `${Math.round(opacity * 100)}% opacity`));
    }
    const unit = grid.unit.split(" ").pop();
    parts.push(createLabel(`${formatValue(grid.displayMin)} – ${formatValue(grid.displayMax)} ${unit}`));
    fillLegend(`${layer.datasetName}-legend`, parts);
  }
}

function slopeBandName(index) {
  const thresholds = SLOPE.thresholds;
  if (index === thresholds.length - 1) return `> ${thresholds[index]}°`;
  return `${thresholds[index]}–${thresholds[index + 1]}°`;
}

export function drawSlopeLegend(legendId) {
  const bandCount = SLOPE.thresholds.length;
  const parts = [];
  for (let index = 0; index < bandCount; index++) {
    const steepness = index / (bandCount - 1);
    const opacity = SLOPE.dotMinOpacity + (SLOPE.dotOpacity - SLOPE.dotMinOpacity) * steepness;
    parts.push(createSwatch("legend__dot", hexToRgba(SLOPE.colours[index + 1], opacity), slopeBandName(index)));
  }
  parts.push(createLabel(`${SLOPE.thresholds[0]}° – ${SLOPE.thresholds[bandCount - 1]}°+`));
  fillLegend(legendId, parts);
}

export function drawFlatLegend(legendId) {
  const parts = [
    createSwatch("legend__swatch", hexToRgba(SLOPE.flatColour, SLOPE.flatOpacity), "Flat ground"),
    createLabel(`< ${SLOPE.flatLimitDeg}° slope`),
  ];
  fillLegend(legendId, parts);
}
