TILE_HEIGHT_DEG = 5
PIXELS_PER_DEGREE = 128
TEXTURE_SIZE = TILE_HEIGHT_DEG * PIXELS_PER_DEGREE
SEGMENTS = 160

BANDS = [
    {"from_lat": 0, "to_lat": 60, "width_deg": 5},
    {"from_lat": 60, "to_lat": 70, "width_deg": 10},
    {"from_lat": 70, "to_lat": 75, "width_deg": 15},
    {"from_lat": 75, "to_lat": 80, "width_deg": 20},
    {"from_lat": 80, "to_lat": 85, "width_deg": 30},
    {"from_lat": 85, "to_lat": 90, "width_deg": 60},
]


def width_for_lat(south):
    distance_from_equator = max(abs(south), abs(south + TILE_HEIGHT_DEG))
    for band in BANDS:
        if band["from_lat"] < distance_from_equator <= band["to_lat"]:
            return band["width_deg"]
    raise SystemExit(f"No tile band covers latitude {south}.")


def lon_factor(tile):
    return (tile["east"] - tile["west"]) // TILE_HEIGHT_DEG


def tile_id(south, west):
    north_south = "n"
    if south < 0:
        north_south = "s"
    east_west = "e"
    if west < 0:
        east_west = "w"
    return f"{north_south}{abs(south):02d}{east_west}{abs(west):03d}"


def list_tiles():
    tiles = []
    for south in range(-90, 90, TILE_HEIGHT_DEG):
        width = width_for_lat(south)
        for west in range(-180, 180, width):
            tiles.append({
                "id": tile_id(south, west),
                "south": south,
                "north": south + TILE_HEIGHT_DEG,
                "west": west,
                "east": west + width,
            })
    return tiles


def tiles_in_region(tiles, region):
    chosen = []
    for tile in tiles:
        if tile["north"] <= region["south"] or tile["south"] >= region["north"]:
            continue
        if tile["east"] <= region["west"] or tile["west"] >= region["east"]:
            continue
        chosen.append(tile)
    return chosen
