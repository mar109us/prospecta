import json
from pathlib import Path

import numpy as np

RESOLUTION_DEG = 0.5
WIDTH = 720
HEIGHT = 360

CENTRE_LATS = 90 - RESOLUTION_DEG / 2 - np.arange(HEIGHT) * RESOLUTION_DEG
CENTRE_LONS = -180 + RESOLUTION_DEG / 2 + np.arange(WIDTH) * RESOLUTION_DEG


def make_empty_grid():
    return np.full((HEIGHT, WIDTH), np.nan)


def fill_pixel(grid, pixel):
    is_row_inside = (CENTRE_LATS >= pixel["min_lat"]) & (CENTRE_LATS < pixel["max_lat"])
    is_col_inside = (CENTRE_LONS >= pixel["min_lon"]) & (CENTRE_LONS < pixel["max_lon"])
    grid[np.ix_(is_row_inside, is_col_inside)] = pixel["value"]


def grid_to_values(grid):
    values = []
    for value in grid.flatten():
        if np.isnan(value):
            values.append(None)
        else:
            values.append(round(float(value), 2))
    return values


def save_grid_json(grid, info, path):
    output = {
        "name": info["name"],
        "unit": info["unit"],
        "source": info["source"],
        "resolutionDeg": RESOLUTION_DEG,
        "width": WIDTH,
        "height": HEIGHT,
        "min": round(float(np.nanmin(grid)), 2),
        "max": round(float(np.nanmax(grid)), 2),
        "values": grid_to_values(grid),
    }

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as file:
        json.dump(output, file, separators=(",", ":"))
