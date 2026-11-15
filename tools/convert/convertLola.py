from pathlib import Path

import numpy as np

from download import download_file
from grid import HEIGHT, WIDTH, save_grid_json

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOLA_URL = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img"
LOLA_PATH = PROJECT_ROOT / "tools/convert/raw/ldem_4.img"
LOLA_HEIGHT = 720
LOLA_WIDTH = 1440
METRES_PER_UNIT = 0.5

ELEVATION = {
    "name": "elevation",
    "unit": "km",
    "source": "LRO LOLA LDEM_4 (4 pixels per degree), relative to 1737.4 km",
    "output_path": PROJECT_ROOT / "datasets/elevation.json",
}


def read_lola(path):
    raw = np.fromfile(path, dtype="<i2")
    if raw.size != LOLA_HEIGHT * LOLA_WIDTH:
        raise SystemExit(
            f"{path.name} has {raw.size} values, expected {LOLA_HEIGHT * LOLA_WIDTH}."
        )
    return raw.reshape(LOLA_HEIGHT, LOLA_WIDTH)


def units_to_km(raw):
    return raw * METRES_PER_UNIT / 1000


def start_at_180_west(elevation):
    half_turn = elevation.shape[1] // 2
    return np.roll(elevation, half_turn, axis=1)


def average_blocks(elevation, block_size):
    rows = elevation.shape[0] // block_size
    columns = elevation.shape[1] // block_size
    blocks = elevation.reshape(rows, block_size, columns, block_size)
    return blocks.mean(axis=(1, 3))


def print_summary(grid):
    print(f"elevation: min {grid.min():.2f}, max {grid.max():.2f} km")
    print(f"elevation: grid {grid.shape[1]}x{grid.shape[0]}")


def main():
    download_file(LOLA_URL, LOLA_PATH)
    elevation = units_to_km(read_lola(LOLA_PATH))
    elevation = start_at_180_west(elevation)
    grid = average_blocks(elevation, LOLA_WIDTH // WIDTH)
    if grid.shape != (HEIGHT, WIDTH):
        raise SystemExit(f"Elevation grid is {grid.shape}, expected {(HEIGHT, WIDTH)}.")

    save_grid_json(grid, ELEVATION, ELEVATION["output_path"])
    print_summary(grid)
    print(f"Wrote {ELEVATION['output_path'].relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
