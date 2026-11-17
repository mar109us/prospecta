import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from normalMap import encode_normals, fine_detail, slopes, tile_slopes


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


def tile_lats(rows):
    return np.zeros(rows)


def test_tile_slopes_flat_gives_128_128_255():
    slope_east, slope_north = tile_slopes(np.zeros((6, 6)), tile_lats(4), 1, 1)
    assert slope_east.shape == (4, 4)
    assert list(encode_normals(slope_east, slope_north, 4)[0, 0]) == [128, 128, 255]


def test_tile_slopes_wider_pixels_halve_east_slope():
    rising_east = np.tile(np.arange(6, dtype=float) * 100, (6, 1))
    narrow_east, _ = tile_slopes(rising_east, tile_lats(4), 1, 1)
    wide_east, _ = tile_slopes(rising_east, tile_lats(4), 1, 2)
    assert abs(wide_east[0, 0] * 2 - narrow_east[0, 0]) < 1e-12


def test_tile_slopes_north_is_up_the_rows():
    rising_north = np.tile(np.arange(6, dtype=float)[::-1, np.newaxis] * 100, (1, 6))
    _, slope_north = tile_slopes(rising_north, tile_lats(4), 1, 1)
    assert slope_north[0, 0] > 0
