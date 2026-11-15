import { createMinHeap, isHeapEmpty, popSmallest, pushItem } from "../data/minHeap.js";
import { distanceKm, toUnitVector } from "../data/geo.js";
import { buildRouteGrid, computeCostField, nodeIndexAt, tracePath } from "../data/routes.js";
import { isOverlapping, stackBoxes } from "../view/labelStack.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeSlopeGrid(fillValue) {
  const width = 72;
  const height = 36;
  const values = [];
  for (let index = 0; index < width * height; index++) {
    values.push(fillValue);
  }
  return {
    width: width,
    height: height,
    values: values,
  };
}

function setSlopeAt(grid, lat, lon, value) {
  const row = Math.floor(((90 - lat) / 180) * grid.height);
  const column = Math.floor(((lon + 180) / 360) * grid.width);
  grid.values[row * grid.width + column] = value;
}

function makeSettings() {
  return {
    maxDriveSlopeDeg: 10,
    slopeCostPerDegree: 0.1,
  };
}

function testHeapPopsInOrder() {
  const heap = createMinHeap();
  pushItem(heap, "c", 3);
  pushItem(heap, "a", 1);
  pushItem(heap, "b", 2);
  const order = [];
  while (!isHeapEmpty(heap)) {
    order.push(popSmallest(heap).value);
  }
  check("heap pops the cheapest first", order.join("") === "abc");
}

function testFlatRouteIsCloseToStraightLine() {
  const routeGrid = buildRouteGrid(makeSlopeGrid(0), 5);
  const source = nodeIndexAt(routeGrid, 2.5, 2.5);
  const start = nodeIndexAt(routeGrid, 2.5, 42.5);
  const field = computeCostField(routeGrid, [source], makeSettings());
  const straight = distanceKm(toUnitVector(2.5, 2.5), toUnitVector(2.5, 42.5));
  check("flat route km is close to straight km", Math.abs(field.routeKm[start] - straight) < 5);
}

function testSteepWallForcesADetour() {
  const slopeGrid = makeSlopeGrid(0);
  for (let lat = -42.5; lat <= 42.5; lat += 5) {
    setSlopeAt(slopeGrid, lat, 22.5, 30);
  }
  const routeGrid = buildRouteGrid(slopeGrid, 5);
  const source = nodeIndexAt(routeGrid, 2.5, 2.5);
  const start = nodeIndexAt(routeGrid, 2.5, 42.5);
  const field = computeCostField(routeGrid, [source], makeSettings());
  const straight = distanceKm(toUnitVector(2.5, 2.5), toUnitVector(2.5, 42.5));
  check("steep wall forces a detour", field.routeKm[start] > straight * 1.5 && field.routeKm[start] < Infinity);
}

function testDepositOnSteepGroundIsUnreachable() {
  const slopeGrid = makeSlopeGrid(0);
  setSlopeAt(slopeGrid, 2.5, 2.5, 30);
  const routeGrid = buildRouteGrid(slopeGrid, 5);
  const source = nodeIndexAt(routeGrid, 2.5, 2.5);
  const start = nodeIndexAt(routeGrid, 2.5, 42.5);
  const field = computeCostField(routeGrid, [source], makeSettings());
  check("deposit on steep ground is unreachable", field.cost[start] === Infinity);
}

function testPathEndsAtTheDeposit() {
  const routeGrid = buildRouteGrid(makeSlopeGrid(0), 5);
  const source = nodeIndexAt(routeGrid, 2.5, 2.5);
  const start = nodeIndexAt(routeGrid, 2.5, 42.5);
  const field = computeCostField(routeGrid, [source], makeSettings());
  const path = tracePath(routeGrid, field, start);
  const end = path[path.length - 1];
  check("path ends at the deposit", end.lat === 2.5 && end.lon === 2.5);
}

function makeBox(x, y) {
  return {
    x: x,
    y: y,
    width: 100,
    height: 20,
  };
}

function testOverlappingLabelsStackBelowEachOther() {
  const boxes = [makeBox(10, 10), makeBox(15, 12), makeBox(12, 8)];
  stackBoxes(boxes, 2);
  let isStacked = false;
  if (boxes[1].y === 32 && boxes[2].y === 54) isStacked = true;
  check("overlapping labels stack below each other", isStacked);
}

function testSeparateLabelsStayPut() {
  const boxes = [makeBox(10, 10), makeBox(300, 10)];
  stackBoxes(boxes, 2);
  check("separate labels stay where they are", boxes[1].y === 10 && !isOverlapping(boxes[0], boxes[1]));
}

testHeapPopsInOrder();
testFlatRouteIsCloseToStraightLine();
testSteepWallForcesADetour();
testDepositOnSteepGroundIsUnreachable();
testPathEndsAtTheDeposit();
testOverlappingLabelsStackBelowEachOther();
testSeparateLabelsStayPut();
