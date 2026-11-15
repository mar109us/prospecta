import re
from pathlib import Path

import numpy as np

from download import download_file
from grid import save_grid_json
from raster import print_summary, resample_to_grid

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "tools/convert/raw"
WAC_URL = "https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/DATA/SDP/WAC_TIO2"
TILE_NAMES = [
    "WAC_TIO2_E350N0450",
    "WAC_TIO2_E350N1350",
    "WAC_TIO2_E350N2250",
    "WAC_TIO2_E350N3150",
    "WAC_TIO2_E350S0450",
    "WAC_TIO2_E350S1350",
    "WAC_TIO2_E350S2250",
    "WAC_TIO2_E350S3150",
]
MISSING_BELOW = -1e30
MAX_VALID_WT = 20

TITANIUM = {
    "name": "titanium",
    "unit": "TiO2 wt%",
    "source": "LRO WAC TiO2 (Sato et al. 2017), 400 m/pixel; values under 2 wt% are stored as 1",
    "output_path": PROJECT_ROOT / "datasets/titanium.json",
}


def label_value(label, tag):
    match = re.search(r"<(?:[a-z]+:)?" + tag + r"[^>]*>([^<]+)<", label)
    if not match:
        raise SystemExit(f"WAC label is missing <{tag}>.")
    return match.group(1)


def read_tile(name):
    for extension in ["xml", "IMG"]:
        download_file(f"{WAC_URL}/{name}.{extension}", RAW / f"{name}.{extension}")

    label = (RAW / f"{name}.xml").read_text()
    image_section = label[label.index("<Array_2D_Image>"):]
    byte_offset = int(label_value(image_section, "offset"))
    lines_and_samples = re.findall(r"<elements>(\d+)<", image_section)
    lines = int(lines_and_samples[0])
    samples = int(lines_and_samples[1])
    pixel_deg = float(label_value(label, "pixel_resolution_y"))

    data = np.fromfile(RAW / f"{name}.IMG", dtype="<f4", count=lines * samples, offset=byte_offset)
    data = data.reshape(lines, samples).astype(float)
    data[data < MISSING_BELOW] = np.nan
    data[data > MAX_VALID_WT] = np.nan
    return {
        "data": data,
        "west": float(label_value(label, "west_bounding_coordinate")) - pixel_deg / 2,
        "north": float(label_value(label, "north_bounding_coordinate")) + pixel_deg / 2,
        "pixel_deg": pixel_deg,
        "nodata": None,
    }


def main():
    combined = None
    for name in TILE_NAMES:
        tile_grid = resample_to_grid(read_tile(name))
        if combined is None:
            combined = tile_grid
        else:
            combined = np.where(np.isnan(combined), tile_grid, combined)
        print(f"{name}: merged")

    save_grid_json(combined, TITANIUM, TITANIUM["output_path"])
    print_summary(combined, TITANIUM)


if __name__ == "__main__":
    main()
