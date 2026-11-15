import math
from pathlib import Path

import numpy as np

from download import download_file
from grid import (
    DISPLAY_HIGH_PERCENTILE,
    DISPLAY_LOW_PERCENTILE,
    fill_pixel,
    make_empty_grid,
    save_grid_json,
)
from neighbours import find_neighbours, pixels_to_arrays
from smooth import smooth_noisy_pixels
from subdivide import subdivide

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GRS_URL = "https://pds-geosciences.wustl.edu/lunar/lp-l-grs-5-elem-abundance-v1/lp_9001/data/lpgrs_high1_elem_abundance_2deg.tab"
GRS_PATH = PROJECT_ROOT / "tools/convert/raw/lpgrs_high1_elem_abundance_2deg.tab"
FIELD_COUNT = 61
SUBDIVISION_LEVELS = 2

IRON = {
    "name": "iron",
    "unit": "FeO wt%",
    "source": "Lunar Prospector GRS, Prettyman 2012 (2 degree equal-area pixels)",
    "column": 12,
    "uncertainty_column": 51,
    "output_path": PROJECT_ROOT / "datasets/iron.json",
}

SILICON = {
    "name": "silicon",
    "unit": "SiO2 wt%",
    "source": "Lunar Prospector GRS, Prettyman 2012 (2 degree equal-area pixels)",
    "column": 9,
    "uncertainty_column": 33,
    "output_path": PROJECT_ROOT / "datasets/silicon.json",
}


def read_uncertainty(fields, column):
    variance = float(fields[column])
    if variance <= 0:
        return None
    return math.sqrt(variance) * 100


def read_pixels(path, dataset):
    pixels = []
    with open(path) as file:
        for line_number, line in enumerate(file, start=1):
            fields = line.split()
            if len(fields) != FIELD_COUNT:
                raise SystemExit(
                    f"Line {line_number} of {path.name} has {len(fields)} fields, expected {FIELD_COUNT}."
                )

            value = float(fields[dataset["column"]]) * 100
            uncertainty = read_uncertainty(fields, dataset["uncertainty_column"])
            if value == 0:
                value = None
                uncertainty = None

            pixel = {
                "min_lat": float(fields[1]),
                "max_lat": float(fields[2]),
                "min_lon": float(fields[3]),
                "max_lon": float(fields[4]),
                "value": value,
                "uncertainty": uncertainty,
            }
            pixels.append(pixel)
    return pixels


def average_of_neighbours(pixel, pixels, arrays, key):
    known_values = []
    for neighbour in find_neighbours(pixel, pixels, arrays):
        if neighbour[key] is not None:
            known_values.append(neighbour[key])

    if len(known_values) == 0:
        return None
    return sum(known_values) / len(known_values)


def fill_missing_pixels(pixels):
    arrays = pixels_to_arrays(pixels)
    estimates = []
    for pixel in pixels:
        if pixel["value"] is not None:
            continue
        estimate = {
            "value": average_of_neighbours(pixel, pixels, arrays, "value"),
            "uncertainty": average_of_neighbours(pixel, pixels, arrays, "uncertainty"),
        }
        estimates.append((pixel, estimate))

    for pixel, estimate in estimates:
        pixel["value"] = estimate["value"]
        pixel["uncertainty"] = estimate["uncertainty"]
        where = f"lat {pixel['min_lat']}..{pixel['max_lat']}, lon {pixel['min_lon']}..{pixel['max_lon']}"
        if estimate["value"] is None:
            print(f"Could not fill missing pixel at {where}: no known neighbours.")
        else:
            print(f"Filled missing pixel at {where} with {estimate['value']:.2f}")


def print_summary(grid, uncertainty_grid, dataset):
    name = dataset["name"]
    unit = dataset["unit"]
    null_count = int(np.isnan(grid).sum())
    low = np.nanpercentile(grid, DISPLAY_LOW_PERCENTILE)
    high = np.nanpercentile(grid, DISPLAY_HIGH_PERCENTILE)
    typical_uncertainty = np.nanmedian(uncertainty_grid)
    print(f"{name}: min {np.nanmin(grid):.2f}, max {np.nanmax(grid):.2f} {unit}")
    print(f"{name}: {null_count} empty cells of {grid.size}")
    print(f"{name}: display range {low:.2f} to {high:.2f} {unit}")
    print(f"{name}: typical uncertainty +/- {typical_uncertainty:.2f} {unit}")


def convert_dataset(dataset):
    pixels = read_pixels(GRS_PATH, dataset)
    fill_missing_pixels(pixels)
    pixels, neighbour_count = smooth_noisy_pixels(pixels, dataset["name"])
    pixels = subdivide(pixels, SUBDIVISION_LEVELS)

    grid = make_empty_grid()
    uncertainty_grid = make_empty_grid()
    for pixel in pixels:
        fill_pixel(grid, pixel)
        fill_pixel(uncertainty_grid, pixel, "uncertainty")

    save_grid_json(grid, dataset, dataset["output_path"], uncertainty_grid)
    print_summary(grid, uncertainty_grid, dataset)
    print(f"Wrote {dataset['output_path'].relative_to(PROJECT_ROOT)}")


def main():
    download_file(GRS_URL, GRS_PATH)
    convert_dataset(IRON)
    convert_dataset(SILICON)


if __name__ == "__main__":
    main()
