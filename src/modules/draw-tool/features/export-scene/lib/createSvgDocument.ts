import {
  getArrowCurveControlPoint,
  getArrowPathPoints,
  getElementBounds,
} from "@/modules/draw-tool/entities/element";
import { getImageObjectRect } from "@/modules/draw-tool/entities/element/lib/getImageObjectRect";
import { roundedPolylineSvgPath } from "@/modules/draw-tool/entities/element/lib/getRoundedPolylinePath";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function getSceneBounds(elements: BoardElement[], padding: number) {
  if (elements.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const bounds = elements.map(getElementBounds);
  const left = Math.min(...bounds.map((item) => item.x)) - padding;
  const top = Math.min(...bounds.map((item) => item.y)) - padding;
  const right = Math.max(...bounds.map((item) => item.x + item.width)) + padding;
  const bottom = Math.max(...bounds.map((item) => item.y + item.height)) + padding;
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function textSvg(text: string, x: number, y: number, fontSize: number, color: string, maxWidth?: number) {
  const width = maxWidth ? ` textLength="${Math.max(1, maxWidth)}" lengthAdjust="spacingAndGlyphs"` : "";
  return text.split("\n").map((line, index) => `<text x="${x}" y="${y + fontSize + index * Math.round(fontSize * 1.25)}" fill="${color}" font-size="${fontSize}" font-family="Inter,Segoe UI,sans-serif"${width}>${escapeXml(line || " ")}</text>`).join("");
}

function getPathLabelPlacement(points: { x: number; y: number }[]) {
  if (points.length < 2) return null;

  const segments = points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    return {
      end,
      length: Math.hypot(end.x - start.x, end.y - start.y),
      start,
    };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  let remaining = totalLength / 2;

  for (const segment of segments) {
    if (remaining <= segment.length || segment === segments.at(-1)) {
      const progress = segment.length <= 0 ? 0 : remaining / segment.length;
      let angle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x);

      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
      }

      return {
        angle: (angle * 180) / Math.PI,
        x: segment.start.x + (segment.end.x - segment.start.x) * progress,
        y: segment.start.y + (segment.end.y - segment.start.y) * progress,
      };
    }

    remaining -= segment.length;
  }

  return null;
}

function labelAlongPathSvg(
  label: string | undefined,
  points: { x: number; y: number }[],
  color: string,
  withBackground = false,
) {
  const value = label?.trim();
  const placement = value ? getPathLabelPlacement(points) : null;

  if (!value || !placement) return "";

  const width = Math.max(24, value.length * 8 + 14);
  const height = 24;
  const background = withBackground
    ? `<rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" fill="rgb(15 23 42)" fill-opacity="0.86" />`
    : "";
  return `<g transform="translate(${placement.x} ${placement.y}) rotate(${placement.angle})">${background}<text x="0" y="0.5" fill="${color}" font-size="15" font-weight="700" font-family="Inter,Segoe UI,sans-serif" text-anchor="middle" dominant-baseline="middle">${escapeXml(value)}</text></g>`;
}

function badgeLabelFontSize(label: string, width: number, height: number) {
  const maxByHeight = Math.max(11, height - 24);
  const maxByWidth = Math.max(11, (width - 48) / Math.max(label.length * 0.55, 1));
  return Math.max(11, Math.min(maxByHeight, maxByWidth));
}

function safeSvgId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

function elementToSvg(element: BoardElement) {
  const { x, y, width, height, style } = element;
  const bounds = getElementBounds(element);
  const common = `fill="${style.fillStyle === "solid" ? style.backgroundColor : "none"}" fill-opacity="${style.opacity}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"`;
  let markup: string;

  if (element.type === "ellipse") {
    markup = `<ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${Math.abs(width) / 2}" ry="${Math.abs(height) / 2}" ${common} />`;
  } else if (element.type === "line" || element.type === "measure") {
    markup = `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" ${common} />`;
    if (element.type === "line") {
      markup += labelAlongPathSvg(element.label, [{ x, y }, { x: x + width, y: y + height }], style.strokeColor);
    }
    if (element.type === "measure") {
      const distance = Math.hypot(width, height).toFixed(1);
      markup += textSvg(`${distance} px`, x + width / 2 - 20, y + height / 2 - 8, 12, style.strokeColor);
    }
  } else if (element.type === "arrow") {
    if (element.routing === "curve") {
      const control = getArrowCurveControlPoint(element);
      markup = `<path d="M ${element.x} ${element.y} Q ${control.x} ${control.y} ${element.x + element.width} ${element.y + element.height}" fill="none" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" marker-end="url(#arrowhead)" />`;
    } else if (element.routing === "straight" && element.routeCornerStyle === "rounded") {
      markup = `<path d="${roundedPolylineSvgPath(getArrowPathPoints(element))}" fill="none" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" marker-end="url(#arrowhead)" />`;
    } else {
      const points = getArrowPathPoints(element).map((point) => `${point.x},${point.y}`).join(" ");
      markup = `<polyline points="${points}" fill="none" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" marker-end="url(#arrowhead)" />`;
    }
    markup += labelAlongPathSvg(element.label, getArrowPathPoints(element), style.strokeColor, true);
  } else if (element.type === "badge") {
    const value = element.label?.trim() || "Badge";
    const radius = Math.abs(height) / 2;
    const fontSize = badgeLabelFontSize(value, Math.abs(width), Math.abs(height));
    markup = `<rect x="${x}" y="${y}" width="${Math.abs(width)}" height="${Math.abs(height)}" rx="${radius}" ${common} />`;
    markup += `<text x="${x + Math.abs(width) / 2}" y="${y + Math.abs(height) / 2}" fill="${style.strokeColor}" font-size="${fontSize}" font-weight="700" font-family="Inter,Segoe UI,sans-serif" text-anchor="middle" dominant-baseline="middle">${escapeXml(value)}</text>`;
  } else if (element.type === "text") {
    markup = textSvg(element.text, x + 6, y + 4, element.fontSize, style.strokeColor);
  } else if (element.type === "sticky") {
    markup = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="12" fill="${style.backgroundColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" />` + textSvg(element.text, bounds.x + 10, bounds.y + 8, element.fontSize, style.strokeColor);
  } else if (element.type === "markdown") {
    markup = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="14" fill="${style.backgroundColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" />`;
    markup += `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="34" rx="14" fill="#1e293b" opacity="0.82" />`;
    markup += textSvg(element.title, bounds.x + 12, bounds.y + 4, 14, "#f8fafc", bounds.width - 24);
    markup += textSvg(element.content.replace(/^#{1,2}\s+/gm, "").replace(/^[-*]\s+/gm, "• "), bounds.x + 12, bounds.y + 42, element.fontSize, "#cbd5e1", bounds.width - 24);
  } else if (element.type === "callout") {
    const line = element.targetPoint ? `<line x1="${bounds.x + bounds.width / 2}" y1="${bounds.y + bounds.height / 2}" x2="${element.targetPoint.x}" y2="${element.targetPoint.y}" stroke="${style.strokeColor}" stroke-dasharray="5 4" />` : "";
    markup = `${line}<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="12" fill="${style.backgroundColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" />${textSvg(element.text, bounds.x + 10, bounds.y + 8, element.fontSize, "#f8fafc")}`;
  } else if (element.type === "table") {
    const cellWidth = bounds.width / element.columns;
    const cellHeight = bounds.height / element.rows;
    let grid = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="${style.cornerStyle === "rounded" ? 10 : 0}" ${common} />`;
    for (let c = 1; c < element.columns; c += 1) grid += `<line x1="${bounds.x + c * cellWidth}" y1="${bounds.y}" x2="${bounds.x + c * cellWidth}" y2="${bounds.y + bounds.height}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" />`;
    for (let r = 1; r < element.rows; r += 1) grid += `<line x1="${bounds.x}" y1="${bounds.y + r * cellHeight}" x2="${bounds.x + bounds.width}" y2="${bounds.y + r * cellHeight}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}" />`;
    element.cells.forEach((cell, index) => { const r = Math.floor(index / element.columns); const c = index % element.columns; grid += textSvg(cell, bounds.x + c * cellWidth + 8, bounds.y + r * cellHeight + 8, element.fontSize, "#e2e8f0", cellWidth - 14); });
    markup = grid;
  } else if (element.type === "freedraw" || element.type === "highlighter") {
    const points = element.points.map((point) => `${point.x},${point.y}`).join(" ");
    markup = `<polyline points="${points}" fill="none" stroke="${style.strokeColor}" stroke-opacity="${style.opacity}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${style.strokeWidth}" />`;
  } else if (element.type === "image") {
    const frame = {
      x: Math.min(x, x + width),
      y: Math.min(y, y + height),
      width: Math.abs(width),
      height: Math.abs(height),
    };
    const imageRect = getImageObjectRect(
      frame,
      element.originalWidth,
      element.originalHeight,
      element.objectFit ?? "fill",
      element.objectPosition ?? "center",
    );
    const clipId = `image-clip-${safeSvgId(element.id)}`;
    const radius = Math.min(element.cornerRadius ?? 0, frame.width / 2, frame.height / 2);
    const clipShape = element.shape === "circle"
      ? `<ellipse cx="${frame.x + frame.width / 2}" cy="${frame.y + frame.height / 2}" rx="${frame.width / 2}" ry="${frame.height / 2}" />`
      : `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${radius}" />`;
    const background = style.fillStyle === "solid"
      ? `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="${style.backgroundColor}" />`
      : "";
    markup = `<g opacity="${style.opacity}"><clipPath id="${clipId}">${clipShape}</clipPath><g clip-path="url(#${clipId})">${background}<image href="${escapeXml(element.src)}" x="${imageRect.x}" y="${imageRect.y}" width="${imageRect.width}" height="${imageRect.height}" preserveAspectRatio="none" /></g></g>`;
  } else {
    markup = `<rect x="${x}" y="${y}" width="${Math.abs(width)}" height="${Math.abs(height)}" rx="${style.cornerStyle === "rounded" ? 12 : 0}" ${common} />`;
  }

  return element.link ? `<a href="${escapeXml(element.link)}" target="_blank">${markup}</a>` : markup;
}

/** Builds a portable SVG snapshot; specialized DrawTool elements retain their editable visual form. */
export function createSvgDocument(elements: BoardElement[], padding = 24) {
  const bounds = getSceneBounds(elements, padding);
  const content = elements.map(elementToSvg).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" /></marker></defs>${content}</svg>`;
}

