import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from convertRasters import check_same_layout, sum_grids


def make_raster(rows, columns, west):
    return {
        "data": np.zeros((rows, columns)),
        "west": west,
        "north": 50,
        "pixel_deg": 0.25,
        "nodata": None,
    }


def test_pyroxene_is_sum_of_both():
    low_ca = np.array([[2.0, 5.0]])
    high_ca = np.array([[3.0, 10.0]])
    pyroxene = sum_grids(low_ca, high_ca)
    assert pyroxene[0, 0] == 5 and pyroxene[0, 1] == 15


def test_pyroxene_is_empty_where_either_is_missing():
    low_ca = np.array([[np.nan, 5.0]])
    high_ca = np.array([[3.0, np.nan]])
    pyroxene = sum_grids(low_ca, high_ca)
    assert np.isnan(pyroxene[0, 0]) and np.isnan(pyroxene[0, 1])


def test_different_layouts_are_rejected():
    try:
        check_same_layout(make_raster(2, 2, -180), make_raster(2, 2, 0))
    except SystemExit:
        return
    raise AssertionError("different west edges were accepted")


def run_tests():
    tests = [
        test_pyroxene_is_sum_of_both,
        test_pyroxene_is_empty_where_either_is_missing,
        test_different_layouts_are_rejected,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except AssertionError:
            print(f"FAIL {test.__name__}")


run_tests()
