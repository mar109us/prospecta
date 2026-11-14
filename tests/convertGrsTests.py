import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertGrs import fill_missing_pixels, is_touching


def make_pixel(min_lat, max_lat, min_lon, max_lon, value):
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "value": value,
    }


def test_side_neighbours_are_touching():
    pixel = make_pixel(0, 2, 0, 2, 1)
    other = make_pixel(0, 2, 2, 4, 1)
    assert is_touching(pixel, other)


def test_corner_neighbours_are_touching():
    pixel = make_pixel(0, 2, 0, 2, 1)
    other = make_pixel(2, 4, 2, 4, 1)
    assert is_touching(pixel, other)


def test_far_apart_pixels_are_not_touching():
    pixel = make_pixel(0, 2, 0, 2, 1)
    other = make_pixel(0, 2, 10, 12, 1)
    assert not is_touching(pixel, other)


def test_pixels_touch_across_180_seam():
    pixel = make_pixel(0, 2, 178, 180, 1)
    other = make_pixel(0, 2, -180, -178, 1)
    assert is_touching(pixel, other)


def test_missing_pixel_gets_average_of_neighbours():
    missing = make_pixel(0, 2, 2, 4, None)
    pixels = [
        make_pixel(0, 2, 0, 2, 10),
        missing,
        make_pixel(0, 2, 4, 6, 20),
        make_pixel(0, 2, 50, 52, 999),
    ]
    fill_missing_pixels(pixels)
    assert missing["value"] == 15


def run_tests():
    tests = [
        test_side_neighbours_are_touching,
        test_corner_neighbours_are_touching,
        test_far_apart_pixels_are_not_touching,
        test_pixels_touch_across_180_seam,
        test_missing_pixel_gets_average_of_neighbours,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
