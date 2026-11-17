import math
import re

import numpy as np

MOON_RADIUS_M = 1737400
MISSING_BELOW = -1e30
SUB_SAMPLES = 3
SEAM_MERIDIANS = [0, 90]
SEAM_LATITUDES = [0, 60]


def label_number(label, tag):
    match = re.search(r"<(?:[a-z]+:)?" + tag + r"[^>]*>([^<]+)<", label)
    if not match:
        raise SystemExit(f"WAC label is missing <{tag}>.")
    return float(match.group(1))


def read_label(label):
    image_section = label[label.index("<Array_2D_Image>"):]
    lines_and_samples = re.findall(r"<elements>(\d+)<", image_section)
    mosaic = {
        "offset": int(label_number(image_section, "offset")),
        "lines": int(lines_and_samples[0]),
        "samples": int(lines_and_samples[1]),
        "is_polar": "Polar_Stereographic" in label,
        "north": label_number(label, "north_bounding_coordinate"),
        "south": label_number(label, "south_bounding_coordinate"),
        "west": label_number(label, "west_bounding_coordinate"),
        "east": label_number(label, "east_bounding_coordinate"),
        "pixel_deg": label_number(label, "pixel_resolution_y"),
    }
    if mosaic["is_polar"]:
        mosaic["half_width_m"] = label_number(label, "upperleft_corner_x")
        mosaic["central_lon"] = label_number(label, "longitude_of_central_meridian")
        mosaic["pole_lat"] = label_number(label, "latitude_of_projection_origin")
    return mosaic


def open_mosaic(path, mosaic):
    shape = (mosaic["lines"], mosaic["samples"])
    return np.memmap(path, dtype="<f4", mode="r", offset=mosaic["offset"], shape=shape)


def covers(mosaic, lat, lon):
    lon_360 = lon % 360
    if not mosaic["south"] <= lat <= mosaic["north"]:
        return False
    return mosaic["west"] <= lon_360 <= mosaic["east"]


def equirect_position(mosaic, lats, lons):
    rows = (mosaic["north"] - lats) / mosaic["pixel_deg"]
    columns = ((lons % 360) - mosaic["west"]) / mosaic["pixel_deg"]
    return rows, columns


def polar_position(mosaic, lats, lons):
    metres_per_pixel = 2 * mosaic["half_width_m"] / mosaic["samples"]
    lat_radians = np.radians(lats)
    turn = np.radians(lons - mosaic["central_lon"])
    if mosaic["pole_lat"] < 0:
        distance = 2 * MOON_RADIUS_M * np.tan(math.pi / 4 + lat_radians / 2)
        y = distance * np.cos(turn)
    else:
        distance = 2 * MOON_RADIUS_M * np.tan(math.pi / 4 - lat_radians / 2)
        y = -distance * np.cos(turn)
    x = distance * np.sin(turn)
    rows = mosaic["lines"] / 2 - y / metres_per_pixel
    columns = mosaic["samples"] / 2 + x / metres_per_pixel
    return rows, columns


def sub_sample_grid(lats, lons, lat_step, lon_step):
    offsets = (np.arange(SUB_SAMPLES) + 0.5) / SUB_SAMPLES - 0.5
    sub_lats = lats[:, np.newaxis, :, np.newaxis] + offsets[np.newaxis, :, np.newaxis, np.newaxis] * lat_step
    sub_lons = lons[:, np.newaxis, :, np.newaxis] + offsets[np.newaxis, np.newaxis, np.newaxis, :] * lon_step
    return np.broadcast_arrays(sub_lats, sub_lons)


def sample(mosaic, source, lats, lons, lat_step, lon_step):
    sub_lats, sub_lons = sub_sample_grid(lats, lons, lat_step, lon_step)
    if mosaic["is_polar"]:
        rows, columns = polar_position(mosaic, sub_lats, sub_lons)
    else:
        rows, columns = equirect_position(mosaic, sub_lats, sub_lons)
    rows = np.clip(np.floor(rows).astype(int), 0, mosaic["lines"] - 1)
    columns = np.clip(np.floor(columns).astype(int), 0, mosaic["samples"] - 1)

    top = rows.min()
    left = columns.min()
    window = np.array(source[top:rows.max() + 1, left:columns.max() + 1], dtype=float)
    values = window[rows - top, columns - left]
    values[values < MISSING_BELOW] = np.nan
    return np.nanmean(values.reshape(lats.shape[0], SUB_SAMPLES, lats.shape[1], SUB_SAMPLES), axis=(1, 3))


def box_blur_ignoring_gaps(values, window):
    is_valid = ~np.isnan(values)
    filled = np.where(is_valid, values, 0)
    half = window // 2
    sums = np.pad(filled, half, mode="edge").cumsum(0).cumsum(1)
    counts = np.pad(is_valid.astype(float), half, mode="edge").cumsum(0).cumsum(1)
    sums = np.pad(sums, ((1, 0), (1, 0)))
    counts = np.pad(counts, ((1, 0), (1, 0)))
    window_sums = sums[window:, window:] - sums[:-window, window:] - sums[window:, :-window] + sums[:-window, :-window]
    window_counts = counts[window:, window:] - counts[:-window, window:] - counts[window:, :-window] + counts[:-window, :-window]
    return window_sums / np.maximum(window_counts, 1)


def shade_ratio(values, window, dark_floor):
    blurred = box_blur_ignoring_gaps(values, window)
    ratio = (values + dark_floor) / (blurred + dark_floor)
    ratio[np.isnan(ratio)] = 1
    ratio[blurred + dark_floor <= 0] = 1
    return ratio


def encode_ratio(ratio):
    return np.clip(np.round(ratio * 128), 0, 255).astype(np.uint8)


def distance_to_seams_km(lats, lons):
    lat_radians = np.radians(lats)
    nearest = np.full(np.shape(lats), np.inf)
    for meridian in SEAM_MERIDIANS:
        across = np.abs(np.cos(lat_radians) * np.sin(np.radians(lons - meridian)))
        nearest = np.minimum(nearest, np.arcsin(np.minimum(across, 1)))
    for seam_lat in SEAM_LATITUDES:
        nearest = np.minimum(nearest, np.abs(np.radians(np.abs(lats) - seam_lat)))
    return nearest * MOON_RADIUS_M / 1000


def seam_weight(lats, lons, fade_km):
    t = np.clip(distance_to_seams_km(lats, lons) / fade_km, 0, 1)
    return t * t * (3 - 2 * t)


def fade_near_seams(ratio, weight):
    return 1 + (ratio - 1) * weight
