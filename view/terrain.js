import { elevationAtVertex, elevationToRadius } from "./terrainMath.js";

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
  geometry.computeBoundingSphere();
}
