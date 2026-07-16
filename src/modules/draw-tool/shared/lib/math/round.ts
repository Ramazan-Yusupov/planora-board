/** Rounds a number to the requested number of decimal places. */
export function round(value: number, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

