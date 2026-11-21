import {
  approachStart,
  clampPitch,
  headingDegrees,
  lookDirection,
  moveDirection,
  turnHeading,
  walk,
  walkSpeed,
} from "../view/firstPersonMath.js";

const SPEED_SETTINGS = {
  walkSpeedMetresPerSecond: 300,
  sprintMultiplier: 50,
};

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

function isSameVector(a, b) {
  let isSame = false;
  if (isClose(a.x, b.x) && isClose(a.y, b.y) && isClose(a.z, b.z)) isSame = true;
  return isSame;
}

function noKeys() {
  return {
    forward: false,
    back: false,
    left: false,
    right: false,
  };
}

function walkerOnEquatorFacingNorth() {
  return {
    up: {
      x: 0,
      y: 0,
      z: 1,
    },
    forward: {
      x: 0,
      y: 1,
      z: 0,
    },
  };
}

function testNoKeysStandsStill() {
  const walker = walkerOnEquatorFacingNorth();
  const moved = walk(walker, noKeys(), 0.1);
  check("no keys stands still", isSameVector(moved.up, walker.up));
}

function testForwardWalksNorth() {
  const keys = noKeys();
  keys.forward = true;
  const moved = walk(walkerOnEquatorFacingNorth(), keys, Math.PI / 2);
  const northPole = {
    x: 0,
    y: 1,
    z: 0,
  };
  check("forward a quarter turn reaches the north pole", isSameVector(moved.up, northPole));
}

function testCrossingThePoleKeepsWalking() {
  const keys = noKeys();
  keys.forward = true;
  const moved = walk(walkerOnEquatorFacingNorth(), keys, Math.PI);
  const farSide = {
    x: 0,
    y: 0,
    z: -1,
  };
  check("walking over the pole comes down the far side", isSameVector(moved.up, farSide));
}

function testStrafeRightGoesEast() {
  const keys = noKeys();
  keys.right = true;
  const walker = walkerOnEquatorFacingNorth();
  walker.forward = moveDirection(walker, keys);
  check("D moves east when facing north", isClose(headingDegrees(walker), 90));
}

function testDiagonalIsNotFaster() {
  const keys = noKeys();
  keys.forward = true;
  keys.right = true;
  const direction = moveDirection(walkerOnEquatorFacingNorth(), keys);
  check("diagonal direction has length 1", isClose(Math.hypot(direction.x, direction.y, direction.z), 1));
}

function testOppositeKeysCancel() {
  const keys = noKeys();
  keys.forward = true;
  keys.back = true;
  check("W and S together cancel out", moveDirection(walkerOnEquatorFacingNorth(), keys) === null);
}

function testTurnRightFacesEast() {
  const walker = walkerOnEquatorFacingNorth();
  walker.forward = turnHeading(walker, 90);
  check("turning right 90 degrees faces east", isClose(headingDegrees(walker), 90));
}

function testPitchIsClamped() {
  check("pitch stops at the top limit", clampPitch(120, 85) === 85);
  check("pitch stops at the bottom limit", clampPitch(-120, 85) === -85);
  check("pitch inside the limits is kept", clampPitch(10, 85) === 10);
}

function testLookingStraightUp() {
  const walker = walkerOnEquatorFacingNorth();
  check("pitch 90 looks straight up", isSameVector(lookDirection(walker, 90), walker.up));
}

function testNoSprintUsesBaseSpeed() {
  check("no sprint uses base speed", walkSpeed(noKeys(), SPEED_SETTINGS) === 300);
}

function testSprintMultipliesSpeed() {
  const keys = noKeys();
  keys.sprint = true;
  check("sprint multiplies walk speed", walkSpeed(keys, SPEED_SETTINGS) === 15000);
}

function testApproachStartIsTheChosenDistanceAway() {
  const centreUp = walkerOnEquatorFacingNorth().up;
  const start = approachStart(centreUp, 0.1);
  const angle = Math.acos(start.up.x * centreUp.x + start.up.y * centreUp.y + start.up.z * centreUp.z);
  check("approach start is the chosen distance from the centre", isClose(angle, 0.1));
}

function testWalkingForwardFromStartReachesCentre() {
  const centreUp = {
    x: 0.6,
    y: -0.8,
    z: 0,
  };
  const keys = noKeys();
  keys.forward = true;
  const arrived = walk(approachStart(centreUp, 0.1), keys, 0.1);
  check("walking forward from the start reaches the centre", isSameVector(arrived.up, centreUp));
}

testNoKeysStandsStill();
testApproachStartIsTheChosenDistanceAway();
testWalkingForwardFromStartReachesCentre();
testNoSprintUsesBaseSpeed();
testSprintMultipliesSpeed();
testForwardWalksNorth();
testCrossingThePoleKeepsWalking();
testStrafeRightGoesEast();
testDiagonalIsNotFaster();
testOppositeKeysCancel();
testTurnRightFacesEast();
testPitchIsClamped();
testLookingStraightUp();
