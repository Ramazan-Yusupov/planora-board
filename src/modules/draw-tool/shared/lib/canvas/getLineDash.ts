export function getLineDash(
  strokeStyle: "solid" | "dashed" | "dotted",
  strokeWidth: number,
) {
  switch (strokeStyle) {
    case "dashed":
      return [strokeWidth * 5, strokeWidth * 3];

    case "dotted":
      return [strokeWidth, strokeWidth * 2];

    default:
      return [];
  }
}

