import { cellCentre, distanceKm, toUnitVector } from "../data/geo.js";
import { richThreshold } from "../data/richCells.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function testSamePointIsZeroKm() {
  const point = toUnitVector(10, 20);
  check("same point is 0 km", distanceKm(point, point) < 0.001);
}

function test90DegreesIsAQuarterCircumference() {
  const distance = distanceKm(toUnitVector(0, 0), toUnitVector(0, 90));
  check("90 degrees apart is a quarter circumference", Math.abs(distance - 2729.1) < 1);
}

function testFirstCellCentreIsTopLeft() {
  const grid = {
    width: 720,
    height: 360,
  };
  const centre = cellCentre(grid, 0, 0);
  check("first cell centre is top left", centre.lat === 89.75 && centre.lon === -179.75);
}

function testTop10PercentThreshold() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  check("top 10% threshold is the highest value of 10", richThreshold(values, 0.1) === 10);
}

function testThresholdIgnoresNull() {
  const values = [null, 1, 2, null, 3, 4, 5, 6, 7, 8, 9, 10];
  check("threshold ignores null", richThreshold(values, 0.1) === 10);
}

testSamePointIsZeroKm();
test90DegreesIsAQuarterCircumference();
testFirstCellCentreIsTopLeft();
testTop10PercentThreshold();
testThresholdIgnoresNull();
