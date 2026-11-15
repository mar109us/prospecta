export function isOverlapping(first, second) {
  if (first.x + first.width <= second.x) return false;
  if (second.x + second.width <= first.x) return false;
  if (first.y + first.height <= second.y) return false;
  if (second.y + second.height <= first.y) return false;
  return true;
}

function findOverlap(box, placedBoxes) {
  for (const placedBox of placedBoxes) {
    if (isOverlapping(box, placedBox)) return placedBox;
  }
  return null;
}

export function stackBoxes(boxes, gapPx) {
  const placedBoxes = [];
  for (const box of boxes) {
    let overlap = findOverlap(box, placedBoxes);
    while (overlap) {
      box.y = overlap.y + overlap.height + gapPx;
      overlap = findOverlap(box, placedBoxes);
    }
    placedBoxes.push(box);
  }
}
