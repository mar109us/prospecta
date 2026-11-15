function groupNames(layers) {
  const names = [];
  for (const layer of layers) {
    let isKnown = false;
    for (const name of names) {
      if (name === layer.group) isKnown = true;
    }
    if (!isKnown) names.push(layer.group);
  }
  return names;
}

function createOption(layer) {
  const option = document.createElement("div");
  option.className = "panel__option";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = layer.toggleId;

  const label = document.createElement("label");
  label.htmlFor = layer.toggleId;
  label.textContent = layer.label;

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

export function buildResourceOptions(containerId, layers) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Cannot build resource options: no element with id "${containerId}".`);
    return;
  }

  for (const groupName of groupNames(layers)) {
    const heading = document.createElement("h3");
    heading.className = "panel__group";
    heading.textContent = groupName;
    container.appendChild(heading);

    for (const layer of layers) {
      if (layer.group !== groupName) continue;
      container.appendChild(createOption(layer));
      container.appendChild(createLegendSlot(layer));
    }
  }
}
