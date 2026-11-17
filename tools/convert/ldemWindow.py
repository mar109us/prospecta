import numpy as np

LOLA_256 = {
    "height": 46080,
    "width": 92160,
    "pixels_per_degree": 256,
    "metres_per_unit": 0.5,
    "header_bytes": 738233,
    "west_lon": -180,
}


def open_ldem(path, ldem):
    shape = (ldem["height"], ldem["width"])
    return np.memmap(path, dtype="<i2", mode="r", offset=ldem["header_bytes"], shape=shape)


def read_columns(source, first_row, last_row, first_column, count):
    width = source.shape[1]
    start = first_column % width
    end = start + count
    if end <= width:
        return np.array(source[first_row:last_row, start:end])
    left = np.array(source[first_row:last_row, start:width])
    right = np.array(source[first_row:last_row, 0:end - width])
    return np.concatenate([left, right], axis=1)


def read_window(source, first_row, rows, first_column, columns):
    height = source.shape[0]
    top = max(first_row, 0)
    bottom = min(first_row + rows, height)
    window = read_columns(source, top, bottom, first_column, columns)
    missing_above = top - first_row
    missing_below = first_row + rows - bottom
    return np.pad(window, ((missing_above, missing_below), (0, 0)), mode="edge")


def block_average(window, block_rows, block_columns):
    rows = window.shape[0] // block_rows
    columns = window.shape[1] // block_columns
    blocks = window.reshape(rows, block_rows, columns, block_columns)
    return blocks.mean(axis=(1, 3))


def tile_origin(tile, ldem):
    pixels_per_degree = ldem["pixels_per_degree"]
    first_row = (90 - tile["north"]) * pixels_per_degree
    first_column = ((tile["west"] - ldem["west_lon"]) % 360) * pixels_per_degree
    return first_row, first_column


def corner_heights_m(source, tile, ldem, segments, factor):
    first_row, first_column = tile_origin(tile, ldem)
    step = ldem["pixels_per_degree"] * (tile["north"] - tile["south"]) // segments
    half = step // 2
    corners = segments + 1
    window = read_window(
        source,
        first_row - half,
        corners * step,
        first_column - half * factor,
        corners * step * factor,
    )
    return block_average(window, step, step * factor) * ldem["metres_per_unit"]


def pixel_heights_m(source, tile, ldem, size, factor):
    first_row, first_column = tile_origin(tile, ldem)
    scale = ldem["pixels_per_degree"] * (tile["north"] - tile["south"]) // size
    window = read_window(
        source,
        first_row - scale,
        (size + 2) * scale,
        first_column - scale * factor,
        (size + 2) * scale * factor,
    )
    return block_average(window, scale, scale * factor) * ldem["metres_per_unit"]
