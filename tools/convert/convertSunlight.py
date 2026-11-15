import json
from pathlib import Path

import numpy as np

from download import download_file
from grid import HEIGHT, RESOLUTION_DEG, WIDTH, save_grid_json
from raster import print_summary

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "tools/convert/raw"
ILLUMINATION_URL = "https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG"
IMAGE_SIZE = 6420
PROJECTION_OFFSET = 3209.5
PIXEL_SIZE_M = 240
VALUE_SCALE = 0.00004
MOON_RADIUS_M = 1737400
COVERAGE_START_DEG = 65
SUNLIGHT_PERCENTILE = 90
LINES_PER_CHUNK = 642
VALUE_KEY_RANGE = 32768

SUNLIGHT = {
    "name": "sunlight",
    "unit": "sunlit %",
    "source": "LRO LOLA average illumination (Mazarico et al. 2011, 2016 maps), share of time sunlit; 90th percentile per 0.5 degree cell; poleward of 65 degrees only",
    "output_path": PROJECT_ROOT / "datasets/sunlight.json",
}


def pixel_lat_lon(lines, samples, is_north):
    x = (samples - PROJECTION_OFFSET) * PIXEL_SIZE_M
    y = (PROJECTION_OFFSET - lines) * PIXEL_SIZE_M
    distance = np.hypot(x, y)
    angle_from_pole = np.degrees(2 * np.arctan(distance / (2 * MOON_RADIUS_M)))
    if is_north:
        lat = 90 - angle_from_pole
        lon = np.degrees(np.arctan2(x, -y))
    else:
        lat = -90 + angle_from_pole
        lon = np.degrees(np.arctan2(x, y))
    return lat, lon


def cell_indices(lat, lon):
    rows = np.floor((90 - lat) / RESOLUTION_DEG).astype(np.int64)
    rows = np.clip(rows, 0, HEIGHT - 1)
    columns = np.floor(((lon + 180) % 360) / RESOLUTION_DEG).astype(np.int64) % WIDTH
    return rows * WIDTH + columns


def percentile_per_cell(cells, raw_values, percentile):
    keys = np.sort(cells * VALUE_KEY_RANGE + raw_values)
    sorted_cells = keys // VALUE_KEY_RANGE
    sorted_values = keys % VALUE_KEY_RANGE
    unique_cells, starts, counts = np.unique(sorted_cells, return_index=True, return_counts=True)
    picks = starts + np.floor((counts - 1) * percentile / 100).astype(np.int64)
    return unique_cells, sorted_values[picks]


def read_pole(is_north):
    hemisphere = "N" if is_north else "S"
    file_name = f"AVGVISIB_65{hemisphere}_240M_201608.IMG"
    path = RAW / file_name
    download_file(f"{ILLUMINATION_URL}/{file_name}", path)
    image = np.fromfile(path, dtype="<i2")
    if image.size != IMAGE_SIZE * IMAGE_SIZE:
        raise SystemExit(f"{file_name} has {image.size} values, expected {IMAGE_SIZE * IMAGE_SIZE}.")
    return image.reshape(IMAGE_SIZE, IMAGE_SIZE)


def pole_cells(image, is_north):
    all_cells = []
    all_values = []
    samples = np.arange(IMAGE_SIZE)
    for start in range(0, IMAGE_SIZE, LINES_PER_CHUNK):
        lines = np.arange(start, min(start + LINES_PER_CHUNK, IMAGE_SIZE))
        line_grid, sample_grid = np.meshgrid(lines, samples, indexing="ij")
        lat, lon = pixel_lat_lon(line_grid, sample_grid, is_north)
        raw = image[lines].astype(np.int64)
        is_kept = (np.abs(lat) > COVERAGE_START_DEG) & (raw >= 0)
        all_cells.append(cell_indices(lat[is_kept], lon[is_kept]))
        all_values.append(raw[is_kept])
    return np.concatenate(all_cells), np.concatenate(all_values)


def fill_grid(grid, cells, raw_values):
    unique_cells, picked = percentile_per_cell(cells, raw_values, SUNLIGHT_PERCENTILE)
    grid.flat[unique_cells] = picked * VALUE_SCALE * 100


def elevation_correlation(grid):
    elevation = json.load(open(PROJECT_ROOT / "datasets/elevation.json"))
    values = np.array([np.nan if value is None else value for value in elevation["values"]]).reshape(HEIGHT, WIDTH)
    has_both = ~np.isnan(grid) & ~np.isnan(values)
    return np.corrcoef(grid[has_both], values[has_both])[0, 1]


def main():
    grid = np.full((HEIGHT, WIDTH), np.nan)
    for is_north in [True, False]:
        image = read_pole(is_north)
        cells, raw_values = pole_cells(image, is_north)
        fill_grid(grid, cells, raw_values)

    print(f"sunlight: correlation with elevation {elevation_correlation(grid):.2f} (should be clearly positive)")
    save_grid_json(grid, SUNLIGHT, SUNLIGHT["output_path"])
    print_summary(grid, SUNLIGHT)


if __name__ == "__main__":
    main()
