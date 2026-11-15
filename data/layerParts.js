export function partIndices(layers, datasetName) {
  const indices = [];
  for (let index = 0; index < layers.length; index++) {
    if (layers[index].partOf === datasetName) indices.push(index);
  }
  return indices;
}
