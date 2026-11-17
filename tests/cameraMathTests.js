import { clampTilt, easeInOut, slerpDirection, zoomOrbitDistance } from "../view/cameraMath.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function testEaseStartsAndEndsExactly() {
  check("ease starts at 0 and ends at 1", easeInOut(0) === 0 && easeInOut(1) === 1);
}

function testEaseIsHalfwayAtHalfTime() {
  check("ease is halfway at half time", easeInOut(0.5) === 0.5);
}

function testEaseStartsSlowly() {
  check("ease starts slowly", easeInOut(0.1) < 0.1);
}

function testSlerpHalfwayStaysOnSphere() {
  const from = {
    x: 1,
    y: 0,
    z: 0,
  };
  const to = {
    x: 0,
    y: 1,
    z: 0,
  };
  const middle = slerpDirection(from, to, 0.5);
  const length = Math.hypot(middle.x, middle.y, middle.z);
  check("halfway direction stays on the sphere", Math.abs(length - 1) < 0.0001 && Math.abs(middle.x - middle.y) < 0.0001);
}

function testClampsTiltAboveMax() {
  check("clamps tilt above 80", clampTilt(95, 80) === 80);
}

function testClampsTiltBelowZero() {
  check("clamps tilt below 0", clampTilt(-10, 80) === 0);
}

function testKeepsTiltInsideRange() {
  check("keeps tilt inside the range", clampTilt(45, 80) === 45);
}

function makeZoomRange() {
  return {
    step: 1.1,
    min: 5,
    max: 23,
  };
}

function testWheelDownZoomsOut() {
  const distance = zoomOrbitDistance(10, 100, makeZoomRange());
  check("wheel down zooms out one step", Math.abs(distance - 11) < 0.0001);
}

function testWheelUpZoomsIn() {
  check("wheel up zooms in", zoomOrbitDistance(10, -100, makeZoomRange()) < 10);
}

function testZoomStaysInsideMinDistance() {
  check("zoom stays inside min distance", zoomOrbitDistance(5.1, -1000, makeZoomRange()) === 5);
}

function testZoomStaysInsideMaxDistance() {
  check("zoom stays inside max distance", zoomOrbitDistance(22, 1000, makeZoomRange()) === 23);
}

testEaseStartsAndEndsExactly();
testEaseIsHalfwayAtHalfTime();
testEaseStartsSlowly();
testSlerpHalfwayStaysOnSphere();
testClampsTiltAboveMax();
testClampsTiltBelowZero();
testKeepsTiltInsideRange();
testWheelDownZoomsOut();
testWheelUpZoomsIn();
testZoomStaysInsideMinDistance();
testZoomStaysInsideMaxDistance();
