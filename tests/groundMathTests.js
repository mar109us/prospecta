import { tileContains, tileSurfaceRadius } from "../view/groundMath.js";

const TILE = {
  south: 0,
  north: 10,
  west: 0,
  east: 10,
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

function oneCellTile(heights) {
  const positions = [];
  for (const height of heights) {
    positions.push(0, 0, height);
  }
  return positions;
}

function testFlatCellGivesConstantRadius() {
  const positions = oneCellTile([1.02, 1.02, 1.02, 1.02]);
  check("flat cell gives constant radius", isClose(tileSurfaceRadius(positions, TILE, 1, 3, 6), 1.02));
}

function testPointOnVertexReturnsThatVertex() {
  const positions = oneCellTile([1.1, 1, 1, 1]);
  check("point on top-left vertex returns that vertex", isClose(tileSurfaceRadius(positions, TILE, 1, 10, 0), 1.1));
}

function testUpperRightTriangleUsesTopRight() {
  const positions = oneCellTile([1, 2, 1, 1]);
  check("upper-right triangle uses the top-right corner", isClose(tileSurfaceRadius(positions, TILE, 1, 7.5, 7.5), 1.5));
}

function testLowerLeftTriangleIgnoresTopRight() {
  const positions = oneCellTile([1, 2, 1, 1]);
  check("lower-left triangle ignores the top-right corner", isClose(tileSurfaceRadius(positions, TILE, 1, 2.5, 2.5), 1));
}

function testTileContains() {
  check("point inside the tile is contained", tileContains(TILE, 5, 5));
  check("point outside the tile is not contained", !tileContains(TILE, 5, 11));
}

testFlatCellGivesConstantRadius();
testPointOnVertexReturnsThatVertex();
testUpperRightTriangleUsesTopRight();
testLowerLeftTriangleIgnoresTopRight();
testTileContains();
