import { createGlobe, startRenderLoop } from "./view/globe.js";
import { connectDebug } from "./debug/logState.js";

const IS_DEBUG = false;

function main() {
  const container = document.getElementById("globe");
  if (!container) {
    console.error('Could not start: no element with id "globe" in main.html.');
    return;
  }

  const globe = createGlobe(container);
  if (IS_DEBUG) connectDebug(globe);
  startRenderLoop(globe);
}

main();
