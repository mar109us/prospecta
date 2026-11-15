import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertLola import average_blocks, start_at_180_west, units_to_km


def test_shift_moves_0_east_to_the_middle():
    columns = np.array([[0, 1, 2, 3]])
    shifted = start_at_180_west(columns)
    assert shifted[0, 2] == 0


def test_2x2_blocks_are_averaged():
    elevation = np.array([
        [1, 3, 10, 10],
        [5, 7, 10, 10],
    ])
    averaged = average_blocks(elevation, 2)
    assert averaged.shape == (1, 2)
    assert averaged[0, 0] == 4
    assert averaged[0, 1] == 10


def test_raw_units_become_km():
    assert units_to_km(np.array([2000]))[0] == 1


def run_tests():
    tests = [
        test_shift_moves_0_east_to_the_middle,
        test_2x2_blocks_are_averaged,
        test_raw_units_become_km,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
