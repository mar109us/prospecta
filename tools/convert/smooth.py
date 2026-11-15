import math

import numpy as np

from grid import DISPLAY_HIGH_PERCENTILE, DISPLAY_LOW_PERCENTILE

TARGET_NOISE_RATIO = 0.2
ERRORS_PER_BAND = 2
MAX_NEIGHBOUR_COUNT = 64


def known_values(pixels, key):
    values = []
    for pixel in pixels:
        if pixel[key] is not None:
            values.append(pixel[key])
    return values


def noise_ratio(pixels):
    values = known_values(pixels, "value")
    uncertainties = known_values(pixels, "uncertainty")
    if len(uncertainties) == 0:
        return 0

    low = np.percentile(values, DISPLAY_LOW_PERCENTILE)
    high = np.percentile(values, DISPLAY_HIGH_PERCENTILE)
    if high == low:
        return 1
    return float(ERRORS_PER_BAND * np.median(uncertainties) / (high - low))


def pixel_centres(pixels):
    centres = []
    for pixel in pixels:
        lat = math.radians((pixel["min_lat"] + pixel["max_lat"]) / 2)
        lon = math.radians((pixel["min_lon"] + pixel["max_lon"]) / 2)
        centres.append([
            math.cos(lat) * math.cos(lon),
            math.cos(lat) * math.sin(lon),
            math.sin(lat),
        ])
    return np.array(centres)


def nearest_indices(centres, index, count):
    closeness = centres @ centres[index]
    return np.argpartition(-closeness, count - 1)[:count]


def smooth_once(pixels, count):
    if count == 1:
        return pixels

    centres = pixel_centres(pixels)
    smoothed = []
    for index, pixel in enumerate(pixels):
        neighbour_values = []
        for neighbour_index in nearest_indices(centres, index, count):
            value = pixels[neighbour_index]["value"]
            if value is not None:
                neighbour_values.append(value)

        new_pixel = dict(pixel)
        if len(neighbour_values) > 0:
            new_pixel["value"] = sum(neighbour_values) / len(neighbour_values)
        if pixel["uncertainty"] is not None:
            new_pixel["uncertainty"] = pixel["uncertainty"] / math.sqrt(count)
        smoothed.append(new_pixel)
    return smoothed


def smooth_noisy_pixels(pixels, name):
    original_noise = noise_ratio(pixels)
    count = 1
    smoothed = pixels

    while noise_ratio(smoothed) > TARGET_NOISE_RATIO and count < MAX_NEIGHBOUR_COUNT:
        count = count * 2
        smoothed = smooth_once(pixels, count)

    final_noise = noise_ratio(smoothed)
    print(f"{name}: averaged {count} nearest pixels, noise {original_noise:.2f} -> {final_noise:.2f}")
    if final_noise > TARGET_NOISE_RATIO:
        print(f"{name}: could not reach noise {TARGET_NOISE_RATIO} within {MAX_NEIGHBOUR_COUNT} pixels; data may be mostly noise.")
    return smoothed, count
