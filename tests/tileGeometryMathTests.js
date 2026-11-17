import { buildTileArrays, coarseSurfaceNormal, coarseSurfacePoint } from "../view/tileGeometryMath.js";
import { elevationToRadius, latLonToScenePosition } from "../view/terrainMath.js";

const SEGMENTS = 4;

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function isClose(a, b) {
  return Math.abs(a - b) < 0.00001;
}

function makeCoarseGrid() {
  const values = [];
  for (let index = 0; index < 720 * 360; index++) {
    values.push(1);
  }
  return {
    width: 720,
    height: 360,
    values: values,
  };
}

function makeCoarseNormals() {
  const normals = new Float32Array(721 * 361 * 3);
  for (let row = 0; row <= 360; row++) {
    for (let column = 0; column <= 720; column++) {
      const normal = latLonToScenePosition(90 - row / 2, -180 + column / 2, 1);
      normals.set([normal.x, normal.y, normal.z], (row * 721 + column) * 3);
    }
  }
  return normals;
}

const COARSE_NORMALS = makeCoarseNormals();

function makeBuild(fineMetres) {
  const heights = new Int16Array((SEGMENTS + 1) * (SEGMENTS + 1));
  heights.fill(fineMetres);
  return {
    tile: {
      id: "test",
      south: 0,
      north: 5,
      west: 10,
      east: 15,
    },
    heights: heights,
    coarseGrid: makeCoarseGrid(),
    coarseMesh: {
      width: 720,
      height: 360,
      normals: COARSE_NORMALS,
    },
    exaggeration: 3,
    segments: SEGMENTS,
    blendVertices: 2,
  };
}

function pointAt(positions, index) {
  return {
    x: positions[index * 3],
    y: positions[index * 3 + 1],
    z: positions[index * 3 + 2],
  };
}

function vertexAt(arrays, index) {
  return pointAt(arrays.finePositions, index);
}

function isSamePoint(a, b) {
  return isClose(a.x, b.x) && isClose(a.y, b.y) && isClose(a.z, b.z);
}

function testFirstVertexIsNorthWestCorner() {
  const arrays = buildTileArrays(makeBuild(1000));
  check("first vertex uv is the north-west corner", isClose(arrays.uvs[0], 190 / 360) && isClose(arrays.uvs[1], 95 / 180));
}

function testEdgeVerticesUseCoarseHeight() {
  const build = makeBuild(5000);
  const arrays = buildTileArrays(build);
  const expected = coarseSurfacePoint(build, 5, 10);
  check("edge vertices sit on the coarse surface", isSamePoint(vertexAt(arrays, 0), expected));
}

function testCentreVertexUsesFineHeight() {
  const arrays = buildTileArrays(makeBuild(5000));
  const centreIndex = 2 * (SEGMENTS + 1) + 2;
  const centre = vertexAt(arrays, centreIndex);
  const radius = Math.hypot(centre.x, centre.y, centre.z);
  check("centre vertex uses the fine height", isClose(radius, elevationToRadius(5, 3)));
}

function testNormalsAreRadialUnitVectors() {
  const arrays = buildTileArrays(makeBuild(1000));
  const length = Math.hypot(arrays.normals[0], arrays.normals[1], arrays.normals[2]);
  const position = vertexAt(arrays, 0);
  const positionLength = Math.hypot(position.x, position.y, position.z);
  check("normals are radial unit vectors", isClose(length, 1) && isClose(arrays.normals[0], position.x / positionLength));
}

function testIndexCount() {
  const arrays = buildTileArrays(makeBuild(1000));
  check("index count is segments squared times 6", arrays.indices.length === SEGMENTS * SEGMENTS * 6);
}

function testRejectsWrongHeightCount() {
  const build = makeBuild(1000);
  build.heights = new Int16Array(3);
  let hasThrown = false;
  try {
    buildTileArrays(build);
  } catch (error) {
    hasThrown = true;
  }
  check("rejects a height file of the wrong size", hasThrown);
}

function testTrianglesFaceOutwards() {
  const arrays = buildTileArrays(makeBuild(1000));
  const a = vertexAt(arrays, arrays.indices[0]);
  const b = vertexAt(arrays, arrays.indices[1]);
  const c = vertexAt(arrays, arrays.indices[2]);
  const ab = {
    x: b.x - a.x,
    y: b.y - a.y,
    z: b.z - a.z,
  };
  const ac = {
    x: c.x - a.x,
    y: c.y - a.y,
    z: c.z - a.z,
  };
  const facing = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  const outwards = facing.x * a.x + facing.y * a.y + facing.z * a.z;
  check("triangles face away from the Moon's centre", outwards > 0);
}

function testCoarsePositionsStartOnCoarseSurface() {
  const build = makeBuild(5000);
  const arrays = buildTileArrays(build);
  const centreIndex = 2 * (SEGMENTS + 1) + 2;
  const expected = coarseSurfacePoint(build, 2.5, 12.5);
  check("morph start uses the coarse surface", isSamePoint(pointAt(arrays.coarsePositions, centreIndex), expected));
}

function testCoarsePointAtVertexIsTheVertex() {
  const build = makeBuild(1000);
  const expected = latLonToScenePosition(10, 20, elevationToRadius(1, 3));
  check("coarse point at a mesh vertex is that vertex", isSamePoint(coarseSurfacePoint(build, 10, 20), expected));
}

function testCoarsePointOnDiagonalIsAverage() {
  const build = makeBuild(1000);
  const topLeft = coarseSurfacePoint(build, 10, 20);
  const bottomRight = coarseSurfacePoint(build, 9.5, 20.5);
  const middle = coarseSurfacePoint(build, 9.75, 20.25);
  const average = {
    x: (topLeft.x + bottomRight.x) / 2,
    y: (topLeft.y + bottomRight.y) / 2,
    z: (topLeft.z + bottomRight.z) / 2,
  };
  check("coarse point follows the flat mesh triangle", isSamePoint(middle, average));
}

function testCoarseNormalAtVertexIsThatNormal() {
  const build = makeBuild(1000);
  const expected = latLonToScenePosition(10, 20, 1);
  check("coarse normal at a mesh vertex is that vertex's normal", isSamePoint(coarseSurfaceNormal(build, 10, 20), expected));
}

function testTileArraysCarryCoarseNormals() {
  const arrays = buildTileArrays(makeBuild(1000));
  const expected = latLonToScenePosition(5, 10, 1);
  check("tile vertices carry the coarse normal", isSamePoint(pointAt(arrays.coarseNormals, 0), expected));
}

testFirstVertexIsNorthWestCorner();
testCoarseNormalAtVertexIsThatNormal();
testTileArraysCarryCoarseNormals();
testCoarsePositionsStartOnCoarseSurface();
testCoarsePointAtVertexIsTheVertex();
testCoarsePointOnDiagonalIsAverage();
testTrianglesFaceOutwards();
testEdgeVerticesUseCoarseHeight();
testCentreVertexUsesFineHeight();
testNormalsAreRadialUnitVectors();
testIndexCount();
testRejectsWrongHeightCount();
