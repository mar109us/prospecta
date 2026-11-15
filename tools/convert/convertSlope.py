from pathlib import Path

import numpy as np

from convertLola import average_blocks, read_lola, start_at_180_west, units_to_km
from download import download_file
from grid import HEIGHT, WIDTH, save_grid_json
from normalMap import slopes
from polar import blur_longitude_by_latitude

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LDEM_URL = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_16.img"
LDEM_PATH = PROJECT_ROOT / "tools/convert/raw/ldem_16.img"
LDEM_HEIGHT = 2880
LDEM_WIDTH = 5760
PIXELS_PER_DEGREE = 16

SLOPE = {
    "name": "slope",
    "unit": "degrees",
    "source": "Slope from LRO LOLA LDEM_16 (~1.9 km baseline), averaged per 0.5 degree cell",
    "output_path": PROJECT_ROOT / "datasets/slope.json",
}


def slope_degrees(slope_east, slope_north):
    return np.degrees(np.arctan(np.hypot(slope_east, slope_north)))


def print_summary(grid):
    print(f"slope: min {grid.min():.2f}, max {grid.max():.2f}, median {np.median(grid):.2f} degrees")
    print(f"slope: {np.mean(grid < 1) * 100:.0f}% of cells below 1 degree, {np.mean(grid > 15) * 100:.1f}% above 15")


def main():
    download_file(LDEM_URL, LDEM_PATH)
    elevation_m = units_to_km(read_lola(LDEM_PATH, LDEM_HEIGHT, LDEM_WIDTH)) * 1000
    elevation_m = start_at_180_west(elevation_m)
    elevation_m = blur_longitude_by_latitude(elevation_m, PIXELS_PER_DEGREE)

    slope_east, slope_north = slopes(elevation_m, PIXELS_PER_DEGREE)
    degrees = slope_degrees(slope_east, slope_north)
    grid = average_blocks(degrees, LDEM_WIDTH // WIDTH)
    if grid.shape != (HEIGHT, WIDTH):
        raise SystemExit(f"Slope grid is {grid.shape}, expected {(HEIGHT, WIDTH)}.")

    save_grid_json(grid, SLOPE, SLOPE["output_path"])
    print_summary(grid)
    print(f"Wrote {SLOPE['output_path'].relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
