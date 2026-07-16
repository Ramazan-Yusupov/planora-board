/** Returns the shortest signed angular distance in the [-PI, PI] range. */
export function normalizeAngleDelta(angle: number) {
  let next = angle;

  while (next > Math.PI) {
    next -= Math.PI * 2;
  }

  while (next < -Math.PI) {
    next += Math.PI * 2;
  }

  return next;
}

