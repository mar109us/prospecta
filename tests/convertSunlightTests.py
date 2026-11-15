import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertSunlight import IMAGE_SIZE, PROJECTION_OFFSET, percentile_per_cell, pixel_lat_lon, pole_cells
from grid import WIDTH


def test_image_centre_is_the_pole():
    lat, _ = pixel_lat_lon(np.array([PROJECTION_OFFSET]), np.array([PROJECTION_OFFSET]), True)
    assert abs(lat[0] - 90) < 0.0001


def test_pixel_right_of_centre_lies_at_90_east():
    lines = np.array([PROJECTION_OFFSET, PROJECTION_OFFSET])
    samples = np.array([PROJECTION_OFFSET + 100, PROJECTION_OFFSET + 100])
    _, north_lon = pixel_lat_lon(lines[:1], samples[:1], True)
    _, south_lon = pixel_lat_lon(lines[1:], samples[1:], False)
    assert abs(north_lon[0] - 90) < 0.0001 and abs(south_lon[0] - 90) < 0.0001


def test_90th_percentile_per_cell():
    cells = np.array([5] * 10 + [7] * 2)
    values = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 40, 20])
    unique_cells, picked = percentile_per_cell(cells, values, 90)
    assert list(unique_cells) == [5, 7] and picked[0] == 9 and picked[1] == 20


def test_pixels_outside_65_degrees_are_dropped():
    image = np.ones((IMAGE_SIZE, IMAGE_SIZE), dtype=np.int16)
    cells, _ = pole_cells(image, True)
    rows = cells // WIDTH
    row_at_65_north = 50
    assert rows.max() < row_at_65_north


def run_tests():
    tests = [
        test_image_centre_is_the_pole,
        test_pixel_right_of_centre_lies_at_90_east,
        test_90th_percentile_per_cell,
        test_pixels_outside_65_degrees_are_dropped,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
