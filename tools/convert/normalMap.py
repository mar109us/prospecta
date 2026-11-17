import math

import numpy as np

MOON_RADIUS_M = 1737400
MIN_COS_LAT = 0.05


def blur_along_rows(values, window, mode):
    half = window // 2
    padded = np.pad(values, ((0, 0), (half, half)), mode=mode)
    sums = np.cumsum(padded, axis=1)
    sums = np.concatenate([np.zeros((values.shape[0], 1)), sums], axis=1)
    return (sums[:, window:] - sums[:, :-window]) / window


def moving_average(elevation, window):
    along_lon = blur_along_rows(elevation, window, "wrap")
    along_lat = blur_along_rows(along_lon.T, window, "edge").T
    return along_lat


def fine_detail(elevation, window):
    return elevation - moving_average(elevation, window)


def slopes(detail, pixels_per_degree):
    height = detail.shape[0]
    pixel_north_m = (2 * math.pi * MOON_RADIUS_M / 360) / pixels_per_degree
    lats = 90 - (np.arange(height) + 0.5) / pixels_per_degree
    cos_lats = np.maximum(np.cos(np.radians(lats)), MIN_COS_LAT)
    pixel_east_m = pixel_north_m * cos_lats[:, np.newaxis]

    east_neighbour = np.roll(detail, -1, axis=1)
    west_neighbour = np.roll(detail, 1, axis=1)
    slope_east = (east_neighbour - west_neighbour) / (2 * pixel_east_m)

    north_neighbour = np.vstack([detail[:1], detail[:-1]])
    south_neighbour = np.vstack([detail[1:], detail[-1:]])
    slope_north = (north_neighbour - south_neighbour) / (2 * pixel_north_m)

    return slope_east, slope_north


def tile_slopes(elevation, lats, pixels_per_degree, factor):
    pixel_north_m = (2 * math.pi * MOON_RADIUS_M / 360) / pixels_per_degree
    cos_lats = np.maximum(np.cos(np.radians(lats)), MIN_COS_LAT)
    pixel_east_m = pixel_north_m * factor * cos_lats[:, np.newaxis]

    slope_east = (elevation[1:-1, 2:] - elevation[1:-1, :-2]) / (2 * pixel_east_m)
    slope_north = (elevation[:-2, 1:-1] - elevation[2:, 1:-1]) / (2 * pixel_north_m)
    return slope_east, slope_north


def encode_normals(slope_east, slope_north, strength):
    x = -slope_east * strength
    y = -slope_north * strength
    z = np.ones_like(x)
    length = np.sqrt(x * x + y * y + z * z)
    normals = np.stack([x / length, y / length, z / length], axis=-1)
    return np.round((normals + 1) / 2 * 255).astype(np.uint8)


def write_ppm(rgb, path):
    height, width = rgb.shape[0], rgb.shape[1]
    header = f"P6\n{width} {height}\n255\n".encode()
    with open(path, "wb") as file:
        file.write(header)
        file.write(rgb.tobytes())
