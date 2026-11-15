import { curvePower, noiseRatio } from "../view/layerBands.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeGrid(displayMin, displayMax, uncertainty) {
  return {
    displayMin: displayMin,
    displayMax: displayMax,
    uncertainty: uncertainty,
  };
}

function testNoUncertaintyGivesPower2() {
  const noise = noiseRatio(makeGrid(0, 10, undefined));
  check(
    "no uncertainty gives power 2",
    noise === 0 && curvePower(noise) === 2,
  );
}

function testNoisyDataGivesSteeperCurve() {
  const reliable = noiseRatio(makeGrid(3.22, 21.1, 0.93));
  const noisy = noiseRatio(makeGrid(35.78, 48.53, 4.6));
  check("noisy data gives a steeper curve", curvePower(noisy) > curvePower(reliable));
}

function testNoiseIsCappedAt095() {
  check("noise is capped at 0.95", noiseRatio(makeGrid(0, 1, 50)) === 0.95);
}

testNoUncertaintyGivesPower2();
testNoisyDataGivesSteeperCurve();
testNoiseIsCappedAt095();
