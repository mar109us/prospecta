import { buildResourceOptions } from "../view/resourcePanel.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeLayer(datasetName, section) {
  return {
    datasetName: datasetName,
    label: datasetName,
    colour: "#123456",
    toggleId: `${datasetName}-test-toggle`,
    section: section,
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
  const layers = [
    makeLayer("ironTest", 1),
    makeLayer("hydrogenTest", 1),
    polar,
    makeLayer("thoriumTest", 2),
    makeLayer("olivineTest", 3),
  ];
  buildResourceOptions(container.id, layers);
  return container;
}

function blockOf(toggleId) {
  return document.getElementById(toggleId).parentElement.parentElement;
}

function indexInPanel(container, element) {
  for (let index = 0; index < container.children.length; index++) {
    if (container.children[index] === element) return index;
  }
  return -1;
}

function testLayersSitInOneFlatList() {
  const container = buildTestPanel();
  let isFlat = false;
  if (blockOf("ironTest-test-toggle").parentElement === container && blockOf("olivineTest-test-toggle").parentElement === container) isFlat = true;
  check("all layers sit in one flat list", isFlat && container.getElementsByTagName("details").length === 0);
  container.remove();
}

function testSectionsAreSeparatedByDividers() {
  const container = buildTestPanel();
  const dividers = container.getElementsByClassName("panel__divider");
  const firstDivider = indexInPanel(container, dividers[0]);
  const secondDivider = indexInPanel(container, dividers[1]);
  const hydrogenIndex = indexInPanel(container, blockOf("hydrogenTest-test-toggle"));
  const thoriumIndex = indexInPanel(container, blockOf("thoriumTest-test-toggle"));
  const olivineIndex = indexInPanel(container, blockOf("olivineTest-test-toggle"));
  let isInOrder = false;
  if (hydrogenIndex < firstDivider && firstDivider < thoriumIndex && thoriumIndex < secondDivider && secondDivider < olivineIndex) isInOrder = true;
  check("sections are separated by dividers", dividers.length === 2 && isInOrder);
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
  let isInHydrogenBlock = false;
  if (legend && legend.parentElement === blockOf("hydrogenTest-test-toggle")) isInHydrogenBlock = true;
  check("a part layer gets a legend row in its parent's block but no checkbox", isInHydrogenBlock && checkbox === null);
  container.remove();
}

function testRowsCarryTheLayerColour() {
  const container = buildTestPanel();
  const option = document.getElementById("ironTest-test-toggle").parentElement;
  check("rows carry the layer colour", option.style.getPropertyValue("--layer-colour") === "#123456");
  container.remove();
}

function testLoadingLabelKeepsTheSwatch() {
  const container = buildTestPanel();
  const text = document.getElementById("ironTest-label");
  text.textContent = "ironTest (loading…)";
  const label = text.parentElement;
  check("the loading label keeps the swatch", label.getElementsByClassName("panel__swatch").length === 1);
  container.remove();
}

function testCheckboxIsStillARealInput() {
  const container = buildTestPanel();
  const checkbox = document.getElementById("ironTest-test-toggle");
  check("the checkbox is still a real input", checkbox.tagName === "INPUT" && checkbox.type === "checkbox");
  container.remove();
}

testLayersSitInOneFlatList();
testSectionsAreSeparatedByDividers();
testNoGroupHeadings();
testPartLayerGetsLegendButNoCheckbox();
testRowsCarryTheLayerColour();
testLoadingLabelKeepsTheSwatch();
testCheckboxIsStillARealInput();
