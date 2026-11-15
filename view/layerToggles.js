export function createToggle(layer, setVisible) {
  return {
    checkbox: document.getElementById(layer.toggleId),
    category: layer.category,
    isFill: layer.isFill,
    isOnByDefault: layer.isOnByDefault,
    setVisible: setVisible,
  };
}

export function shouldHide(toggle, changedToggle) {
  if (!changedToggle.isFill) return false;
  if (!toggle.isFill) return false;
  if (toggle.category === changedToggle.category) return false;
  return true;
}

export function defaultVisibility(toggles) {
  const visibility = [];
  for (let index = 0; index < toggles.length; index++) {
    const toggle = toggles[index];
    visibility.push(toggle.isOnByDefault);
    if (!toggle.isOnByDefault) continue;

    for (let earlier = 0; earlier < index; earlier++) {
      if (shouldHide(toggles[earlier], toggle)) visibility[earlier] = false;
    }
  }
  return visibility;
}

export function applyDefaultToggles(toggles) {
  const visibility = defaultVisibility(toggles);
  for (let index = 0; index < toggles.length; index++) {
    toggles[index].checkbox.checked = visibility[index];
    toggles[index].setVisible(visibility[index]);
  }
}

function hideClashingToggles(toggles, changedToggle) {
  for (const toggle of toggles) {
    if (!shouldHide(toggle, changedToggle)) continue;
    toggle.checkbox.checked = false;
    toggle.setVisible(false);
  }
}

export function connectCategoryToggles(toggles) {
  for (const toggle of toggles) {
    toggle.checkbox.addEventListener("change", () => {
      toggle.setVisible(toggle.checkbox.checked);
      if (toggle.checkbox.checked) hideClashingToggles(toggles, toggle);
    });
  }
}

export function connectClearButton(buttonId, toggles, category) {
  const button = document.getElementById(buttonId);
  if (!button) {
    console.error(`Cannot connect clear button: no element with id "${buttonId}".`);
    return;
  }
  button.addEventListener("click", () => {
    for (const toggle of toggles) {
      if (toggle.category !== category) continue;
      toggle.checkbox.checked = false;
      toggle.setVisible(false);
    }
  });
}
