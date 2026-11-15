import { elevationAtVertex, elevationToRadius } from "../view/terrainMath.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeGrid() {
  return {
    width: 4,
    height: 2,
    values: [1, 2, 3, 4, 5, 6, 7, 8],
  };
}

function testSeamVerticesMatch() {
  const grid = makeGrid();
  check(
    "seam vertices at u 0 and u 1 match",
    elevationAtVertex(0, 0.5, grid) === elevationAtVertex(1, 0.5, grid),
  );
}

function testNorthPoleUsesTopRowAverage() {
  check("north pole uses top row average", elevationAtVertex(0.25, 1, makeGrid()) === 2.5);
}

function testCornerAveragesFourCells() {
  check("corner averages the 4 touching cells", elevationAtVertex(0.25, 0.5, makeGrid()) === 3.5);
}

function testZeroKmKeepsRadius1() {
  check("0 km keeps radius 1", elevationToRadius(0, 10) === 1);
}

function testTenKmAt10xLiftsAbout58Percent() {
  const radius = elevationToRadius(10, 10);
  check("10 km at 10x lifts by about 5.8%", radius > 1.057 && radius < 1.058);
}

testSeamVerticesMatch();
testNorthPoleUsesTopRowAverage();
testCornerAveragesFourCells();
testZeroKmKeepsRadius1();
testTenKmAt10xLiftsAbout58Percent();
