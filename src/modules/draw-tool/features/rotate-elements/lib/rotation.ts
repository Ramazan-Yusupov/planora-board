/**
 * Excalidraw-style angular snapping is based on a 15° grid. This preserves
 * practical angles such as 0°, 15°, 30°, 45°, 60° and 90° without storing
 * rounded degree values in the scene model.
 */
export const ROTATION_SNAP_DEGREES = 15;
export const ROTATION_SNAP_ANGLE = degreesToRadians(ROTATION_SNAP_DEGREES);
export const ROTATION_LARGE_STEP_DEGREES = 90;
export const ROTATION_LARGE_STEP_ANGLE = degreesToRadians(
  ROTATION_LARGE_STEP_DEGREES,
);

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function snapRotationAngle(
  angle: number,
  step = ROTATION_SNAP_ANGLE,
) {
  return Math.round(angle / step) * step;
}

