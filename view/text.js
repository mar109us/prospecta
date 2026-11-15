import { RESOURCES } from "../settings.js";

export function capitalise(word) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

export function formatValue(value) {
  if (Math.abs(value) >= 100) return `${Math.round(value)}`;
  return value.toFixed(1);
}

export function shortUnit(unit) {
  return unit.split(" ").pop();
}

export function layerLabel(datasetName) {
  for (const layer of RESOURCES.layers) {
    if (layer.datasetName === datasetName) return layer.label;
  }
  return capitalise(datasetName);
}
