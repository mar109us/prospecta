import { easeInOut, slerpDirection } from "../view/cameraMath.js";

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

testEaseStartsAndEndsExactly();
testEaseIsHalfwayAtHalfTime();
testEaseStartsSlowly();
testSlerpHalfwayStaysOnSphere();
