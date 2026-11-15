import { elevationAtVertex, elevationToRadius } from "./terrainMath.js";

function fixPoleNormals(geometry) {
  const normals = geometry.attributes.normal;
  const uvs = geometry.attributes.uv;
  for (let index = 0; index < normals.count; index++) {
    const v = uvs.getY(index);
    if (v === 1) normals.setXYZ(index, 0, 1, 0);
    if (v === 0) normals.setXYZ(index, 0, -1, 0);
  }
  normals.needsUpdate = true;
}

export function applyElevation(geometry, grid, exaggeration) {
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;

  for (let index = 0; index < positions.count; index++) {
    const km = elevationAtVertex(uvs.getX(index), uvs.getY(index), grid);
    const radius = elevationToRadius(km, exaggeration);
    positions.setXYZ(
      index,
      positions.getX(index) * radius,
      positions.getY(index) * radius,
      positions.getZ(index) * radius,
    );
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  fixPoleNormals(geometry);
  geometry.computeBoundingSphere();
}
