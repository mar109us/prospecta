import { buildResourceOptions } from "../view/resourcePanel.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeLayer(datasetName, isMineral) {
  return {
    datasetName: datasetName,
    label: datasetName,
    toggleId: `${datasetName}-test-toggle`,
    isMineral: isMineral,
  };
}

function buildTestPanel() {
  const container = document.createElement("div");
  container.id = "resource-panel-test";
  document.body.appendChild(container);

  const polar = {
    datasetName: "polarTest",
    label: "polarTest",
    partOf: "hydrogenTest",
  };
  const layers = [makeLayer("olivineTest", true), makeLayer("ironTest", false), makeLayer("hydrogenTest", false), polar];
  buildResourceOptions(container.id, layers);
  return container;
}

function indexInPanel(container, element) {
  for (let index = 0; index < container.children.length; index++) {
    if (container.children[index] === element) return index;
  }
  return -1;
}

function testLayersSitInOneFlatList() {
  const container = buildTestPanel();
  const iron = document.getElementById("ironTest-test-toggle");
  const olivine = document.getElementById("olivineTest-test-toggle");
  let isFlat = false;
  if (iron.parentElement.parentElement === container && olivine.parentElement.parentElement === container) isFlat = true;
  check("all layers sit in one flat list", isFlat && container.getElementsByTagName("details").length === 0);
  container.remove();
}

function testMineralsComeAfterTheDivider() {
  const container = buildTestPanel();
  const dividers = container.getElementsByClassName("panel__divider");
  const dividerIndex = indexInPanel(container, dividers[0]);
  const ironIndex = indexInPanel(container, document.getElementById("ironTest-test-toggle").parentElement);
  const olivineIndex = indexInPanel(container, document.getElementById("olivineTest-test-toggle").parentElement);
  let isInOrder = false;
  if (ironIndex < dividerIndex && dividerIndex < olivineIndex) isInOrder = true;
  check("minerals come after the divider", dividers.length === 1 && isInOrder);
  container.remove();
}

function testNoGroupHeadings() {
  const container = buildTestPanel();
  check("panel has no group headings", container.getElementsByTagName("h3").length === 0);
  container.remove();
}

function testPartLayerGetsLegendButNoCheckbox() {
  const container = buildTestPanel();
  const legend = document.getElementById("polarTest-legend");
  const checkbox = document.getElementById("polarTest-test-toggle");
  check("a part layer gets a legend row but no checkbox", legend !== null && checkbox === null);
  container.remove();
}

testLayersSitInOneFlatList();
testMineralsComeAfterTheDivider();
testNoGroupHeadings();
testPartLayerGetsLegendButNoCheckbox();
