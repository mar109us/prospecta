export function easeInOut(t) {
  if (t < 0.5) return 4 * t * t * t;
  const fromEnd = -2 * t + 2;
  return 1 - (fromEnd * fromEnd * fromEnd) / 2;
}

export function slerpDirection(from, to, t) {
  const dotProduct = Math.min(Math.max(from.x * to.x + from.y * to.y + from.z * to.z, -1), 1);
  const angle = Math.acos(dotProduct);
  if (angle < 0.0001) {
    return {
      x: to.x,
      y: to.y,
      z: to.z,
    };
  }

  const fromWeight = Math.sin((1 - t) * angle) / Math.sin(angle);
  const toWeight = Math.sin(t * angle) / Math.sin(angle);
  return {
    x: from.x * fromWeight + to.x * toWeight,
    y: from.y * fromWeight + to.y * toWeight,
    z: from.z * fromWeight + to.z * toWeight,
  };
}

export function clampTilt(degrees, maxDegrees) {
  return Math.min(Math.max(degrees, 0), maxDegrees);
}

export function zoomOrbitDistance(distance, wheelDelta, zoomRange) {
  const zoomed = distance * Math.pow(zoomRange.step, wheelDelta / 100);
  return Math.min(Math.max(zoomed, zoomRange.min), zoomRange.max);
}
