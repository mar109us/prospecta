import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertSlope import percentile_blocks, slope_degrees


def test_flat_ground_is_0_degrees():
    flat = np.zeros(3)
    assert np.allclose(slope_degrees(flat, flat), 0)


def test_a_1_to_1_ramp_is_45_degrees():
    rise = np.array([1.0])
    none = np.array([0.0])
    assert np.allclose(slope_degrees(rise, none), 45)


def test_a_few_steep_pixels_keep_the_cell_steep():
    block = np.zeros((8, 8))
    block[0, :] = 20
    block[1, :2] = 20
    cell = percentile_blocks(block, 8, 90)
    assert cell[0, 0] == 20


def test_a_flat_block_stays_flat():
    cell = percentile_blocks(np.zeros((8, 8)), 8, 90)
    assert cell[0, 0] == 0


def run_tests():
    tests = [
        test_a_few_steep_pixels_keep_the_cell_steep,
        test_a_flat_block_stays_flat,
        test_flat_ground_is_0_degrees,
        test_a_1_to_1_ramp_is_45_degrees,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
