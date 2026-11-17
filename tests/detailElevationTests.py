import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from ldemWindow import block_average, corner_heights_m, pixel_heights_m, read_window

SMALL_LDEM = {
    "height": 180,
    "width": 360,
    "pixels_per_degree": 1,
    "metres_per_unit": 0.5,
    "west_lon": 0,
}


def make_columns_source():
    columns = np.arange(SMALL_LDEM["width"], dtype=np.int16)
    return np.tile(columns, (SMALL_LDEM["height"], 1))


def make_random_source():
    generator = np.random.default_rng(1)
    shape = (SMALL_LDEM["height"], SMALL_LDEM["width"])
    return generator.integers(-2000, 2000, size=shape).astype(np.int16)


def test_window_wraps_past_the_last_column():
    window = read_window(make_columns_source(), 10, 2, 358, 4)
    assert list(window[0]) == [358, 359, 0, 1]


def test_window_repeats_the_edge_row_past_the_pole():
    source = make_random_source()
    window = read_window(source, -2, 3, 0, 5)
    assert np.array_equal(window[0], source[0, 0:5])
    assert np.array_equal(window[1], source[0, 0:5])


def test_block_average_of_4x4():
    window = np.arange(16, dtype=float).reshape(4, 4)
    assert block_average(window, 4, 4)[0, 0] == 7.5


def test_neighbour_tiles_share_edge_heights():
    source = make_random_source()
    west_tile = {"south": 0, "north": 20, "west": 0, "east": 20}
    east_tile = {"south": 0, "north": 20, "west": 20, "east": 40}
    west_heights = corner_heights_m(source, west_tile, SMALL_LDEM, 10, 1)
    east_heights = corner_heights_m(source, east_tile, SMALL_LDEM, 10, 1)
    assert np.array_equal(west_heights[:, -1], east_heights[:, 0])


def test_heights_are_in_metres():
    source = np.full((SMALL_LDEM["height"], SMALL_LDEM["width"]), 1000, dtype=np.int16)
    tile = {"south": 0, "north": 20, "west": 0, "east": 20}
    heights = corner_heights_m(source, tile, SMALL_LDEM, 10, 1)
    assert heights.shape == (11, 11)
    assert np.all(heights == 500)


def test_pixel_heights_have_one_pixel_margin():
    source = make_random_source()
    tile = {"south": 0, "north": 20, "west": 0, "east": 20}
    heights = pixel_heights_m(source, tile, SMALL_LDEM, 20, 1)
    assert heights.shape == (22, 22)
    assert heights[1, 1] == source[70, 0] * 0.5


def test_wide_tile_averages_columns():
    source = make_columns_source()
    tile = {"south": 0, "north": 20, "west": 0, "east": 40}
    heights = pixel_heights_m(source, tile, SMALL_LDEM, 20, 2)
    assert heights[1, 1] == (0 + 1) / 2 * 0.5


def test_source_starting_at_180_west_is_shifted():
    source = make_columns_source()
    ldem = dict(SMALL_LDEM)
    ldem["west_lon"] = -180
    tile = {"south": 0, "north": 20, "west": -180, "east": -160}
    heights = pixel_heights_m(source, tile, ldem, 20, 1)
    assert heights[1, 1] == 0


def test_double_resolution_source_is_averaged_2x2():
    source = make_columns_source()
    ldem = dict(SMALL_LDEM)
    ldem["pixels_per_degree"] = 2
    ldem["width"] = 360
    tile = {"south": 0, "north": 20, "west": 0, "east": 20}
    heights = pixel_heights_m(source, tile, ldem, 20, 1)
    assert heights.shape == (22, 22)
    assert heights[1, 1] == (0 + 1) / 2 * 0.5
