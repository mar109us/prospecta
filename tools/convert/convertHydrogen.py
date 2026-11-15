from pathlib import Path

import numpy as np

from download import download_file
from grid import CENTRE_LATS, HEIGHT, WIDTH, save_grid_json
from raster import print_summary

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HYDROGEN_URL = "https://pds-geosciences.wustl.edu/missions/lunarp/reduced/hydrogenhd.dat"
HYDROGEN_PATH = PROJECT_ROOT / "tools/convert/raw/hydrogenhd.dat"
VALUE_DIVISOR = 10
ICE_BAND_START_DEG = 70
LEND_COVERAGE_START_DEG = 80
CROSS_FADE_DEG = 3

HYDROGEN = {
    "name": "hydrogen",
    "unit": "H ppm",
    "source": "Lunar Prospector Neutron Spectrometer, Feldman et al. 2001 (0.5 degree bins); kept only between 70 and 80 degrees: closer to the equator it is solar-wind hydrogen, not ice, and LEND takes over beyond 80 (both run to 83 so the app can cross-fade them)",
    "output_path": PROJECT_ROOT / "datasets/hydrogen.json",
}


def read_hydrogen(path):
    raw = np.fromfile(path, dtype=">i2")
    if raw.size != HEIGHT * WIDTH:
        raise SystemExit(f"{path.name} has {raw.size} values, expected {HEIGHT * WIDTH}.")
    south_first = raw.reshape(HEIGHT, WIDTH) / VALUE_DIVISOR
    return south_first[::-1]


def keep_latitude_band(grid, min_lat_deg, max_lat_deg):
    kept = grid.copy()
    absolute_lats = np.abs(CENTRE_LATS)
    kept[absolute_lats < min_lat_deg] = np.nan
    kept[absolute_lats > max_lat_deg] = np.nan
    return kept


def main():
    download_file(HYDROGEN_URL, HYDROGEN_PATH)
    band_end_deg = LEND_COVERAGE_START_DEG + CROSS_FADE_DEG
    grid = keep_latitude_band(read_hydrogen(HYDROGEN_PATH), ICE_BAND_START_DEG, band_end_deg)
    save_grid_json(grid, HYDROGEN, HYDROGEN["output_path"])
    print_summary(grid, HYDROGEN)


if __name__ == "__main__":
    main()
