export function prepareCanvas(
  context: CanvasRenderingContext2D,
  devicePixelRatio: number,
) {
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  context.imageSmoothingEnabled = true;
}

