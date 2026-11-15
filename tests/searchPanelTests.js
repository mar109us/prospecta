import { rankHue } from "../view/searchPanel.js";
import { RESULTS } from "../settings.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function testBestRankIsGreen() {
  check("rank 1 gets the best hue", rankHue(1, 5) === RESULTS.bestHue);
}

function testWorstRankIsRed() {
  check("the last rank gets the worst hue", rankHue(5, 5) === RESULTS.worstHue);
}

function testMiddleRankIsBetween() {
  const middle = rankHue(3, 5);
  let isBetween = false;
  if (middle < RESULTS.bestHue && middle > RESULTS.worstHue) isBetween = true;
  check("a middle rank lies between best and worst", isBetween);
}

function testSingleResultIsGreen() {
  check("a single result gets the best hue", rankHue(1, 1) === RESULTS.bestHue);
}

testBestRankIsGreen();
testWorstRankIsRed();
testMiddleRankIsBetween();
testSingleResultIsGreen();
