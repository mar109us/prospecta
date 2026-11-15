import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertHydrogen import keep_latitude_band
from grid import HEIGHT, WIDTH

ROW_AT_89_75_NORTH = 0
ROW_AT_83_25_NORTH = 13
ROW_AT_82_75_NORTH = 14
ROW_AT_75_25_NORTH = 29
ROW_AT_60_25_NORTH = 59
ROW_AT_75_25_SOUTH = HEIGHT - 1 - 29


def make_band_grid():
    grid = np.full((HEIGHT, WIDTH), 50.0)
    return keep_latitude_band(grid, 70, 83)


def test_hydrogen_is_removed_below_70_degrees():
    grid = make_band_grid()
    assert np.isnan(grid[ROW_AT_60_25_NORTH, 0]) and np.isnan(grid[HEIGHT // 2, 0])


def test_hydrogen_is_kept_between_70_and_80_degrees():
    grid = make_band_grid()
    assert grid[ROW_AT_75_25_NORTH, 0] == 50 and grid[ROW_AT_75_25_SOUTH, 0] == 50


def test_hydrogen_overlaps_lend_across_the_fade_strip():
    grid = make_band_grid()
    assert grid[ROW_AT_82_75_NORTH, 0] == 50 and np.isnan(grid[ROW_AT_83_25_NORTH, 0])


def test_hydrogen_is_cut_near_the_poles():
    grid = make_band_grid()
    assert np.isnan(grid[ROW_AT_89_75_NORTH, 0]) and np.isnan(grid[HEIGHT - 1, 0])


def run_tests():
    tests = [
        test_hydrogen_is_removed_below_70_degrees,
        test_hydrogen_is_kept_between_70_and_80_degrees,
        test_hydrogen_overlaps_lend_across_the_fade_strip,
        test_hydrogen_is_cut_near_the_poles,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
