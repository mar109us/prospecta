from pathlib import Path

from download import download_file
from grid import save_grid_json
from raster import print_summary, read_geotiff, resample_to_grid

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "tools/convert/raw"
MI_URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Lunar_MI_mineral_maps/4ppd"
MI_SOURCE = "Kaguya Multiband Imager mineral maps, Lemelin et al. 2016 (4 pixels per degree)"


def mi_dataset(name, product, unit, scale, nodata):
    file_name = f"Lunar_Kaguya_MIMap_MineralDeconv_{product}_50N50S.tif"
    return {
        "name": name,
        "unit": unit,
        "source": MI_SOURCE,
        "url": f"{MI_URL}/{file_name}",
        "path": RAW / file_name,
        "scale": scale,
        "nodata": nodata,
        "output_path": PROJECT_ROOT / f"datasets/{name}.json",
    }


MI_DATASETS = [
    mi_dataset("olivine", "OlivinePercent", "olivine %", 100, None),
    mi_dataset("plagioclase", "PlagioclasePercent", "plagioclase %", 100, 0),
]

LOW_CA_PYROXENE = mi_dataset("lowCaPyroxene", "OrthopyroxenePercent", "low-Ca pyroxene %", 100, None)
HIGH_CA_PYROXENE = mi_dataset("highCaPyroxene", "ClinopyroxenePercent", "high-Ca pyroxene %", 100, None)
PYROXENE = {
    "name": "pyroxene",
    "unit": "pyroxene %",
    "source": f"{MI_SOURCE}; low-Ca + high-Ca pyroxene",
    "output_path": PROJECT_ROOT / "datasets/pyroxene.json",
}


def read_mi_raster(dataset):
    download_file(dataset["url"], dataset["path"])
    raster = read_geotiff(dataset["path"])
    if dataset["nodata"] is not None:
        raster["nodata"] = dataset["nodata"]
    return raster


def convert_mi(dataset):
    raster = read_mi_raster(dataset)
    grid = resample_to_grid(raster) * dataset["scale"]
    save_grid_json(grid, dataset, dataset["output_path"])
    print_summary(grid, dataset)


def check_same_layout(first, second):
    if first["data"].shape != second["data"].shape:
        raise SystemExit(f"Pyroxene rasters differ in size: {first['data'].shape} vs {second['data'].shape}.")
    for key in ["west", "north", "pixel_deg"]:
        if first[key] != second[key]:
            raise SystemExit(f"Pyroxene rasters differ in {key}: {first[key]} vs {second[key]}.")


def sum_grids(first, second):
    return first + second


def convert_pyroxene():
    low_ca = read_mi_raster(LOW_CA_PYROXENE)
    high_ca = read_mi_raster(HIGH_CA_PYROXENE)
    check_same_layout(low_ca, high_ca)
    low_ca_grid = resample_to_grid(low_ca) * LOW_CA_PYROXENE["scale"]
    high_ca_grid = resample_to_grid(high_ca) * HIGH_CA_PYROXENE["scale"]
    grid = sum_grids(low_ca_grid, high_ca_grid)
    save_grid_json(grid, PYROXENE, PYROXENE["output_path"])
    print_summary(grid, PYROXENE)


def main():
    for dataset in MI_DATASETS:
        convert_mi(dataset)
    convert_pyroxene()


if __name__ == "__main__":
    main()
