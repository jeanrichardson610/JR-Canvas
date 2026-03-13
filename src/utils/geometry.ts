export function getStroke(
  points: Array<{ x: number; y: number; pressure?: number }>,
  options = {}
) {
  // Simple bezier smoothing for pencil
  if (points.length < 2) return '';
  const d = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const mx = (prev.x + point.x) / 2;
    const my = (prev.y + point.y) / 2;
    return acc + ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }, '');
  return d;
}

export function rectContainsPoint(
  rect: { x: number; y: number; width: number; height: number },
  point: { x: number; y: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getSelectionBounds(
  objects: Array<{ x: number; y: number; width: number; height: number }>
) {
  if (objects.length === 0) return null;
  const minX = Math.min(...objects.map((o) => o.x));
  const minY = Math.min(...objects.map((o) => o.y));
  const maxX = Math.max(...objects.map((o) => o.x + o.width));
  const maxY = Math.max(...objects.map((o) => o.y + o.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number
) {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  panX: number,
  panY: number,
  zoom: number
) {
  return {
    x: canvasX * zoom + panX,
    y: canvasY * zoom + panY,
  };
}
