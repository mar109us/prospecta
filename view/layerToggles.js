export function createToggle(layer, setVisible) {
  return {
    checkbox: document.getElementById(layer.toggleId),
    category: layer.category,
    setVisible: setVisible,
  };
}

function hideOtherCategories(toggles, category) {
  for (const toggle of toggles) {
    if (toggle.category === category) continue;
    toggle.checkbox.checked = false;
    toggle.setVisible(false);
  }
}

export function connectCategoryToggles(toggles) {
  for (const toggle of toggles) {
    toggle.checkbox.addEventListener("change", () => {
      toggle.setVisible(toggle.checkbox.checked);
      if (toggle.checkbox.checked) hideOtherCategories(toggles, toggle.category);
    });
  }
}
