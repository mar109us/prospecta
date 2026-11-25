import { connectPanelToggle } from "../view/panelToggle.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function buildTestToggle() {
  const container = document.createElement("div");
  const button = document.createElement("button");
  button.id = "panel-toggle-test";
  const panel = document.createElement("aside");
  panel.id = "resource-panel-test-toggle";
  container.appendChild(button);
  container.appendChild(panel);
  document.body.appendChild(container);

  connectPanelToggle({
    buttonId: button.id,
    panelId: panel.id,
  });
  return {
    container: container,
    button: button,
    panel: panel,
  };
}

function testFirstClickOpensThePanel() {
  const parts = buildTestToggle();
  parts.button.click();
  check("opens the panel on the first click", parts.panel.classList.contains("panel--open"));
  parts.container.remove();
}

function testSecondClickClosesThePanel() {
  const parts = buildTestToggle();
  parts.button.click();
  parts.button.click();
  check("closes the panel on the second click", !parts.panel.classList.contains("panel--open"));
  parts.container.remove();
}

function testAriaExpandedMatches() {
  const parts = buildTestToggle();
  parts.button.click();
  check("sets aria-expanded to true when open", parts.button.getAttribute("aria-expanded") === "true");
  parts.button.click();
  check("sets aria-expanded to false when closed", parts.button.getAttribute("aria-expanded") === "false");
  parts.container.remove();
}

testFirstClickOpensThePanel();
testSecondClickClosesThePanel();
testAriaExpandedMatches();
