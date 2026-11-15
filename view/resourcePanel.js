import { partIndices } from "../data/layerParts.js";

function createSwatch() {
  const swatch = document.createElement("span");
  swatch.className = "panel__swatch";
  return swatch;
}

function createLabelText(layer) {
  const text = document.createElement("span");
  text.id = `${layer.datasetName}-label`;
  text.textContent = layer.label;
  return text;
}

function createOption(layer) {
  const option = document.createElement("div");
  option.className = "panel__option";
  option.style.setProperty("--layer-colour", layer.colour);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = layer.toggleId;

  const label = document.createElement("label");
  label.htmlFor = layer.toggleId;
  if (layer.note) label.title = layer.note;
  label.appendChild(createSwatch());
  label.appendChild(createLabelText(layer));

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

function createLayerBlock(layers, layer) {
  const block = document.createElement("div");
  block.className = "panel__layer";
  block.appendChild(createOption(layer));
  block.appendChild(createLegendSlot(layer));
  for (const partIndex of partIndices(layers, layer.datasetName)) {
    block.appendChild(createLegendSlot(layers[partIndex]));
  }
  return block;
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

  let previousSection = null;
  for (const layer of layers) {
    if (layer.partOf) continue;
    if (previousSection !== null && layer.section !== previousSection) container.appendChild(createDivider());
    previousSection = layer.section;
    container.appendChild(createLayerBlock(layers, layer));
  }
}

export function colourToggleRow(toggleId, colour) {
  const checkbox = document.getElementById(toggleId);
  if (!checkbox) {
    console.error(`Cannot colour toggle row: no element with id "${toggleId}".`);
    return;
  }
  checkbox.parentElement.style.setProperty("--layer-colour", colour);
}
