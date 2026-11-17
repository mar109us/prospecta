import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from wacMosaic import covers, encode_ratio, equirect_position, fade_near_seams, polar_position, seam_weight, shade_ratio


def make_equirect():
    return {
        "lines": 600,
        "samples": 900,
        "is_polar": False,
        "north": 60.0,
        "south": 0.0,
        "west": 0.0,
        "east": 90.0,
        "pixel_deg": 0.1,
    }


def make_south_polar():
    return {
        "lines": 1000,
        "samples": 1000,
        "is_polar": True,
        "half_width_m": 931050.0,
        "central_lon": 0.0,
        "pole_lat": -90.0,
    }


def test_equirect_top_left_corner_is_pixel_0_0():
    rows, columns = equirect_position(make_equirect(), np.array([60.0]), np.array([0.0]))
    assert rows[0] == 0 and columns[0] == 0


def test_equirect_wraps_negative_longitudes():
    mosaic = make_equirect()
    mosaic["west"] = 270.0
    mosaic["east"] = 360.0
    _, columns = equirect_position(mosaic, np.array([30.0]), np.array([-45.0]))
    assert abs(columns[0] - 450) < 1e-9


def test_covers_uses_0_to_360_longitudes():
    mosaic = make_equirect()
    mosaic["west"] = 270.0
    mosaic["east"] = 360.0
    assert covers(mosaic, 30, -2.5)
    assert not covers(mosaic, 30, 2.5)


def test_pole_maps_to_image_centre():
    rows, columns = polar_position(make_south_polar(), np.array([-90.0]), np.array([123.0]))
    assert abs(rows[0] - 500) < 1e-6 and abs(columns[0] - 500) < 1e-6


def test_60_degrees_reaches_the_image_edge():
    rows, _ = polar_position(make_south_polar(), np.array([-60.0]), np.array([0.0]))
    assert abs(rows[0]) < 1


def test_south_pole_longitude_90_is_right_of_centre():
    _, columns = polar_position(make_south_polar(), np.array([-80.0]), np.array([90.0]))
    assert columns[0] > 500


def test_constant_image_gives_ratio_128():
    ratio = shade_ratio(np.full((10, 10), 0.08), 5, 0.02)
    assert np.all(encode_ratio(ratio) == 128)


def test_missing_pixels_give_ratio_1():
    values = np.full((10, 10), 0.08)
    values[4, 4] = np.nan
    assert shade_ratio(values, 5, 0.02)[4, 4] == 1


def test_bright_pixel_is_above_128():
    values = np.full((10, 10), 0.08)
    values[4, 4] = 0.16
    assert encode_ratio(shade_ratio(values, 5, 0.02))[4, 4] > 128


def test_noise_in_dark_areas_stays_near_1():
    values = np.full((10, 10), 0.002)
    values[4, 4] = 0.006
    assert shade_ratio(values, 5, 0.02)[4, 4] < 1.2


def test_seam_weight_is_0_on_a_seam_meridian():
    assert seam_weight(np.array([-75.0]), np.array([90.0]), 8)[0] == 0
    assert seam_weight(np.array([30.0]), np.array([180.0]), 8)[0] < 1e-12


def test_seam_weight_is_1_far_from_seams():
    assert seam_weight(np.array([30.0]), np.array([45.0]), 8)[0] == 1


def test_seam_weight_fades_on_the_60_degree_join():
    assert seam_weight(np.array([-60.0]), np.array([45.0]), 8)[0] == 0
    assert seam_weight(np.array([-60.1]), np.array([45.0]), 8)[0] > 0


def test_seam_distance_shrinks_near_the_pole():
    near_pole = seam_weight(np.array([-89.9]), np.array([45.0]), 8)[0]
    assert near_pole < 1


def test_fade_moves_ratio_toward_1():
    assert fade_near_seams(np.array([1.6]), np.array([0.5]))[0] == 1.3
