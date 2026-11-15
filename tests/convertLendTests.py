import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertLend import average_within_radius
from grid import HEIGHT, WIDTH

ROW_AT_89_75_NORTH = 0
ROW_AT_85_25_NORTH = 9
ROW_AT_77_25_NORTH = 25


def make_cap_grid():
    grid = np.full((HEIGHT, WIDTH), np.nan)
    grid[:20] = 1.0
    grid[HEIGHT - 20 :] = 1.0
    return grid


def test_noise_is_averaged_in_both_directions():
    grid = make_cap_grid()
    for row in range(20):
        for column in range(WIDTH):
            grid[row, column] = 10 * (-1) ** (row + column)
    averaged, _ = average_within_radius(grid, np.ones((HEIGHT, WIDTH)), 30)
    assert abs(averaged[ROW_AT_85_25_NORTH, 100]) < 3


def test_empty_pole_is_filled_from_neighbours():
    grid = make_cap_grid()
    grid[ROW_AT_89_75_NORTH] = np.nan
    averaged, _ = average_within_radius(grid, np.ones((HEIGHT, WIDTH)), 30)
    assert abs(averaged[ROW_AT_89_75_NORTH, 0] - 1) < 0.001


def test_cells_outside_the_cap_stay_empty():
    grid = make_cap_grid()
    averaged, _ = average_within_radius(grid, np.ones((HEIGHT, WIDTH)), 30)
    assert np.isnan(averaged[ROW_AT_77_25_NORTH, 0])


def test_uncertainty_shrinks_after_averaging():
    grid = make_cap_grid()
    _, uncertainty = average_within_radius(grid, np.ones((HEIGHT, WIDTH)), 30)
    assert uncertainty[ROW_AT_85_25_NORTH, 0] < 0.5


def run_tests():
    tests = [
        test_noise_is_averaged_in_both_directions,
        test_empty_pole_is_filled_from_neighbours,
        test_cells_outside_the_cap_stay_empty,
        test_uncertainty_shrinks_after_averaging,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
