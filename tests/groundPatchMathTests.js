import { edgeFade, grainUv, patchFrame, patchPointDirection } from "../view/groundPatchMath.js";

const FADE = {
  fadeStart: 0.6,
  fadeEnd: 0.95,
};

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function isClose(a, b, tolerance) {
  let isNear = false;
  if (Math.abs(a - b) < tolerance) isNear = true;
  return isNear;
}

function frameOnEquator() {
  return patchFrame({
    x: 0,
    y: 0,
    z: 1,
  });
}

function testFadeIsFullAtCentre() {
  check("fade is 1 at the centre", edgeFade(0, FADE) === 1);
}

function testFadeIsZeroAtEdge() {
  check("fade is 0 at the edge", edgeFade(1, FADE) === 0);
}

function testFadeIsHalfwayInTheMiddle() {
  check("fade is 0.5 halfway through the fade band", isClose(edgeFade(0.775, FADE), 0.5, 0.0001));
}

function testFrameIsPerpendicular() {
  const frame = patchFrame({
    x: 0.6,
    y: 0.48,
    z: 0.64,
  });
  const eastNorth = frame.east.x * frame.north.x + frame.east.y * frame.north.y + frame.east.z * frame.north.z;
  const eastUp = frame.east.x * frame.up.x + frame.east.y * frame.up.y + frame.east.z * frame.up.z;
  check("frame vectors are perpendicular", isClose(eastNorth, 0, 1e-9) && isClose(eastUp, 0, 1e-9));
}

function testCentreOfPatchIsUp() {
  const frame = frameOnEquator();
  const direction = patchPointDirection(frame, 0, 0);
  check("patch centre points straight up", isClose(direction.z, 1, 1e-12));
}

function testGrainMovesOneTileEveryTileWidth() {
  const frame = frameOnEquator();
  const here = grainUv(frame, patchPointDirection(frame, 0, 0), 4);
  const fourMetresEast = grainUv(frame, patchPointDirection(frame, 4, 0), 4);
  check("grain moves one tile every 4 m east", isClose(fourMetresEast.u - here.u, 1, 0.001));
}

testFadeIsFullAtCentre();
testFadeIsZeroAtEdge();
testFadeIsHalfwayInTheMiddle();
testFrameIsPerpendicular();
testCentreOfPatchIsUp();
testGrainMovesOneTileEveryTileWidth();
