from pathlib import Path

import numpy as np

from download import download_file
from grid import CENTRE_LATS, HEIGHT, WIDTH, save_grid_json
from raster import print_summary

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HYDROGEN_URL = "https://pds-geosciences.wustl.edu/missions/lunarp/reduced/hydrogenhd.dat"
HYDROGEN_PATH = PROJECT_ROOT / "tools/convert/raw/hydrogenhd.dat"
VALUE_DIVISOR = 10
LEND_COVERAGE_START_DEG = 80

HYDROGEN = {
    "name": "hydrogen",
    "unit": "H ppm",
    "source": "Lunar Prospector Neutron Spectrometer, Feldman et al. 2001 (0.5 degree bins); cut poleward of 80 degrees, where LEND takes over",
    "output_path": PROJECT_ROOT / "datasets/hydrogen.json",
}


def read_hydrogen(path):
    raw = np.fromfile(path, dtype=">i2")
    if raw.size != HEIGHT * WIDTH:
        raise SystemExit(f"{path.name} has {raw.size} values, expected {HEIGHT * WIDTH}.")
    south_first = raw.reshape(HEIGHT, WIDTH) / VALUE_DIVISOR
    return south_first[::-1]


def cut_poles(grid, limit_deg):
    cut = grid.copy()
    cut[np.abs(CENTRE_LATS) > limit_deg] = np.nan
    return cut


def main():
    download_file(HYDROGEN_URL, HYDROGEN_PATH)
    grid = cut_poles(read_hydrogen(HYDROGEN_PATH), LEND_COVERAGE_START_DEG)
    save_grid_json(grid, HYDROGEN, HYDROGEN["output_path"])
    print_summary(grid, HYDROGEN)


if __name__ == "__main__":
    main()
