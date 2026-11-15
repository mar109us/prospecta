import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertSlope import slope_degrees


def test_flat_ground_is_0_degrees():
    flat = np.zeros(3)
    assert np.allclose(slope_degrees(flat, flat), 0)


def test_a_1_to_1_ramp_is_45_degrees():
    rise = np.array([1.0])
    none = np.array([0.0])
    assert np.allclose(slope_degrees(rise, none), 45)


def run_tests():
    tests = [
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
