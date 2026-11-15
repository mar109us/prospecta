import math
from pathlib import Path

import numpy as np

from download import download_file
from grid import CENTRE_LATS, CENTRE_LONS, HEIGHT, WIDTH, save_grid_json
from raster import print_summary

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "tools/convert/raw"
LEND_URL = "https://pds-geosciences.wustl.edu/lro/lro-l-lend-2-edr-v1/lrolen_0xxx/data/2011/20111211"
ROW_BYTES = 310
BAND_COUNT = 20
RATE_START = 110
ERROR_START = 114
REFERENCE_BANDS = 4
LEND_COVERAGE_START_DEG = 80
MOON_RADIUS_KM = 1737.4
SMOOTHING_RADIUS_KM = 30
CELLS_PER_CHUNK = 1000

POLAR_HYDROGEN = {
    "name": "polarHydrogen",
    "unit": "suppression %",
    "source": "LRO LEND collimated epithermal neutrons (CSETN), suppression vs the 80-82 degree ring; more suppression = more hydrogen",
    "output_path": PROJECT_ROOT / "datasets/polarHydrogen.json",
}


def read_column(raw, start):
    values = raw[:, start : start + 4].copy().view(">f4").ravel().astype(float)
    values[values <= 0] = np.nan
    return values.reshape(BAND_COUNT, WIDTH)


def read_pole(file_name):
    path = RAW / file_name
    download_file(f"{LEND_URL}/{file_name}", path)
    raw = np.fromfile(path, dtype=np.uint8)
    if raw.size != BAND_COUNT * WIDTH * ROW_BYTES:
        raise SystemExit(f"{file_name} has {raw.size} bytes, expected {BAND_COUNT * WIDTH * ROW_BYTES}.")
    raw = raw.reshape(BAND_COUNT * WIDTH, ROW_BYTES)

    half_turn = WIDTH // 2
    rate = np.roll(read_column(raw, RATE_START), half_turn, axis=1)
    error = np.roll(read_column(raw, ERROR_START), half_turn, axis=1)
    return {
        "rate": rate,
        "error": error,
    }


def reference_rate(south, north):
    outermost_bands = BAND_COUNT - REFERENCE_BANDS
    edge_bands = np.concatenate([
        south["rate"][outermost_bands:],
        north["rate"][outermost_bands:],
    ])
    return np.nanmean(edge_bands)


def build_grids(south, north):
    reference = reference_rate(south, north)
    grid = np.full((HEIGHT, WIDTH), np.nan)
    uncertainty = np.full((HEIGHT, WIDTH), np.nan)

    grid[:BAND_COUNT] = (1 - north["rate"] / reference) * 100
    uncertainty[:BAND_COUNT] = north["error"] / reference * 100
    south_rate_north_first = south["rate"][::-1]
    south_error_north_first = south["error"][::-1]
    grid[HEIGHT - BAND_COUNT :] = (1 - south_rate_north_first / reference) * 100
    uncertainty[HEIGHT - BAND_COUNT :] = south_error_north_first / reference * 100
    return grid, uncertainty, reference


def cap_rows(is_north):
    if is_north:
        return np.where(CENTRE_LATS > LEND_COVERAGE_START_DEG)[0]
    return np.where(CENTRE_LATS < -LEND_COVERAGE_START_DEG)[0]


def cell_centres(rows):
    lats = np.radians(np.repeat(CENTRE_LATS[rows], WIDTH))
    lons = np.radians(np.tile(CENTRE_LONS, len(rows)))
    centres = np.column_stack([
        np.cos(lats) * np.cos(lons),
        np.cos(lats) * np.sin(lons),
        np.sin(lats),
    ])
    area_weights = np.cos(lats)
    return centres, area_weights


def average_cap(grid, uncertainty, rows, radius_km):
    centres, area_weights = cell_centres(rows)
    values = grid[rows].ravel()
    errors = np.nan_to_num(uncertainty[rows].ravel())
    has_data = ~np.isnan(values)

    weights = np.where(has_data, area_weights, 0)
    weighted_values = np.where(has_data, values, 0) * weights
    weighted_variances = (errors * weights) ** 2
    min_closeness = math.cos(radius_km / MOON_RADIUS_KM)

    averaged = np.full(values.size, np.nan)
    averaged_errors = np.full(values.size, np.nan)
    for start in range(0, values.size, CELLS_PER_CHUNK):
        end = start + CELLS_PER_CHUNK
        is_near = (centres[start:end] @ centres.T) >= min_closeness
        near = is_near.astype(float)
        weight_sums = near @ weights
        has_neighbours = weight_sums > 0
        chunk = np.arange(start, min(end, values.size))[has_neighbours]
        averaged[chunk] = (near @ weighted_values)[has_neighbours] / weight_sums[has_neighbours]
        averaged_errors[chunk] = np.sqrt(near @ weighted_variances)[has_neighbours] / weight_sums[has_neighbours]
    return averaged.reshape(len(rows), WIDTH), averaged_errors.reshape(len(rows), WIDTH)


def average_within_radius(grid, uncertainty, radius_km):
    averaged = grid.copy()
    averaged_uncertainty = uncertainty.copy()
    for is_north in [True, False]:
        rows = cap_rows(is_north)
        cap, cap_uncertainty = average_cap(grid, uncertainty, rows, radius_km)
        averaged[rows] = cap
        averaged_uncertainty[rows] = cap_uncertainty
    return averaged, averaged_uncertainty


def main():
    south = read_pole("lend_rdr_alds_20111211.dat")
    north = read_pole("lend_rdr_aldn_20111211.dat")
    grid, uncertainty, reference = build_grids(south, north)
    grid, uncertainty = average_within_radius(grid, uncertainty, SMOOTHING_RADIUS_KM)
    print(f"polarHydrogen: reference rate {reference:.3f} counts/s")
    save_grid_json(grid, POLAR_HYDROGEN, POLAR_HYDROGEN["output_path"], uncertainty)
    print_summary(grid, POLAR_HYDROGEN)


if __name__ == "__main__":
    main()
