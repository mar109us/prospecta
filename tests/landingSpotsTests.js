import { toUnitVector } from "../data/geo.js";
import {
  findLandingSpots,
  pickSeparated,
  scoreCandidate,
  surroundingSlope,
} from "../data/landingSpots.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeGrid(name, fillValue) {
  const width = 72;
  const height = 36;
  const values = [];
  for (let index = 0; index < width * height; index++) {
    values.push(fillValue);
  }
  return {
    name: name,
    width: width,
    height: height,
    values: values,
  };
}

function setValueAt(grid, lat, lon, value) {
  const row = Math.floor(((90 - lat) / 180) * grid.height);
  const column = Math.floor(((lon + 180) / 360) * grid.width);
  grid.values[row * grid.width + column] = value;
}

function makeSettings() {
  return {
    richTopFraction: 0.0001,
    routeStepDeg: 5,
    maxDriveSlopeDeg: 10,
    slopeCostPerDegree: 0.1,
    searchStepDeg: 5,
    surroundingsRadiusKm: 50,
    slopePenaltyKmPerDegree: 20,
    minSeparationKm: 200,
    resultCount: 5,
  };
}

function testEqualDistancesBeatUnevenOnes() {
  const even = scoreCandidate([100, 100], 0, 20);
  const uneven = scoreCandidate([50, 150], 0, 20);
  check("equal distances beat uneven ones", even < uneven);
}

function testSteepSurroundingsLowerTheRank() {
  const gentle = scoreCandidate([100, 100], 2, 20);
  const steep = scoreCandidate([100, 100], 10, 20);
  check("steep surroundings lower the rank", gentle < steep);
}

function testUniformSlopeAveragesToItself() {
  const slopeGrid = makeGrid("slope", 3);
  check("surrounding slope of uniform ground is that slope", surroundingSlope(slopeGrid, 18, 36, 400) === 3);
}

function testResultsAreFarEnoughApart() {
  const spots = [
    {
      unit: toUnitVector(0, 0),
    },
    {
      unit: toUnitVector(0, 1),
    },
    {
      unit: toUnitVector(0, 30),
    },
  ];
  const picked = pickSeparated(spots, 5, 200);
  check("results are at least 200 km apart", picked.length === 2 && picked[1] === spots[2]);
}

function testBestSpotLiesBetweenTwoDeposits() {
  const iron = makeGrid("iron", 0);
  const silicon = makeGrid("silicon", 0);
  setValueAt(iron, 2.5, -27.5, 100);
  setValueAt(silicon, 2.5, 27.5, 100);

  const spots = findLandingSpots({
    resourceGrids: [
      {
        name: "iron",
        grid: iron,
      },
      {
        name: "silicon",
        grid: silicon,
      },
    ],
    slopeGrid: makeGrid("slope", 0),
    flatLimitDeg: 5,
    settings: makeSettings(),
  });
  check("best spot lies between two deposits", Math.abs(spots[0].lon) <= 5);
}

testEqualDistancesBeatUnevenOnes();
testSteepSurroundingsLowerTheRank();
testUniformSlopeAveragesToItself();
testResultsAreFarEnoughApart();
testBestSpotLiesBetweenTwoDeposits();
