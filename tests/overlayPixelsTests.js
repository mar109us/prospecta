import { buildOverlayPixels, valueToAlpha } from "../view/overlayPixels.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeNorthSouthGrid() {
  return {
    width: 1,
    height: 2,
    min: 0,
    max: 30,
    values: [30, null],
  };
}

function testMinIronIsTransparent() {
  check("min iron is transparent", valueToAlpha(10, 10, 30) === 0);
}

function testMaxIronIsFullyOpaque() {
  check("max iron is fully opaque", valueToAlpha(30, 10, 30) === 255);
}

function testHalfIronIsEasedDown() {
  check("half iron is eased down to 25%", valueToAlpha(20, 10, 30) === 64);
}

function testQuarterIronIsEasedDown() {
  check("quarter iron is eased down to 6.25%", valueToAlpha(15, 10, 30) === 16);
}

function testNullIsTransparent() {
  check("null is transparent", valueToAlpha(null, 10, 30) === 0);
}

function testFlatMapIsFullyOpaque() {
  check("flat map is fully opaque", valueToAlpha(5, 5, 5) === 255);
}

function testNorthRowEndsAtTopOfTexture() {
  const pixels = buildOverlayPixels(makeNorthSouthGrid(), "#B7410E");
  const bottomAlpha = pixels[3];
  const topAlpha = pixels[7];
  check("north row ends at top of texture", bottomAlpha === 0 && topAlpha === 255);
}

function testPixelsUseLayerColour() {
  const pixels = buildOverlayPixels(makeNorthSouthGrid(), "#B7410E");
  check(
    "pixels use layer colour",
    pixels[4] === 183 && pixels[5] === 65 && pixels[6] === 14,
  );
}

testMinIronIsTransparent();
testMaxIronIsFullyOpaque();
testHalfIronIsEasedDown();
testQuarterIronIsEasedDown();
testNullIsTransparent();
testFlatMapIsFullyOpaque();
testNorthRowEndsAtTopOfTexture();
testPixelsUseLayerColour();
