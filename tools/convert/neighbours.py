import numpy as np


def ranges_touch(min_a, max_a, min_b, max_b):
    if max_a < min_b:
        return False
    if max_b < min_a:
        return False
    return True


def lons_touch(pixel, other):
    if ranges_touch(pixel["min_lon"], pixel["max_lon"], other["min_lon"], other["max_lon"]):
        return True
    if pixel["min_lon"] == -180 and other["max_lon"] == 180:
        return True
    if pixel["max_lon"] == 180 and other["min_lon"] == -180:
        return True
    return False


def is_touching(pixel, other):
    if not ranges_touch(pixel["min_lat"], pixel["max_lat"], other["min_lat"], other["max_lat"]):
        return False
    return lons_touch(pixel, other)


def pixels_to_arrays(pixels):
    arrays = {}
    for key in ["min_lat", "max_lat", "min_lon", "max_lon"]:
        values = []
        for pixel in pixels:
            values.append(pixel[key])
        arrays[key] = np.array(values)
    return arrays


def find_neighbours(pixel, pixels, arrays):
    is_lat_touching = (arrays["max_lat"] >= pixel["min_lat"]) & (arrays["min_lat"] <= pixel["max_lat"])
    is_lon_touching = (arrays["max_lon"] >= pixel["min_lon"]) & (arrays["min_lon"] <= pixel["max_lon"])

    if pixel["min_lon"] == -180:
        is_lon_touching = is_lon_touching | (arrays["max_lon"] == 180)
    if pixel["max_lon"] == 180:
        is_lon_touching = is_lon_touching | (arrays["min_lon"] == -180)

    neighbours = []
    for index in np.flatnonzero(is_lat_touching & is_lon_touching):
        other = pixels[index]
        if other is not pixel:
            neighbours.append(other)
    return neighbours
