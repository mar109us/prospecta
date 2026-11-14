import json
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from grid import CENTRE_LATS, CENTRE_LONS, fill_pixel, make_empty_grid, save_grid_json


def make_pixel(min_lat, max_lat, min_lon, max_lon, value):
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "value": value,
    }


def test_first_cell_centre_is_top_left():
    assert CENTRE_LATS[0] == 89.75
    assert CENTRE_LONS[0] == -179.75


def test_last_cell_centre_is_bottom_right():
    assert CENTRE_LATS[-1] == -89.75
    assert CENTRE_LONS[-1] == 179.75


def test_pixel_fills_cells_whose_centre_is_inside():
    grid = make_empty_grid()
    fill_pixel(grid, make_pixel(0, 1, 0, 1.5, 7))
    assert int((grid == 7).sum()) == 6


def test_neighbouring_pixels_do_not_overlap():
    grid = make_empty_grid()
    fill_pixel(grid, make_pixel(0, 1, 0, 1, 1))
    fill_pixel(grid, make_pixel(0, 1, 1, 2, 2))
    assert int((grid == 1).sum()) == 4
    assert int((grid == 2).sum()) == 4


def test_empty_cells_become_null_in_json():
    grid = make_empty_grid()
    fill_pixel(grid, make_pixel(0, 1, 0, 1, 5.123))
    info = {
        "name": "test",
        "unit": "wt%",
        "source": "test",
    }

    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "test.json"
        save_grid_json(grid, info, path)
        with open(path) as file:
            output = json.load(file)

    assert output["values"].count(None) == grid.size - 4
    assert output["min"] == 5.12
    assert output["max"] == 5.12


def run_tests():
    tests = [
        test_first_cell_centre_is_top_left,
        test_last_cell_centre_is_bottom_right,
        test_pixel_fills_cells_whose_centre_is_inside,
        test_neighbouring_pixels_do_not_overlap,
        test_empty_cells_become_null_in_json,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
