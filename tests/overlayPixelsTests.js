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

function testMinIsZero() {
  check("min is 0", valueToAlpha(10, 10, 30) === 0);
}

function testMaxIs255() {
  check("max is 255", valueToAlpha(30, 10, 30) === 255);
}

function testHalfIs128() {
  check("half is 128", valueToAlpha(20, 10, 30) === 128);
}

function testNullIsZero() {
  check("null is 0", valueToAlpha(null, 10, 30) === 0);
}

function testFlatMapIs255() {
  check("flat map is 255", valueToAlpha(5, 5, 5) === 255);
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

testMinIsZero();
testMaxIs255();
testHalfIs128();
testNullIsZero();
testFlatMapIs255();
testNorthRowEndsAtTopOfTexture();
testPixelsUseLayerColour();
