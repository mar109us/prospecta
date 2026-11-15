import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from normalMap import encode_normals, fine_detail, slopes


def make_flat():
    return np.zeros((20, 40))


def make_rising_east():
    columns = np.arange(40, dtype=float)
    return np.tile(columns, (20, 1)) * 100


def make_rising_north():
    rows = np.arange(20, dtype=float)[::-1]
    return np.tile(rows[:, np.newaxis], (1, 40)) * 100


def middle_pixel(rgb):
    return rgb[10, 20]


def test_flat_ground_gives_128_128_255():
    slope_east, slope_north = slopes(make_flat(), 1)
    pixel = middle_pixel(encode_normals(slope_east, slope_north, 1))
    assert list(pixel) == [128, 128, 255]


def test_ground_rising_east_tilts_red_below_128():
    slope_east, slope_north = slopes(make_rising_east(), 1)
    pixel = middle_pixel(encode_normals(slope_east, slope_north, 1000))
    assert pixel[0] < 128
    assert pixel[1] == 128


def test_ground_rising_north_tilts_green_below_128():
    slope_east, slope_north = slopes(make_rising_north(), 1)
    pixel = middle_pixel(encode_normals(slope_east, slope_north, 1000))
    assert pixel[1] < 128
    assert pixel[0] == 128


def test_fine_detail_removes_a_constant_height():
    detail = fine_detail(make_flat() + 500, 9)
    assert np.allclose(detail, 0)


def run_tests():
    tests = [
        test_flat_ground_gives_128_128_255,
        test_ground_rising_east_tilts_red_below_128,
        test_ground_rising_north_tilts_green_below_128,
        test_fine_detail_removes_a_constant_height,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
