export function parseCsvRows(source: string) {
  return source
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    )
    .filter((row) => row.some(Boolean));
}

