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
    max: 30,
    values: [30, null],
  };
}

function testMaxIronIsFullyOpaque() {
  check("max iron is fully opaque", valueToAlpha(30, 30) === 255);
}

function testHalfIronIsHalfOpaque() {
  check("half iron is half opaque", valueToAlpha(15, 30) === 128);
}

function testNullIsTransparent() {
  check("null is transparent", valueToAlpha(null, 30) === 0);
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

testMaxIronIsFullyOpaque();
testHalfIronIsHalfOpaque();
testNullIsTransparent();
testNorthRowEndsAtTopOfTexture();
testPixelsUseLayerColour();
