const OPEN_CLASS = "panel--open";

function togglePanel(button, panel) {
  const isOpen = panel.classList.toggle(OPEN_CLASS);
  button.setAttribute("aria-expanded", `${isOpen}`);
  console.log(`resource panel open: ${isOpen}`);
}

export function connectPanelToggle(ids) {
  const button = document.getElementById(ids.buttonId);
  const panel = document.getElementById(ids.panelId);
  if (!button) {
    console.error(`The panel toggle is off: no element with id "${ids.buttonId}" in main.html.`);
    return;
  }
  if (!panel) {
    console.error(`The panel toggle is off: no element with id "${ids.panelId}" in main.html.`);
    return;
  }

  button.addEventListener("click", () => togglePanel(button, panel));
}
