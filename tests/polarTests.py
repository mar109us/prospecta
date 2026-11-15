import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from polar import blur_longitude_by_latitude, window_for_latitude


def make_striped_grid():
    stripes = np.tile([0.0, 10.0], 360)
    return np.tile(stripes, (360, 1))


def test_equator_row_unchanged():
    grid = make_striped_grid()
    blurred = blur_longitude_by_latitude(grid, 2)
    assert np.array_equal(blurred[179], grid[179])


def test_pole_row_becomes_nearly_uniform():
    blurred = blur_longitude_by_latitude(make_striped_grid(), 2)
    assert blurred[0].std() < 0.1


def test_60_degree_row_averages_over_3_pixels():
    assert window_for_latitude(60, 720) == 3


def run_tests():
    tests = [
        test_equator_row_unchanged,
        test_pole_row_becomes_nearly_uniform,
        test_60_degree_row_averages_over_3_pixels,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
