import { bandOpacities } from "../view/legend.js";
import { RESOURCES } from "../settings.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeGrid(uncertainty) {
  return {
    displayMin: 0,
    displayMax: 10,
    uncertainty: uncertainty,
  };
}

function testLowestBandIsTransparent() {
  check("lowest band is transparent", bandOpacities(makeGrid(0.1))[0] === 0);
}

function testTopBandUsesLayerOpacity() {
  const opacities = bandOpacities(makeGrid(0.1));
  check("top band uses the layer opacity", opacities[opacities.length - 1] === RESOURCES.opacity);
}

function testNoisyDataFadesMiddleBands() {
  const reliable = bandOpacities(makeGrid(0.1));
  const noisy = bandOpacities(makeGrid(3));
  check("noisy data fades the middle bands", noisy[2] < reliable[2]);
}

testLowestBandIsTransparent();
testTopBandUsesLayerOpacity();
testNoisyDataFadesMiddleBands();
