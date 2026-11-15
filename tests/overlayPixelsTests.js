import { buildLayerPixels, coverageLatLimit, fillChannel, valueToByte } from "../view/overlayPixels.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeGrid(name, values) {
  return {
    name: name,
    width: 1,
    height: 2,
    displayMin: 0,
    displayMax: 30,
    values: values,
  };
}

function makeIronAndSiliconPixels() {
  const iron = makeGrid("iron", [30, null]);
  const silicon = makeGrid("silicon", [15, 30]);
  return buildLayerPixels([iron, silicon]);
}

function testMinIsZero() {
  check("min is 0", valueToByte(10, 10, 30) === 0);
}

function testMaxIs255() {
  check("max is 255", valueToByte(30, 10, 30) === 255);
}

function testHalfIs128() {
  check("half is 128", valueToByte(20, 10, 30) === 128);
}

function testBelowDisplayRangeClampsToZero() {
  check("below display range clamps to 0", valueToByte(2, 10, 30) === 0);
}

function testAboveDisplayRangeClampsTo255() {
  check("above display range clamps to 255", valueToByte(45, 10, 30) === 255);
}

function testNullIsZero() {
  check("null is 0", valueToByte(null, 10, 30) === 0);
}

function testFlatMapIs255() {
  check("flat map is 255", valueToByte(5, 5, 5) === 255);
}

function testNorthRowEndsAtTopOfTexture() {
  const pixels = makeIronAndSiliconPixels();
  const bottomIron = pixels[0];
  const topIron = pixels[4];
  check("north row ends at top of texture", bottomIron === 0 && topIron === 255);
}

function testIronInRedSiliconInGreen() {
  const pixels = makeIronAndSiliconPixels();
  check(
    "iron goes in red, silicon in green",
    pixels[4] === 255 && pixels[5] === 128 && pixels[1] === 255,
  );
}

function testUnusedChannelsStayZero() {
  const pixels = makeIronAndSiliconPixels();
  check(
    "unused channels stay 0",
    pixels[2] === 0 && pixels[3] === 0 && pixels[6] === 0 && pixels[7] === 0,
  );
}

function testDifferentSizeGridsThrow() {
  const small = makeGrid("small", [1, 2]);
  const wide = makeGrid("wide", [1, 2, 3, 4]);
  wide.width = 2;

  let hasThrown = false;
  try {
    buildLayerPixels([small, wide]);
  } catch (error) {
    hasThrown = true;
  }
  check("different-size grids throw", hasThrown);
}

testMinIsZero();
testMaxIs255();
testHalfIs128();
testBelowDisplayRangeClampsToZero();
testAboveDisplayRangeClampsTo255();
testNullIsZero();
testFlatMapIs255();
testNorthRowEndsAtTopOfTexture();
testIronInRedSiliconInGreen();
testUnusedChannelsStayZero();
testDifferentSizeGridsThrow();

function testFillingAChannelLeavesOthersUntouched() {
  const pixels = new Uint8Array(2 * 4);
  pixels[0] = 77;
  fillChannel(pixels, makeGrid("silicon", [30, 30]), 1);
  check("filling a channel leaves the other channels untouched", pixels[0] === 77 && pixels[1] === 255 && pixels[5] === 255);
}

testFillingAChannelLeavesOthersUntouched();

function makeBandGrid(firstRowWithData, lastRowWithData) {
  const values = [];
  for (let row = 0; row < 36; row++) {
    for (let column = 0; column < 4; column++) {
      if (row >= firstRowWithData && row <= lastRowWithData) {
        values.push(1);
      } else {
        values.push(null);
      }
    }
  }
  return {
    width: 4,
    height: 36,
    values: values,
  };
}

function testCoverageLimitOfAPartialMap() {
  check("a map covering 50S-50N has a 50 degree limit", coverageLatLimit(makeBandGrid(8, 27)) === 50);
}

function testCoverageLimitOfAGlobalMap() {
  check("a global map has a 90 degree limit", coverageLatLimit(makeBandGrid(0, 35)) === 90);
}

testCoverageLimitOfAPartialMap();
testCoverageLimitOfAGlobalMap();
