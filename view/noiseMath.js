function fraction(value) {
  return value - Math.floor(value);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function wrap(value, period) {
  return ((value % period) + period) % period;
}

export function hash3(x, y, z) {
  return fraction(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
}

export function valueNoise3(x, y, z) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const cellZ = Math.floor(z);
  const tx = smooth(x - cellX);
  const ty = smooth(y - cellY);
  const tz = smooth(z - cellZ);

  const bottomFront = mix(hash3(cellX, cellY, cellZ), hash3(cellX + 1, cellY, cellZ), tx);
  const topFront = mix(hash3(cellX, cellY + 1, cellZ), hash3(cellX + 1, cellY + 1, cellZ), tx);
  const bottomBack = mix(hash3(cellX, cellY, cellZ + 1), hash3(cellX + 1, cellY, cellZ + 1), tx);
  const topBack = mix(hash3(cellX, cellY + 1, cellZ + 1), hash3(cellX + 1, cellY + 1, cellZ + 1), tx);

  const front = mix(bottomFront, topFront, ty);
  const back = mix(bottomBack, topBack, ty);
  return mix(front, back, tz);
}

export function fractalNoise(point, octaves) {
  let total = 0;
  for (let index = 0; index < octaves.length; index++) {
    const octave = octaves[index];
    const shift = index * 17.3;
    const x = point.x / octave.wavelengthMetres + shift;
    const y = point.y / octave.wavelengthMetres + shift;
    const z = point.z / octave.wavelengthMetres + shift;
    total += valueNoise3(x, y, z) * octave.amplitudeMetres;
  }
  return total;
}

export function periodicNoise2(x, y, period) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const tx = smooth(x - cellX);
  const ty = smooth(y - cellY);
  const left = wrap(cellX, period);
  const right = wrap(cellX + 1, period);
  const top = wrap(cellY, period);
  const bottom = wrap(cellY + 1, period);

  const upper = mix(hash3(left, top, 0), hash3(right, top, 0), tx);
  const lower = mix(hash3(left, bottom, 0), hash3(right, bottom, 0), tx);
  return mix(upper, lower, ty);
}

export function periodicFractal2(u, v, periods) {
  let total = 0;
  let weight = 1;
  let weightSum = 0;
  for (const period of periods) {
    total += periodicNoise2(u * period, v * period, period) * weight;
    weightSum += weight;
    weight /= 2;
  }
  return total / weightSum;
}
