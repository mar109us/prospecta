import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/convert"))

from detailTiles import lon_factor, list_tiles, tile_id, tiles_in_region, width_for_lat


def tiles_with_south(south):
    chosen = []
    for tile in list_tiles():
        if tile["south"] == south:
            chosen.append(tile)
    return chosen


def test_equator_band_has_72_tiles():
    assert len(tiles_with_south(0)) == 72


def test_every_band_width_divides_360():
    for tile in list_tiles():
        assert 360 % (tile["east"] - tile["west"]) == 0


def test_pole_band_has_6_wedges():
    assert len(tiles_with_south(85)) == 6
    assert len(tiles_with_south(-90)) == 6


def test_no_tile_crosses_60_degrees():
    for tile in list_tiles():
        assert not (tile["south"] < 60 < tile["north"])
        assert not (tile["south"] < -60 < tile["north"])


def test_no_tile_crosses_180():
    for tile in list_tiles():
        assert tile["west"] >= -180
        assert tile["east"] <= 180


def test_southern_bands_mirror_northern():
    assert width_for_lat(-65) == width_for_lat(60)
    assert width_for_lat(-90) == width_for_lat(85)


def test_lon_factor_is_width_over_5():
    tile = {"west": -180, "east": -120}
    assert lon_factor(tile) == 12


def test_ids_name_the_south_west_corner():
    assert tile_id(-90, -180) == "s90w180"
    assert tile_id(0, 0) == "n00e000"
    assert tile_id(-5, 175) == "s05e175"


def test_ids_are_unique():
    ids = []
    for tile in list_tiles():
        ids.append(tile["id"])
    assert len(ids) == len(set(ids))


def test_region_picks_overlapping_tiles_only():
    region = {"south": -2, "north": 3, "west": 1, "east": 6}
    ids = []
    for tile in tiles_in_region(list_tiles(), region):
        ids.append(tile["id"])
    assert sorted(ids) == ["n00e000", "n00e005", "s05e000", "s05e005"]
