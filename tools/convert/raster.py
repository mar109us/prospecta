import numpy as np
import tifffile

from grid import HEIGHT, RESOLUTION_DEG, WIDTH


def read_geotiff(path):
    with tifffile.TiffFile(path) as tif:
        page = tif.pages[0]
        tags = page.tags
        if "ModelPixelScaleTag" not in tags or "ModelTiepointTag" not in tags:
            raise SystemExit(f"{path.name} has no GeoTIFF position tags, so its lat/lon is unknown.")

        scale = tags["ModelPixelScaleTag"].value
        tiepoint = tags["ModelTiepointTag"].value
        nodata = None
        if "GDAL_NODATA" in tags:
            nodata = float(tags["GDAL_NODATA"].value)
        data = page.asarray().astype(float)

    if tiepoint[0] != 0 or tiepoint[1] != 0 or scale[0] != scale[1]:
        raise SystemExit(f"{path.name} uses an unexpected GeoTIFF layout: tiepoint {tiepoint}, scale {scale}.")

    return {
        "data": data,
        "west": tiepoint[3],
        "north": tiepoint[4],
        "pixel_deg": scale[0],
        "nodata": nodata,
    }


def resample_to_grid(raster):
    data = raster["data"].copy()
    if raster["nodata"] is not None:
        data[data == raster["nodata"]] = np.nan

    rows, columns = data.shape
    pixel_deg = raster["pixel_deg"]
    lons = raster["west"] + (np.arange(columns) + 0.5) * pixel_deg
    target_columns = np.floor(((lons + 180) % 360) / RESOLUTION_DEG).astype(int) % WIDTH

    total = np.zeros((HEIGHT, WIDTH))
    count = np.zeros((HEIGHT, WIDTH))
    for row in range(rows):
        lat = raster["north"] - (row + 0.5) * pixel_deg
        target_row = int((90 - lat) // RESOLUTION_DEG)
        if target_row < 0 or target_row >= HEIGHT:
            continue

        values = data[row]
        is_valid = ~np.isnan(values)
        total[target_row] += np.bincount(target_columns[is_valid], weights=values[is_valid], minlength=WIDTH)
        count[target_row] += np.bincount(target_columns[is_valid], minlength=WIDTH)

    grid = np.full((HEIGHT, WIDTH), np.nan)
    has_data = count > 0
    grid[has_data] = total[has_data] / count[has_data]
    return grid


def print_summary(grid, dataset):
    name = dataset["name"]
    empty_share = np.isnan(grid).mean() * 100
    print(f"{name}: min {np.nanmin(grid):.3f}, max {np.nanmax(grid):.3f} {dataset['unit']}, {empty_share:.0f}% empty cells")


def box_sum(values, window):
    half = window // 2
    padded = np.pad(values, ((half, half), (0, 0)), mode="edge")
    padded = np.pad(padded, ((0, 0), (half, half)), mode="wrap")
    sums = padded.cumsum(axis=0).cumsum(axis=1)
    sums = np.pad(sums, ((1, 0), (1, 0)))
    return sums[window:, window:] - sums[:-window, window:] - sums[window:, :-window] + sums[:-window, :-window]


def smooth_grid(grid, window):
    has_data = ~np.isnan(grid)
    totals = box_sum(np.where(has_data, grid, 0), window)
    counts = box_sum(has_data.astype(float), window)
    smoothed = np.full(grid.shape, np.nan)
    smoothed[has_data] = totals[has_data] / counts[has_data]
    return smoothed
