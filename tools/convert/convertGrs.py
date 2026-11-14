from pathlib import Path

import numpy as np

from download import download_file
from grid import fill_pixel, make_empty_grid, save_grid_json

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GRS_URL = "https://pds-geosciences.wustl.edu/lunar/lp-l-grs-5-elem-abundance-v1/lp_9001/data/lpgrs_high1_elem_abundance_2deg.tab"
GRS_PATH = PROJECT_ROOT / "tools/convert/raw/lpgrs_high1_elem_abundance_2deg.tab"
FIELD_COUNT = 61

IRON = {
    "name": "iron",
    "unit": "FeO wt%",
    "source": "Lunar Prospector GRS, Prettyman 2012 (2 degree equal-area pixels)",
    "column": 12,
    "output_path": PROJECT_ROOT / "datasets/iron.json",
}


def read_pixels(path, column):
    pixels = []
    with open(path) as file:
        for line_number, line in enumerate(file, start=1):
            fields = line.split()
            if len(fields) != FIELD_COUNT:
                raise SystemExit(
                    f"Line {line_number} of {path.name} has {len(fields)} fields, expected {FIELD_COUNT}."
                )

            value = float(fields[column]) * 100
            if value == 0:
                value = None

            pixel = {
                "min_lat": float(fields[1]),
                "max_lat": float(fields[2]),
                "min_lon": float(fields[3]),
                "max_lon": float(fields[4]),
                "value": value,
            }
            pixels.append(pixel)
    return pixels


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


def average_of_neighbours(pixel, pixels):
    known_values = []
    for other in pixels:
        if other is pixel or other["value"] is None:
            continue
        if is_touching(pixel, other):
            known_values.append(other["value"])

    if len(known_values) == 0:
        return None
    return sum(known_values) / len(known_values)


def fill_missing_pixels(pixels):
    estimates = []
    for pixel in pixels:
        if pixel["value"] is not None:
            continue
        estimate = average_of_neighbours(pixel, pixels)
        estimates.append((pixel, estimate))

    for pixel, estimate in estimates:
        pixel["value"] = estimate
        where = f"lat {pixel['min_lat']}..{pixel['max_lat']}, lon {pixel['min_lon']}..{pixel['max_lon']}"
        if estimate is None:
            print(f"Could not fill missing pixel at {where}: no known neighbours.")
        else:
            print(f"Filled missing pixel at {where} with {estimate:.2f}")


def print_summary(grid, dataset):
    null_count = int(np.isnan(grid).sum())
    print(f"{dataset['name']}: min {np.nanmin(grid):.2f}, max {np.nanmax(grid):.2f} {dataset['unit']}")
    print(f"{dataset['name']}: {null_count} empty cells of {grid.size}")


def convert_dataset(dataset):
    pixels = read_pixels(GRS_PATH, dataset["column"])
    fill_missing_pixels(pixels)
    grid = make_empty_grid()
    for pixel in pixels:
        fill_pixel(grid, pixel)

    save_grid_json(grid, dataset, dataset["output_path"])
    print_summary(grid, dataset)
    print(f"Wrote {dataset['output_path'].relative_to(PROJECT_ROOT)}")


def main():
    download_file(GRS_URL, GRS_PATH)
    convert_dataset(IRON)


if __name__ == "__main__":
    main()
