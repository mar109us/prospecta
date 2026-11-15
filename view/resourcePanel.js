import { partIndices } from "../data/layerParts.js";

function createOption(layer) {
  const option = document.createElement("div");
  option.className = "panel__option";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = layer.toggleId;

  const label = document.createElement("label");
  label.id = `${layer.datasetName}-label`;
  label.htmlFor = layer.toggleId;
  label.textContent = layer.label;
  if (layer.note) label.title = layer.note;

  option.appendChild(checkbox);
  option.appendChild(label);
  return option;
}

function createLegendSlot(layer) {
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.id = `${layer.datasetName}-legend`;
  return legend;
}

function appendLayer(container, layers, layer) {
  container.appendChild(createOption(layer));
  container.appendChild(createLegendSlot(layer));
  for (const partIndex of partIndices(layers, layer.datasetName)) {
    container.appendChild(createLegendSlot(layers[partIndex]));
  }
}

function createDivider() {
  const divider = document.createElement("div");
  divider.className = "panel__divider";
  return divider;
}

export function buildResourceOptions(containerId, layers) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Cannot build resource options: no element with id "${containerId}".`);
    return;
  }

  for (const layer of layers) {
    if (layer.partOf) continue;
    if (layer.isMineral) continue;
    appendLayer(container, layers, layer);
  }
  container.appendChild(createDivider());
  for (const layer of layers) {
    if (layer.partOf) continue;
    if (!layer.isMineral) continue;
    appendLayer(container, layers, layer);
  }
}
