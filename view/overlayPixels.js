function hexToRgb(hexColour) {
  return {
    red: parseInt(hexColour.slice(1, 3), 16),
    green: parseInt(hexColour.slice(3, 5), 16),
    blue: parseInt(hexColour.slice(5, 7), 16),
  };
}

function easeIn(t) {
  return t * t;
}

export function valueToAlpha(value, minValue, maxValue) {
  if (value === null) return 0;
  if (maxValue === minValue) return 255;

  const t = (value - minValue) / (maxValue - minValue);
  return Math.round(easeIn(t) * 255);
}

export function buildOverlayPixels(grid, hexColour) {
  const colour = hexToRgb(hexColour);
  const pixels = new Uint8Array(grid.width * grid.height * 4);

  for (let row = 0; row < grid.height; row++) {
    const textureRow = grid.height - 1 - row;

    for (let column = 0; column < grid.width; column++) {
      const value = grid.values[row * grid.width + column];
      const index = (textureRow * grid.width + column) * 4;
      pixels[index] = colour.red;
      pixels[index + 1] = colour.green;
      pixels[index + 2] = colour.blue;
      pixels[index + 3] = valueToAlpha(value, grid.min, grid.max);
    }
  }

  return pixels;
}
