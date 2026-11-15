import math

import numpy as np


def window_for_latitude(lat, width):
    cos_lat = math.cos(math.radians(lat))
    if cos_lat <= 0:
        return width

    window = round(1 / cos_lat)
    if window % 2 == 0:
        window = window + 1
    return min(window, width)


def average_row(row, window):
    if window >= row.size:
        return np.full(row.size, row.mean())
    if window == 1:
        return row.astype(float)

    half = window // 2
    padded = np.concatenate([row[-half:], row, row[:half]])
    sums = np.concatenate([[0], np.cumsum(padded)])
    return (sums[window:] - sums[:-window]) / window


def blur_longitude_by_latitude(grid, pixels_per_degree):
    blurred = np.empty(grid.shape, dtype=float)
    for row in range(grid.shape[0]):
        lat = 90 - (row + 0.5) / pixels_per_degree
        window = window_for_latitude(lat, grid.shape[1])
        blurred[row] = average_row(grid[row], window)
    return blurred
