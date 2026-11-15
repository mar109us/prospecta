function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

export function flattenOnto(vector, normal) {
  const along = dot(vector, normal);
  return normalize({
    x: vector.x - normal.x * along,
    y: vector.y - normal.y * along,
    z: vector.z - normal.z * along,
  });
}

export function turnAround(vector, axis, angle) {
  const side = cross(axis, vector);
  return {
    x: vector.x * Math.cos(angle) + side.x * Math.sin(angle),
    y: vector.y * Math.cos(angle) + side.y * Math.sin(angle),
    z: vector.z * Math.cos(angle) + side.z * Math.sin(angle),
  };
}

export function cameraPosition(view) {
  const up = normalize(view.point);
  const tilt = (view.tilt * Math.PI) / 180;
  const upAmount = Math.cos(tilt) * view.distance;
  const backAmount = Math.sin(tilt) * view.distance;
  return {
    x: view.point.x + up.x * upAmount - view.away.x * backAmount,
    y: view.point.y + up.y * upAmount - view.away.y * backAmount,
    z: view.point.z + up.z * upAmount - view.away.z * backAmount,
  };
}
