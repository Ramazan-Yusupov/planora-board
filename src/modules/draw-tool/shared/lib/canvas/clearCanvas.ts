export function clearCanvas(context: CanvasRenderingContext2D) {
  context.save();

  context.setTransform(1, 0, 0, 1, 0, 0);

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  context.restore();
}

