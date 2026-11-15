import subprocess
from pathlib import Path

import numpy as np

from convertLola import start_at_180_west, units_to_km, read_lola
from download import download_file
from normalMap import encode_normals, fine_detail, slopes, write_ppm

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LDEM_URL = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_16.img"
LDEM_PATH = PROJECT_ROOT / "tools/convert/raw/ldem_16.img"
PPM_PATH = PROJECT_ROOT / "tools/convert/raw/moonNormal16.ppm"
PNG_PATH = PROJECT_ROOT / "assets/textures/moonNormal16.png"
LDEM_HEIGHT = 2880
LDEM_WIDTH = 5760
PIXELS_PER_DEGREE = 16
MESH_WINDOW = 9
BAKED_STRENGTH = 4


def convert_to_png(ppm_path, png_path):
    png_path.parent.mkdir(parents=True, exist_ok=True)
    command = ["sips", "-s", "format", "png", str(ppm_path), "--out", str(png_path)]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"Could not convert {ppm_path.name} to PNG: {result.stderr}")


def main():
    download_file(LDEM_URL, LDEM_PATH)
    elevation_m = units_to_km(read_lola(LDEM_PATH, LDEM_HEIGHT, LDEM_WIDTH)) * 1000
    elevation_m = start_at_180_west(elevation_m)

    detail = fine_detail(elevation_m, MESH_WINDOW)
    slope_east, slope_north = slopes(detail, PIXELS_PER_DEGREE)
    rgb = encode_normals(slope_east, slope_north, BAKED_STRENGTH)

    write_ppm(rgb, PPM_PATH)
    convert_to_png(PPM_PATH, PNG_PATH)

    typical_slope = np.median(np.hypot(slope_east, slope_north))
    size_mb = PNG_PATH.stat().st_size / 1_000_000
    print(f"normal map: fine detail range {detail.min():.0f} to {detail.max():.0f} m")
    print(f"normal map: typical fine slope {typical_slope:.3f} (rise per metre)")
    print(f"Wrote {PNG_PATH.relative_to(PROJECT_ROOT)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
