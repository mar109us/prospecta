import {
  edgeFade,
  grainUv,
  patchFrame,
  patchPointDirection,
  patchPointMetres,
  secondGrainOffset,
  snapToGrid,
  turnGrainUv,
} from "../view/groundPatchMath.js";

const FADE = {
  flattenFrom: 0.6,
  flattenUntil: 0.95,
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

function testSecondGrainOffsetIsAFraction() {
  const offset = secondGrainOffset(
    {
      u: -137,
      v: 52,
    },
    0.23,
  );
  let isFraction = false;
  if (offset.u >= 0 && offset.u < 1 && offset.v >= 0 && offset.v < 1) isFraction = true;
  check("second grain offset stays between 0 and 1", isFraction);
}

function distanceToWholeNumber(value) {
  return Math.abs(value - Math.round(value));
}

function testWholeTileShiftGivesSameGrain() {
  const shift = {
    u: -137,
    v: 52,
  };
  const local = {
    u: 3.4,
    v: -7.9,
  };
  const unshifted = turnGrainUv(
    {
      u: local.u + shift.u,
      v: local.v + shift.v,
    },
    0.23,
  );
  const shifted = turnGrainUv(local, 0.23);
  const offset = secondGrainOffset(shift, 0.23);
  const uGap = distanceToWholeNumber(unshifted.u - shifted.u - offset.u);
  const vGap = distanceToWholeNumber(unshifted.v - shifted.v - offset.v);
  check("whole-tile shift gives the same grain", uGap < 1e-9 && vGap < 1e-9);
}

function testPointMetresUndoesPointDirection() {
  const frame = frameOnEquator();
  const metres = patchPointMetres(frame, patchPointDirection(frame, 1234, -567));
  check(
    "point metres undoes point direction",
    isClose(metres.eastMetres, 1234, 1e-6) && isClose(metres.northMetres, -567, 1e-6),
  );
}

function testSnappedCentreIsWholeSquares() {
  const squares = snapToGrid(1234.5, 4) / 4;
  check("snapped centre is a whole number of squares", squares === Math.round(squares));
}

function testSnapPicksNearestGridLine() {
  check("snap picks the nearest grid line", snapToGrid(9.9, 4) === 8 && snapToGrid(10.1, 4) === 12);
}

testFadeIsFullAtCentre();
testFadeIsZeroAtEdge();
testFadeIsHalfwayInTheMiddle();
testFrameIsPerpendicular();
testCentreOfPatchIsUp();
testGrainMovesOneTileEveryTileWidth();
testSecondGrainOffsetIsAFraction();
testWholeTileShiftGivesSameGrain();
testPointMetresUndoesPointDirection();
testSnappedCentreIsWholeSquares();
testSnapPicksNearestGridLine();
