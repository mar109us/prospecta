import subprocess
from pathlib import Path

from download import download_file

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEXTURE_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif"
TIFF_PATH = PROJECT_ROOT / "tools/convert/raw/lroc_color_poles_8k.tif"
JPG_PATH = PROJECT_ROOT / "assets/textures/moonColour8k.jpg"
JPG_QUALITY = "85"


def convert_to_jpg(tiff_path, jpg_path):
    jpg_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "sips",
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        JPG_QUALITY,
        str(tiff_path),
        "--out",
        str(jpg_path),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"Could not convert {tiff_path.name} to JPG: {result.stderr}")


def main():
    download_file(TEXTURE_URL, TIFF_PATH)
    convert_to_jpg(TIFF_PATH, JPG_PATH)
    size_mb = JPG_PATH.stat().st_size / 1_000_000
    print(f"Wrote {JPG_PATH.relative_to(PROJECT_ROOT)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
