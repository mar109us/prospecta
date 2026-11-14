import urllib.error
import urllib.request
from pathlib import Path


def download_file(url, path):
    path = Path(path)
    if path.exists():
        print(f"Already downloaded: {path.name}")
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    partial_path = path.with_suffix(".part")
    print(f"Downloading {url}")

    try:
        urllib.request.urlretrieve(url, partial_path)
    except urllib.error.URLError as error:
        partial_path.unlink(missing_ok=True)
        raise SystemExit(f"Could not download {url}: {error}")

    partial_path.rename(path)
    print(f"Saved {path.name}")
