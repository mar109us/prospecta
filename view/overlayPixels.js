export const MAX_LAYERS = 4;

export function valueToByte(value, displayMin, displayMax) {
  if (value === null) return 0;
  if (displayMax === displayMin) return 255;

  const t = (value - displayMin) / (displayMax - displayMin);
  const clamped = Math.min(Math.max(t, 0), 1);
  return Math.round(clamped * 255);
}

function checkGrids(grids) {
  if (grids.length === 0 || grids.length > MAX_LAYERS) {
    throw new Error(
      `The overlay needs 1 to ${MAX_LAYERS} datasets, but got ${grids.length}.`,
    );
  }

  const first = grids[0];
  for (const grid of grids) {
    if (grid.width !== first.width || grid.height !== first.height) {
      throw new Error(
        `Dataset "${grid.name}" is ${grid.width}x${grid.height}, but "${first.name}" is ${first.width}x${first.height}. All overlay datasets must be the same size.`,
      );
    }
  }
}

function fillChannel(pixels, grid, channel) {
  for (let row = 0; row < grid.height; row++) {
    const textureRow = grid.height - 1 - row;

    for (let column = 0; column < grid.width; column++) {
      const value = grid.values[row * grid.width + column];
      const index = (textureRow * grid.width + column) * 4;
      pixels[index + channel] = valueToByte(value, grid.displayMin, grid.displayMax);
    }
  }
}

export function buildLayerPixels(grids) {
  checkGrids(grids);
  const pixels = new Uint8Array(grids[0].width * grids[0].height * 4);

  for (let channel = 0; channel < grids.length; channel++) {
    fillChannel(pixels, grids[channel], channel);
  }

  return pixels;
}
