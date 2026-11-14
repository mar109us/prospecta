import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from subdivide import quarter_value, split_into_quarters, subdivide


def make_pixel(min_lat, max_lat, min_lon, max_lon, value):
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "value": value,
    }


def test_pixel_splits_into_4_quarters_covering_it():
    quarters = split_into_quarters(make_pixel(0, 2, 10, 14, 5))
    assert len(quarters) == 4
    north_west = quarters[0]
    south_east = quarters[3]
    assert north_west["min_lat"] == 1 and north_west["max_lat"] == 2
    assert north_west["min_lon"] == 10 and north_west["max_lon"] == 12
    assert south_east["min_lat"] == 0 and south_east["max_lat"] == 1
    assert south_east["min_lon"] == 12 and south_east["max_lon"] == 14


def test_quarter_without_neighbours_keeps_parent_value():
    parent = make_pixel(0, 2, 0, 2, 10)
    quarter = split_into_quarters(parent)[0]
    assert quarter_value(parent, quarter, []) == 10


def test_quarter_blends_half_parent_half_neighbour():
    parent = make_pixel(0, 2, 0, 2, 10)
    east_neighbour = make_pixel(0, 2, 2, 4, 20)
    quarters = split_into_quarters(parent)
    north_west = quarters[0]
    north_east = quarters[1]
    assert quarter_value(parent, north_east, [east_neighbour]) == 15
    assert quarter_value(parent, north_west, [east_neighbour]) == 10


def test_two_levels_give_16_tiles():
    tiles = subdivide([make_pixel(0, 2, 0, 2, 10)], 2)
    assert len(tiles) == 16


def run_tests():
    tests = [
        test_pixel_splits_into_4_quarters_covering_it,
        test_quarter_without_neighbours_keeps_parent_value,
        test_quarter_blends_half_parent_half_neighbour,
        test_two_levels_give_16_tiles,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
