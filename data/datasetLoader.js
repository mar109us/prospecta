export async function loadDataset(name) {
  const url = `datasets/${name}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not load dataset "${name}" from ${url}: the server answered ${response.status} ${response.statusText}.`,
    );
  }

  const grid = await response.json();
  return grid;
}
