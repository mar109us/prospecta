from neighbours import find_neighbours, is_touching, pixels_to_arrays


def make_tile(min_lat, max_lat, min_lon, max_lon):
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "value": None,
    }


def split_into_quarters(pixel):
    mid_lat = (pixel["min_lat"] + pixel["max_lat"]) / 2
    mid_lon = (pixel["min_lon"] + pixel["max_lon"]) / 2
    north_west = make_tile(mid_lat, pixel["max_lat"], pixel["min_lon"], mid_lon)
    north_east = make_tile(mid_lat, pixel["max_lat"], mid_lon, pixel["max_lon"])
    south_west = make_tile(pixel["min_lat"], mid_lat, pixel["min_lon"], mid_lon)
    south_east = make_tile(pixel["min_lat"], mid_lat, mid_lon, pixel["max_lon"])
    return [north_west, north_east, south_west, south_east]


def quarter_value(parent, quarter, parent_neighbours):
    if parent["value"] is None:
        return None

    touching_values = []
    for neighbour in parent_neighbours:
        if neighbour["value"] is None:
            continue
        if is_touching(quarter, neighbour):
            touching_values.append(neighbour["value"])

    if len(touching_values) == 0:
        return parent["value"]

    neighbour_average = sum(touching_values) / len(touching_values)
    return (parent["value"] + neighbour_average) / 2


def subdivide_once(pixels):
    arrays = pixels_to_arrays(pixels)
    quarters = []
    for parent in pixels:
        parent_neighbours = find_neighbours(parent, pixels, arrays)
        for quarter in split_into_quarters(parent):
            quarter["value"] = quarter_value(parent, quarter, parent_neighbours)
            quarters.append(quarter)
    return quarters


def subdivide(pixels, levels):
    for level in range(1, levels + 1):
        pixels = subdivide_once(pixels)
        print(f"Subdivision level {level}: {len(pixels)} tiles")
    return pixels
