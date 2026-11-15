import { cameraPosition, flattenOnto, turnAround } from "../view/spotOrbit.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function isClose(a, b) {
  let isNear = false;
  if (Math.abs(a - b) < 0.0001) isNear = true;
  return isNear;
}

function testNoTiltSitsStraightAbove() {
  const view = {
    point: {
      x: 0,
      y: 0,
      z: 1,
    },
    away: {
      x: 0,
      y: 1,
      z: 0,
    },
    tilt: 0,
    distance: 7,
  };
  const position = cameraPosition(view);
  check("no tilt sits straight above the point", isClose(position.x, 0) && isClose(position.y, 0) && isClose(position.z, 8));
}

function testTiltMovesCameraBehind() {
  const view = {
    point: {
      x: 0,
      y: 0,
      z: 1,
    },
    away: {
      x: 0,
      y: 1,
      z: 0,
    },
    tilt: 60,
    distance: 7,
  };
  const position = cameraPosition(view);
  const offsetY = position.y - view.point.y;
  const offsetZ = position.z - view.point.z;
  const distance = Math.hypot(position.x, offsetY, offsetZ);
  const tiltDegrees = (Math.acos(offsetZ / distance) * 180) / Math.PI;
  check("tilt moves the camera behind the point", offsetY < 0 && isClose(distance, 7) && isClose(tiltDegrees, 60));
}

function testFlattenStaysFlatOnSurface() {
  const normal = {
    x: 0,
    y: -1,
    z: 0,
  };
  const tilted = {
    x: 1,
    y: 0.5,
    z: 0,
  };
  const flat = flattenOnto(tilted, normal);
  check("flatten removes the up part, even at the south pole", isClose(flat.y, 0) && isClose(flat.x, 1));
}

function testTurnAroundQuarterTurn() {
  const axis = {
    x: 0,
    y: 0,
    z: 1,
  };
  const east = {
    x: 1,
    y: 0,
    z: 0,
  };
  const turned = turnAround(east, axis, Math.PI / 2);
  check("a quarter turn around the up axis turns east into north", isClose(turned.x, 0) && isClose(turned.y, 1));
}

testNoTiltSitsStraightAbove();
testTiltMovesCameraBehind();
testFlattenStaysFlatOnSurface();
testTurnAroundQuarterTurn();
