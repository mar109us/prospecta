import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

from detailTiles import PIXELS_PER_DEGREE, SEGMENTS, TEXTURE_SIZE, lon_factor, list_tiles, tiles_in_region
from download import download_file
from ldemWindow import LOLA_256, corner_heights_m, open_ldem, pixel_heights_m
from normalMap import encode_normals, tile_slopes, write_ppm
from wacMosaic import covers, encode_ratio, fade_near_seams, open_mosaic, read_label, sample, seam_weight, shade_ratio

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "tools/convert/raw"
PPM_FOLDER = RAW / "detailPpm"
OUTPUT = PROJECT_ROOT / "assets/detail"
LDEM_URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif"
LDEM_PATH = RAW / "ldem_256.tif"
WAC_URL = "https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/DATA/BDR/WAC_GLOBAL"
WAC_NAMES = [
    "E300N0450",
    "E300N1350",
    "E300N2250",
    "E300N3150",
    "E300S0450",
    "E300S1350",
    "E300S2250",
    "E300S3150",
    "P900N0000",
    "P900S0000",
]
BAKED_STRENGTH = 4
JPG_QUALITY = 90
SHADE_BLUR_PIXELS = 7
SHADE_DARK_FLOOR = 0.02
SEAM_FADE_KM = 8
SIPS_BATCH = 100


def load_mosaics():
    mosaics = []
    for name in WAC_NAMES:
        base = f"WAC_GLOBAL_{name}_100M"
        for extension in ["xml", "IMG"]:
            download_file(f"{WAC_URL}/{base}.{extension}", RAW / f"{base}.{extension}")
        mosaic = read_label((RAW / f"{base}.xml").read_text())
        mosaic["source"] = open_mosaic(RAW / f"{base}.IMG", mosaic)
        mosaics.append(mosaic)
    return mosaics


def mosaic_for(mosaics, tile):
    centre_lat = (tile["south"] + tile["north"]) / 2
    centre_lon = (tile["west"] + tile["east"]) / 2
    for mosaic in mosaics:
        if covers(mosaic, centre_lat, centre_lon):
            return mosaic
    raise SystemExit(f"No WAC file covers tile {tile['id']}.")


def pixel_centres(tile, margin):
    count = TEXTURE_SIZE + 2 * margin
    lat_step = (tile["north"] - tile["south"]) / TEXTURE_SIZE
    lon_step = (tile["east"] - tile["west"]) / TEXTURE_SIZE
    steps = np.arange(count) - margin + 0.5
    lats = tile["north"] - steps * lat_step
    lons = tile["west"] + steps * lon_step
    return lats, lons, lat_step, lon_step


def bake_normals(ldem, tile):
    factor = lon_factor(tile)
    elevation = pixel_heights_m(ldem, tile, LOLA_256, TEXTURE_SIZE, factor)
    lats, _, _, _ = pixel_centres(tile, 0)
    slope_east, slope_north = tile_slopes(elevation, lats, PIXELS_PER_DEGREE, factor)
    return encode_normals(slope_east, slope_north, BAKED_STRENGTH)


def bake_shade(mosaics, tile):
    margin = SHADE_BLUR_PIXELS // 2
    lats, lons, lat_step, lon_step = pixel_centres(tile, margin)
    lat_grid, lon_grid = np.meshgrid(lats, lons, indexing="ij")
    mosaic = mosaic_for(mosaics, tile)
    values = sample(mosaic, mosaic["source"], lat_grid, lon_grid, lat_step, lon_step)
    ratio = shade_ratio(values, SHADE_BLUR_PIXELS, SHADE_DARK_FLOOR)[margin:-margin, margin:-margin]
    inner_lats = lat_grid[margin:-margin, margin:-margin]
    inner_lons = lon_grid[margin:-margin, margin:-margin]
    ratio = fade_near_seams(ratio, seam_weight(inner_lats, inner_lons, SEAM_FADE_KM))
    grey = encode_ratio(ratio)
    return np.stack([grey, grey, grey], axis=-1)


def is_baked(tile):
    for suffix in [".bin", "_normal.jpg", "_shade.jpg"]:
        if not (OUTPUT / f"{tile['id']}{suffix}").exists():
            return False
    return True


def bake_tile(ldem, mosaics, tile):
    heights = corner_heights_m(ldem, tile, LOLA_256, SEGMENTS, lon_factor(tile))
    np.round(heights).astype("<i2").tofile(OUTPUT / f"{tile['id']}.bin")
    write_ppm(bake_normals(ldem, tile), PPM_FOLDER / f"{tile['id']}_normal.ppm")
    write_ppm(bake_shade(mosaics, tile), PPM_FOLDER / f"{tile['id']}_shade.ppm")


def convert_ppms_to_jpg():
    ppm_paths = sorted(PPM_FOLDER.glob("*.ppm"))
    for start in range(0, len(ppm_paths), SIPS_BATCH):
        batch = ppm_paths[start:start + SIPS_BATCH]
        command = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(JPG_QUALITY)]
        command += [str(path) for path in batch]
        command += ["--out", str(OUTPUT)]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise SystemExit(f"Could not convert PPM files to JPG: {result.stderr}")
        for path in batch:
            jpg_path = OUTPUT / f"{path.stem}.jpg"
            if not jpg_path.exists():
                (OUTPUT / f"{path.stem}.ppm").rename(jpg_path)
            path.unlink()


def write_tile_list():
    baked = []
    for tile in list_tiles():
        if is_baked(tile):
            baked.append(tile)
    listing = {
        "segments": SEGMENTS,
        "textureSize": TEXTURE_SIZE,
        "tiles": baked,
    }
    (OUTPUT / "tiles.json").write_text(json.dumps(listing))
    print(f"tiles.json lists {len(baked)} baked tiles")


def chosen_tiles(arguments):
    tiles = list_tiles()
    if arguments.tile:
        return [tile for tile in tiles if tile["id"] == arguments.tile]
    if arguments.region:
        south, north, west, east = [float(value) for value in arguments.region.split(",")]
        region = {
            "south": south,
            "north": north,
            "west": west,
            "east": east,
        }
        return tiles_in_region(tiles, region)
    return tiles


def main():
    parser = argparse.ArgumentParser(description="Bake high-resolution detail tiles into assets/detail.")
    parser.add_argument("--tile", help="one tile id, for example s90w180")
    parser.add_argument("--region", help="south,north,west,east in degrees")
    parser.add_argument("--rebake", action="store_true", help="bake again even if the files exist")
    arguments = parser.parse_args()

    download_file(LDEM_URL, LDEM_PATH)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PPM_FOLDER.mkdir(parents=True, exist_ok=True)
    ldem = open_ldem(LDEM_PATH, LOLA_256)
    mosaics = load_mosaics()

    tiles = chosen_tiles(arguments)
    if not tiles:
        raise SystemExit("No tiles match --tile or --region.")
    for count, tile in enumerate(tiles, start=1):
        if is_baked(tile) and not arguments.rebake:
            continue
        bake_tile(ldem, mosaics, tile)
        if count % 20 == 0:
            print(f"baked {count} of {len(tiles)} tiles")
            convert_ppms_to_jpg()
    convert_ppms_to_jpg()
    write_tile_list()


if __name__ == "__main__":
    main()
