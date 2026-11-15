import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from smooth import MAX_NEIGHBOUR_COUNT, smooth_noisy_pixels, smooth_once


def make_pixel(lat, lon, value, uncertainty):
    return {
        "min_lat": lat - 1,
        "max_lat": lat + 1,
        "min_lon": lon - 1,
        "max_lon": lon + 1,
        "value": value,
        "uncertainty": uncertainty,
    }


def make_equator_pixels():
    return [
        make_pixel(0, 0, 10, 4),
        make_pixel(0, 2, 20, 4),
        make_pixel(0, 4, 30, 4),
        make_pixel(0, 6, 40, 4),
        make_pixel(0, 90, 999, 4),
    ]


def make_global_pixels(uncertainty):
    pixels = []
    for lat in range(-80, 81, 10):
        for lon in range(-170, 171, 10):
            pixels.append(make_pixel(lat, lon, lat + lon, uncertainty))
    return pixels


def test_count_1_leaves_values_unchanged():
    pixels = make_equator_pixels()
    smoothed = smooth_once(pixels, 1)
    assert smoothed[1]["value"] == 20


def test_pixel_gets_average_of_its_n_nearest():
    smoothed = smooth_once(make_equator_pixels(), 3)
    assert smoothed[1]["value"] == 20
    assert smoothed[4]["value"] != 999


def test_uncertainty_shrinks_by_square_root_of_n():
    smoothed = smooth_once(make_equator_pixels(), 4)
    assert smoothed[0]["uncertainty"] == 2


def test_reliable_data_is_not_smoothed():
    smoothed, count = smooth_noisy_pixels(make_global_pixels(0.01), "reliable")
    assert count == 1


def test_noisy_data_stops_at_the_cap():
    smoothed, count = smooth_noisy_pixels(make_global_pixels(10000), "noisy")
    assert count == MAX_NEIGHBOUR_COUNT


def run_tests():
    tests = [
        test_count_1_leaves_values_unchanged,
        test_pixel_gets_average_of_its_n_nearest,
        test_uncertainty_shrinks_by_square_root_of_n,
        test_reliable_data_is_not_smoothed,
        test_noisy_data_stops_at_the_cap,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
