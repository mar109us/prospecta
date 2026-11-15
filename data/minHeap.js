export function createMinHeap() {
  return {
    items: [],
  };
}

function swap(items, a, b) {
  const temporary = items[a];
  items[a] = items[b];
  items[b] = temporary;
}

function parentOf(index) {
  return Math.floor((index - 1) / 2);
}

function siftUp(items, index) {
  while (index > 0 && items[index].priority < items[parentOf(index)].priority) {
    swap(items, index, parentOf(index));
    index = parentOf(index);
  }
}

function smallestChild(items, index) {
  const left = index * 2 + 1;
  const right = left + 1;
  let smallest = index;
  if (left < items.length && items[left].priority < items[smallest].priority) smallest = left;
  if (right < items.length && items[right].priority < items[smallest].priority) smallest = right;
  return smallest;
}

function siftDown(items, index) {
  let smallest = smallestChild(items, index);
  while (smallest !== index) {
    swap(items, index, smallest);
    index = smallest;
    smallest = smallestChild(items, index);
  }
}

export function pushItem(heap, value, priority) {
  heap.items.push({
    value: value,
    priority: priority,
  });
  siftUp(heap.items, heap.items.length - 1);
}

export function popSmallest(heap) {
  const items = heap.items;
  if (items.length === 0) return null;

  const smallest = items[0];
  const last = items.pop();
  if (items.length > 0) {
    items[0] = last;
    siftDown(items, 0);
  }
  return smallest;
}

export function isHeapEmpty(heap) {
  return heap.items.length === 0;
}
