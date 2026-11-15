import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from raster import resample_to_grid, smooth_grid


def make_raster(data, west, north, pixel_deg, nodata):
    return {
        "data": np.array(data, dtype=float),
        "west": west,
        "north": north,
        "pixel_deg": pixel_deg,
        "nodata": nodata,
    }


def test_block_average_ignores_no_data():
    raster = make_raster([[2, 4], [-9, 6]], -180, 90, 0.25, -9)
    grid = resample_to_grid(raster)
    assert grid[0, 0] == 4


def test_outside_coverage_becomes_null():
    raster = make_raster([[1, 1], [1, 1]], -180, 90, 0.25, None)
    grid = resample_to_grid(raster)
    assert np.isnan(grid[100, 100])


def test_east_longitudes_wrap_to_minus_180_start():
    raster = make_raster([[7, 7]], 180, 0.5, 0.25, None)
    grid = resample_to_grid(raster)
    assert grid[179, 0] == 7


def test_smoothing_keeps_gaps_empty():
    grid = np.full((360, 720), 5.0)
    grid[100, 100] = np.nan
    smoothed = smooth_grid(grid, 3)
    assert np.isnan(smoothed[100, 100]) and smoothed[100, 101] == 5


def test_smoothing_averages_neighbours():
    grid = np.zeros((360, 720))
    grid[180, 360] = 9
    smoothed = smooth_grid(grid, 3)
    assert smoothed[180, 361] == 1


def test_smoothing_wraps_around_180():
    grid = np.zeros((360, 720))
    grid[180, 0] = 9
    smoothed = smooth_grid(grid, 3)
    assert smoothed[180, 719] == 1


def run_tests():
    tests = [
        test_smoothing_keeps_gaps_empty,
        test_smoothing_averages_neighbours,
        test_smoothing_wraps_around_180,
        test_block_average_ignores_no_data,
        test_outside_coverage_becomes_null,
        test_east_longitudes_wrap_to_minus_180_start,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
