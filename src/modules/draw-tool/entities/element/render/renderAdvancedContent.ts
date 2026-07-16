import type { AdvancedElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

const PAD = 12;

type AdvancedBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function textLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight = 18,
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function drawTitle(
  context: CanvasRenderingContext2D,
  element: AdvancedElement,
  bounds: AdvancedBounds,
) {
  context.fillStyle = element.style.strokeColor;
  context.font = "700 15px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "top";
  context.fillText(element.title, bounds.x + PAD, bounds.y + PAD);
}

export function renderAdvancedContent(
  context: CanvasRenderingContext2D,
  element: AdvancedElement,
  bounds: AdvancedBounds,
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  context.save();
  context.fillStyle = "#dbeafe";
  context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "top";

  if (element.kind === "bpmn-event") {
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      Math.min(bounds.width, bounds.height) * 0.36,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      Math.min(bounds.width, bounds.height) * 0.27,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.textAlign = "center";
    context.fillText(element.title, centerX, centerY - 8);
    context.restore();
    return;
  }

  if (element.kind === "bpmn-gateway") {
    context.beginPath();
    context.moveTo(centerX, bounds.y + PAD);
    context.lineTo(bounds.x + bounds.width - PAD, centerY);
    context.lineTo(centerX, bounds.y + bounds.height - PAD);
    context.lineTo(bounds.x + PAD, centerY);
    context.closePath();
    context.stroke();
    context.textAlign = "center";
    context.fillText(element.title, centerX, centerY - 8);
    context.restore();
    return;
  }

  drawTitle(context, element, bounds);

  if (element.kind === "swimlane" || element.kind === "kanban-board") {
    const lanes = Math.max(1, element.body.length);
    const laneWidth = bounds.width / lanes;
    element.body.forEach((lane, index) => {
      const x = bounds.x + laneWidth * index;
      if (index > 0) {
        context.beginPath();
        context.moveTo(x, bounds.y + 36);
        context.lineTo(x, bounds.y + bounds.height);
        context.stroke();
      }
      context.fillStyle = "#bfdbfe";
      context.fillText(lane, x + PAD, bounds.y + 46);
      if (element.kind === "kanban-board") {
        context.fillStyle = "rgb(30 41 59 / 82%)";
        drawRoundedRectPath(context, x + 10, bounds.y + 78, laneWidth - 20, 46, 8);
        context.fill();
      }
    });
    context.restore();
    return;
  }

  if (element.kind === "uml-class" || element.kind === "erd-table") {
    context.beginPath();
    context.moveTo(bounds.x, bounds.y + 42);
    context.lineTo(bounds.x + bounds.width, bounds.y + 42);
    context.stroke();
    textLines(context, element.body, bounds.x + PAD, bounds.y + 56);
    context.restore();
    return;
  }

  if (element.kind === "uml-actor") {
    context.textAlign = "center";
    context.beginPath();
    context.arc(centerX, bounds.y + 58, 18, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX, bounds.y + 76);
    context.lineTo(centerX, bounds.y + 132);
    context.moveTo(centerX - 35, bounds.y + 98);
    context.lineTo(centerX + 35, bounds.y + 98);
    context.moveTo(centerX, bounds.y + 132);
    context.lineTo(centerX - 30, bounds.y + bounds.height - 22);
    context.moveTo(centerX, bounds.y + 132);
    context.lineTo(centerX + 30, bounds.y + bounds.height - 22);
    context.stroke();
    context.fillText(element.title, centerX, bounds.y + bounds.height - 18);
    context.restore();
    return;
  }

  if (element.kind === "timeline") {
    const y = centerY + 18;
    context.beginPath();
    context.moveTo(bounds.x + PAD, y);
    context.lineTo(bounds.x + bounds.width - PAD, y);
    context.stroke();
    element.body.forEach((item, index) => {
      const x =
        bounds.x +
        PAD +
        (bounds.width - PAD * 2) *
          (index / Math.max(1, element.body.length - 1));
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
      context.fillText(item, x - 28, y + 14);
    });
    context.restore();
    return;
  }

  if (element.kind === "wireframe") {
    context.strokeRect(bounds.x + PAD, bounds.y + 44, bounds.width - PAD * 2, 28);
    context.strokeRect(
      bounds.x + PAD,
      bounds.y + 84,
      bounds.width * 0.48,
      bounds.height - 104,
    );
    context.strokeRect(
      bounds.x + bounds.width * 0.56,
      bounds.y + 84,
      bounds.width * 0.32,
      34,
    );
    context.strokeRect(
      bounds.x + bounds.width * 0.56,
      bounds.y + 132,
      bounds.width * 0.32,
      34,
    );
    context.restore();
    return;
  }

  if (element.kind === "cloud-service") {
    context.fillStyle = "rgb(59 130 246 / 18%)";
    context.beginPath();
    context.arc(bounds.x + 62, centerY, 34, Math.PI * 0.8, Math.PI * 1.95);
    context.arc(bounds.x + 103, centerY - 26, 40, Math.PI, Math.PI * 2);
    context.arc(bounds.x + 154, centerY, 35, Math.PI * 1.15, Math.PI * 0.25);
    context.closePath();
    context.fill();
    context.stroke();
  }

  if (element.kind === "smart-connector") {
    const startX = bounds.x + PAD + 8;
    const endX = bounds.x + bounds.width - PAD - 8;
    const y = centerY + 10;
    context.beginPath();
    context.moveTo(startX, y);
    context.bezierCurveTo(
      bounds.x + bounds.width * 0.35,
      bounds.y + 28,
      bounds.x + bounds.width * 0.65,
      bounds.y + bounds.height - 28,
      endX,
      y,
    );
    context.stroke();
    context.beginPath();
    context.arc(startX, y, 8, 0, Math.PI * 2);
    context.arc(endX, y, 8, 0, Math.PI * 2);
    context.fill();
    context.fillText(element.body[0] ?? "Source", bounds.x + PAD, bounds.y + 48);
    context.fillText(
      element.body[1] ?? "Target",
      bounds.x + bounds.width - 78,
      bounds.y + 48,
    );
    context.restore();
    return;
  }

  if (element.kind === "section-zone") {
    context.fillStyle = "rgb(59 130 246 / 10%)";
    context.fillRect(
      bounds.x + PAD,
      bounds.y + 42,
      bounds.width - PAD * 2,
      bounds.height - 54,
    );
    context.setLineDash([8, 6]);
    context.strokeRect(
      bounds.x + PAD,
      bounds.y + 42,
      bounds.width - PAD * 2,
      bounds.height - 54,
    );
    context.setLineDash([]);
    textLines(context, element.body, bounds.x + PAD * 2, bounds.y + 62, 20);
    context.restore();
    return;
  }

  if (element.kind === "erd-relationship") {
    const y = centerY + 10;
    context.beginPath();
    context.moveTo(bounds.x + 34, y);
    context.lineTo(bounds.x + bounds.width - 34, y);
    context.moveTo(bounds.x + 52, y - 18);
    context.lineTo(bounds.x + 52, y + 18);
    context.moveTo(bounds.x + bounds.width - 52, y);
    context.lineTo(bounds.x + bounds.width - 34, y - 16);
    context.moveTo(bounds.x + bounds.width - 52, y);
    context.lineTo(bounds.x + bounds.width - 34, y + 16);
    context.stroke();
    context.fillText(element.body[0] ?? "table.id", bounds.x + PAD, bounds.y + 48);
    context.fillText(
      element.body[1] ?? "other.table_id",
      bounds.x + bounds.width * 0.52,
      bounds.y + 48,
    );
    context.restore();
    return;
  }

  if (element.kind === "flow-step") {
    context.fillStyle = "rgb(96 165 250 / 18%)";
    drawRoundedRectPath(
      context,
      bounds.x + PAD,
      bounds.y + 44,
      54,
      bounds.height - 62,
      12,
    );
    context.fill();
    context.stroke();
    context.font = "800 22px Inter, ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillStyle = "#bfdbfe";
    context.fillText(element.title, bounds.x + PAD + 27, centerY - 11);
    context.textAlign = "left";
    context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
    textLines(context, element.body, bounds.x + 82, bounds.y + 52, 20);
    context.restore();
    return;
  }

  if (element.kind === "status-badge") {
    const badges = element.body.length ? element.body : ["Draft", "Done"];
    let x = bounds.x + PAD;
    badges.forEach((badge, index) => {
      const width = Math.min(82, Math.max(54, badge.length * 7 + 18));
      context.fillStyle =
        index === badges.length - 1
          ? "rgb(34 197 94 / 22%)"
          : "rgb(148 163 184 / 18%)";
      drawRoundedRectPath(context, x, centerY - 12, width, 26, 13);
      context.fill();
      context.stroke();
      context.fillStyle = "#dbeafe";
      context.fillText(badge, x + 9, centerY - 5);
      x += width + 8;
    });
    context.restore();
    return;
  }

  if (element.kind === "annotation-pin") {
    context.beginPath();
    context.arc(centerX, bounds.y + 58, 20, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(centerX, bounds.y + 78);
    context.lineTo(centerX - 12, bounds.y + 112);
    context.lineTo(centerX + 12, bounds.y + 112);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = "#0f172a";
    context.font = "800 16px Inter, ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("!", centerX, bounds.y + 50);
    context.fillStyle = "#dbeafe";
    context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
    context.fillText(
      element.body[0] ?? element.title,
      centerX,
      bounds.y + bounds.height - 30,
    );
    context.restore();
    return;
  }

  if (element.kind === "template-stamp") {
    context.setLineDash([7, 5]);
    context.strokeRect(
      bounds.x + PAD,
      bounds.y + 44,
      bounds.width - PAD * 2,
      bounds.height - 60,
    );
    context.setLineDash([]);
    context.font = "800 20px Inter, ui-sans-serif, system-ui, sans-serif";
    context.fillText("STAMP", bounds.x + PAD * 2, centerY - 10);
    context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
    textLines(context, element.body, bounds.x + PAD * 2, centerY + 16, 18);
    context.restore();
    return;
  }

  if (element.kind === "api-endpoint") {
    const method = element.title.split(" ")[0] || "GET";
    const path = element.title.slice(method.length).trim() || "/api/items";
    context.fillStyle = "rgb(34 197 94 / 22%)";
    drawRoundedRectPath(context, bounds.x + PAD, bounds.y + 48, 58, 28, 8);
    context.fill();
    context.stroke();
    context.fillStyle = "#dbeafe";
    context.font = "800 12px Inter, ui-sans-serif, system-ui, sans-serif";
    context.fillText(method, bounds.x + PAD + 12, bounds.y + 56);
    context.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(path, bounds.x + 84, bounds.y + 56);
    textLines(context, element.body, bounds.x + PAD, bounds.y + 94, 18);
    context.restore();
    return;
  }

  if (element.kind === "database-cylinder") {
    const topY = bounds.y + 52;
    const bottomY = bounds.y + bounds.height - 28;
    context.beginPath();
    context.ellipse(centerX, topY, bounds.width * 0.32, 18, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - bounds.width * 0.32, topY);
    context.lineTo(centerX - bounds.width * 0.32, bottomY);
    context.ellipse(
      centerX,
      bottomY,
      bounds.width * 0.32,
      18,
      0,
      Math.PI,
      0,
      true,
    );
    context.lineTo(centerX + bounds.width * 0.32, topY);
    context.stroke();
    context.textAlign = "center";
    context.fillText(element.title, centerX, topY + 34);
    textLines(
      context,
      element.body,
      centerX - bounds.width * 0.22,
      topY + 58,
      17,
    );
    context.restore();
    return;
  }

  if (element.kind === "org-card") {
    context.beginPath();
    context.arc(bounds.x + 42, bounds.y + 70, 22, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#0f172a";
    context.textAlign = "center";
    context.font = "800 16px Inter, ui-sans-serif, system-ui, sans-serif";
    context.fillText(
      (element.title[0] ?? "T").toUpperCase(),
      bounds.x + 42,
      bounds.y + 62,
    );
    context.fillStyle = "#dbeafe";
    context.textAlign = "left";
    context.font = "700 14px Inter, ui-sans-serif, system-ui, sans-serif";
    context.fillText(element.title, bounds.x + 76, bounds.y + 55);
    context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
    textLines(context, element.body, bounds.x + 76, bounds.y + 80, 18);
    context.restore();
    return;
  }

  textLines(context, element.body, bounds.x + PAD, bounds.y + 48);
  context.restore();
}

