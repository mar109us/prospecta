import {
  blendWeight,
  levelLook,
  lookPoint,
  maskCells,
  stepLevel,
  tileDistanceDeg,
  tileLookWeight,
  tileUvTransform,
  wantedTiles,
  wrapDegrees,
} from "../view/detailMath.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function isClose(a, b) {
  return Math.abs(a - b) < 0.000001;
}

function makeTile(south, west, width) {
  return {
    id: `${south}_${west}`,
    south: south,
    north: south + 5,
    west: west,
    east: west + width,
  };
}

function testUvTransformMapsTileCornersToZeroAndOne() {
  const tile = makeTile(0, 0, 5);
  const transform = tileUvTransform(tile);
  const westU = (tile.west + 180) / 360;
  const eastU = (tile.east + 180) / 360;
  const southV = (tile.south + 90) / 180;
  const localWest = westU * transform.repeatU + transform.offsetU;
  const localEast = eastU * transform.repeatU + transform.offsetU;
  const localSouth = southV * transform.repeatV + transform.offsetV;
  check("uv transform maps tile corners to 0 and 1", isClose(localWest, 0) && isClose(localEast, 1) && isClose(localSouth, 0));
}

function testMaskCellsStartAtSouthWest() {
  const cells = maskCells(makeTile(-90, -180, 5));
  check("mask cell row 0 is the south pole", cells.length === 1 && cells[0].row === 0 && cells[0].column === 0);
}

function testWideTileCoversSeveralMaskCells() {
  check("a 60 degree wedge covers 12 mask cells", maskCells(makeTile(85, -180, 60)).length === 12);
}

function testLookPointHitsTheNearSide() {
  const position = {
    x: 0,
    y: 0,
    z: 3,
  };
  const forward = {
    x: 0,
    y: 0,
    z: -1,
  };
  const point = lookPoint(position, forward);
  check("looking straight down hits the near side", isClose(point.z, 1));
}

function testLookPointMissesWhenLookingAway() {
  const position = {
    x: 0,
    y: 0,
    z: 3,
  };
  const forward = {
    x: 0,
    y: 1,
    z: 0,
  };
  check("looking past the Moon gives null", lookPoint(position, forward) === null);
}

function testWrapDegrees() {
  check("wraps 190 to -170", isClose(wrapDegrees(190), -170) && isClose(wrapDegrees(-190), 170));
}

function testDistanceInsideTileIsZero() {
  check("a point inside a tile is 0 degrees away", isClose(tileDistanceDeg(makeTile(0, 0, 5), 2, 2), 0));
}

function testDistanceWrapsAcross180() {
  const distance = tileDistanceDeg(makeTile(0, -180, 5), 0, 179);
  check("distance wraps across 180 degrees", isClose(distance, 1));
}

function testWantedTilesAreNearestFirst() {
  const tiles = [makeTile(0, 20, 5), makeTile(0, 0, 5), makeTile(0, 5, 5)];
  const settings = {
    loadRadiusDeg: 8,
    maxTiles: 2,
  };
  const wanted = wantedTiles(tiles, 2, 2, settings);
  check("wanted tiles are nearest first and capped", wanted.length === 2 && wanted[0].west === 0 && wanted[1].west === 5);
}

function testBlendIsZeroAtEdgeAndOneInside() {
  const atEdge = blendWeight(0, 50, 160, 8);
  const inside = blendWeight(80, 80, 160, 8);
  const halfway = blendWeight(4, 80, 160, 8);
  check("blend is 0 at the edge, 1 inside", atEdge === 0 && inside === 1 && halfway === 0.5);
}

function makeTiming() {
  return {
    fadeMs: 800,
    morphMs: 1200,
  };
}

function testLevelFadesBeforeMorphing() {
  const level = stepLevel(0, 2, 400, makeTiming());
  check("fading in takes fadeMs per level", isClose(level, 0.5));
}

function testLevelStopsAtOneBetweenPhases() {
  const level = stepLevel(0.9, 2, 400, makeTiming());
  check("level stops at 1 between fade and morph", level === 1);
}

function testLevelReachesTwoAfterFadeAndMorph() {
  let level = 0;
  for (let frame = 0; frame < 125; frame++) {
    level = stepLevel(level, 2, 16, makeTiming());
  }
  check("level reaches 2 after fade + morph (2 s)", level === 2);
}

function testLevelGoesBackDown() {
  const level = stepLevel(2, 0, 600, makeTiming());
  check("leaving morphs back first", isClose(level, 1.5));
}

function testLookAtLevelOneIsMaskedAndFlat() {
  const look = levelLook(1);
  check("level 1 is fully opaque, masked, not morphed", look.opacity === 1 && look.isMasked && look.morph === 0);
}

function testLookAtZeroIsHidden() {
  const look = levelLook(0);
  check("level 0 is hidden and unmasked", !look.isVisible && !look.isMasked);
}

function onlyCell(onColumn, onRow) {
  return (column, row) => {
    if (column === onColumn && row === onRow) return 1;
    return 0;
  };
}

function everyCell() {
  return () => 1;
}

function cellUv(column, row, acrossCell, upCell) {
  return {
    u: (column + acrossCell) / 72,
    v: (row + upCell) / 36,
  };
}

function testFeatherIsCoarseAtEdgeNextToCoarse() {
  const point = cellUv(36, 18, 0.001, 0.5);
  check("feather is coarse right at an edge next to coarse ground", tileLookWeight(point.u, point.v, onlyCell(36, 18), 1) < 0.01);
}

function testFeatherIsTileLookInTheMiddle() {
  const point = cellUv(36, 18, 0.5, 0.5);
  check("feather is tile look in the middle of a lone tile", tileLookWeight(point.u, point.v, onlyCell(36, 18), 1) === 1);
}

function testNoFeatherBetweenTwoShownTiles() {
  const point = cellUv(36, 18, 0.001, 0.5);
  check("no feather where the neighbour tile is shown", tileLookWeight(point.u, point.v, everyCell(), 1) === 1);
}

function testFeatherFollowsNeighbourFade() {
  const point = cellUv(36, 18, 0.001, 0.5);
  const halfShown = (column, row) => {
    if (column === 36 && row === 18) return 1;
    return 0.5;
  };
  const weight = tileLookWeight(point.u, point.v, halfShown, 1);
  check("feather follows a half-faded neighbour", weight > 0.45 && weight < 0.55);
}

function testFeatherWrapsAcross180() {
  const point = cellUv(0, 18, 0.001, 0.5);
  const leftEdgeShown = (column, row) => {
    if (row !== 18) return 1;
    if (column === 0 || column === 71) return 1;
    return 0;
  };
  check("feather checks the neighbour across 180 degrees", tileLookWeight(point.u, point.v, leftEdgeShown, 1) === 1);
}

testUvTransformMapsTileCornersToZeroAndOne();
testMaskCellsStartAtSouthWest();
testWideTileCoversSeveralMaskCells();
testLookPointHitsTheNearSide();
testLookPointMissesWhenLookingAway();
testWrapDegrees();
testDistanceInsideTileIsZero();
testDistanceWrapsAcross180();
testWantedTilesAreNearestFirst();
testBlendIsZeroAtEdgeAndOneInside();
testLevelFadesBeforeMorphing();
testLevelStopsAtOneBetweenPhases();
testLevelReachesTwoAfterFadeAndMorph();
testLevelGoesBackDown();
testLookAtLevelOneIsMaskedAndFlat();
testLookAtZeroIsHidden();
testFeatherIsCoarseAtEdgeNextToCoarse();
testFeatherIsTileLookInTheMiddle();
testNoFeatherBetweenTwoShownTiles();
testFeatherFollowsNeighbourFade();
testFeatherWrapsAcross180();
