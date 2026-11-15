import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertHydrogen import cut_poles
from grid import HEIGHT, WIDTH


def test_hydrogen_is_cut_beyond_80_degrees():
    grid = np.full((HEIGHT, WIDTH), 50.0)
    cut = cut_poles(grid, 80)
    assert np.isnan(cut[0, 0]) and np.isnan(cut[HEIGHT - 1, 0])


def test_hydrogen_is_kept_up_to_80_degrees():
    grid = np.full((HEIGHT, WIDTH), 50.0)
    cut = cut_poles(grid, 80)
    row_at_79_75_north = 20
    assert cut[row_at_79_75_north, 0] == 50 and cut[HEIGHT // 2, 0] == 50


def run_tests():
    tests = [
        test_hydrogen_is_cut_beyond_80_degrees,
        test_hydrogen_is_kept_up_to_80_degrees,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
