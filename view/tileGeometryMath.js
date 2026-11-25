import { blendWeight } from "./detailMath.js";
import { elevationAtVertex, elevationToRadius, latLonToScenePosition } from "./terrainMath.js";

function coarseVertex(build, row, column) {
  const mesh = build.coarseMesh;
  const lat = 90 - (row / mesh.height) * 180;
  const lon = -180 + (column / mesh.width) * 360;
  const km = elevationAtVertex(column / mesh.width, 1 - row / mesh.height, build.coarseGrid);
  return latLonToScenePosition(lat, lon, elevationToRadius(km, build.exaggeration));
}

function coarseNormal(build, row, column) {
  const index = (row * (build.coarseMesh.width + 1) + column) * 3;
  const normals = build.coarseMesh.normals;
  return {
    x: normals[index],
    y: normals[index + 1],
    z: normals[index + 2],
  };
}

function addScaled(start, from, to, amount) {
  return {
    x: start.x + (to.x - from.x) * amount,
    y: start.y + (to.y - from.y) * amount,
    z: start.z + (to.z - from.z) * amount,
  };
}

function coarseCell(mesh, lat, lon) {
  const columnPosition = ((lon + 180) / 360) * mesh.width;
  const rowPosition = ((90 - lat) / 180) * mesh.height;
  const column = Math.min(Math.floor(columnPosition), mesh.width - 1);
  const row = Math.min(Math.floor(rowPosition), mesh.height - 1);
  return {
    row: row,
    column: column,
    across: columnPosition - column,
    down: rowPosition - row,
  };
}

function onCoarseTriangle(build, cell, valueAt) {
  const topLeft = valueAt(build, cell.row, cell.column);
  const topRight = valueAt(build, cell.row, cell.column + 1);
  const bottomLeft = valueAt(build, cell.row + 1, cell.column);
  const bottomRight = valueAt(build, cell.row + 1, cell.column + 1);

  if (cell.down <= cell.across) {
    const alongTop = addScaled(topLeft, topLeft, topRight, cell.across);
    return addScaled(alongTop, topRight, bottomRight, cell.down);
  }
  const alongLeft = addScaled(topLeft, topLeft, bottomLeft, cell.down);
  return addScaled(alongLeft, bottomLeft, bottomRight, cell.across);
}

export function coarseSurfacePoint(build, lat, lon) {
  return onCoarseTriangle(build, coarseCell(build.coarseMesh, lat, lon), coarseVertex);
}

export function coarseSurfaceNormal(build, lat, lon) {
  return onCoarseTriangle(build, coarseCell(build.coarseMesh, lat, lon), coarseNormal);
}

function finePoint(build, row, column, lat, lon) {
  const km = build.heights[row * (build.segments + 1) + column] / 1000;
  return latLonToScenePosition(lat, lon, elevationToRadius(km, build.exaggeration));
}

function fillVertices(build, arrays) {
  const tile = build.tile;
  const corners = build.segments + 1;
  for (let row = 0; row < corners; row++) {
    const lat = tile.north - (row / build.segments) * (tile.north - tile.south);
    for (let column = 0; column < corners; column++) {
      const lon = tile.west + (column / build.segments) * (tile.east - tile.west);
      const coarse = coarseSurfacePoint(build, lat, lon);
      const weight = blendWeight(row, column, build.segments, build.blendVertices);
      const fine = addScaled(coarse, coarse, finePoint(build, row, column, lat, lon), weight);
      const normal = latLonToScenePosition(lat, lon, 1);
      const coarseNormalHere = coarseSurfaceNormal(build, lat, lon);
      const index = row * corners + column;
      arrays.coarsePositions.set([coarse.x, coarse.y, coarse.z], index * 3);
      arrays.finePositions.set([fine.x, fine.y, fine.z], index * 3);
      arrays.normals.set([normal.x, normal.y, normal.z], index * 3);
      arrays.coarseNormals.set([coarseNormalHere.x, coarseNormalHere.y, coarseNormalHere.z], index * 3);
      arrays.uvs.set([(lon + 180) / 360, (lat + 90) / 180], index * 2);
    }
  }
}

export function fillIndices(segments, indices) {
  const corners = segments + 1;
  let next = 0;
  for (let row = 0; row < segments; row++) {
    for (let column = 0; column < segments; column++) {
      const topLeft = row * corners + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + corners;
      const bottomRight = bottomLeft + 1;
      indices.set([topLeft, bottomLeft, bottomRight, topLeft, bottomRight, topRight], next);
      next += 6;
    }
  }
}

export function buildTileArrays(build) {
  const vertexCount = (build.segments + 1) * (build.segments + 1);
  if (build.heights.length !== vertexCount) {
    throw new Error(`Tile ${build.tile.id} has ${build.heights.length} heights, expected ${vertexCount}.`);
  }
  const arrays = {
    coarsePositions: new Float32Array(vertexCount * 3),
    finePositions: new Float32Array(vertexCount * 3),
    normals: new Float32Array(vertexCount * 3),
    coarseNormals: new Float32Array(vertexCount * 3),
    uvs: new Float32Array(vertexCount * 2),
    indices: new Uint32Array(build.segments * build.segments * 6),
  };
  fillVertices(build, arrays);
  fillIndices(build.segments, arrays.indices);
  return arrays;
}
