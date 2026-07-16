import type { SceneFile } from "./serializeScene";

const ELEMENT_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "triangle",
  "hexagon",
  "badge",
  "star",
  "cloud",
  "line",
  "arrow",
  "freedraw",
  "highlighter",
  "text",
  "sticky",
  "callout",
  "measure",
  "table",
  "frame",
  "embed",
  "markdown",
  "code",
  "image",
]);

const ADVANCED_KINDS = new Set([
  "swimlane",
  "bpmn-task",
  "bpmn-event",
  "bpmn-gateway",
  "uml-class",
  "uml-actor",
  "erd-table",
  "kanban-board",
  "timeline",
  "mindmap-node",
  "cloud-service",
  "wireframe",
  "smart-connector",
  "section-zone",
  "erd-relationship",
  "flow-step",
  "status-badge",
  "annotation-pin",
  "template-stamp",
  "api-endpoint",
  "database-cylinder",
  "org-card",
]);

const MAX_ELEMENTS = 5000;
const MAX_POINTS = 5000;
const MAX_WAYPOINTS = 64;
const MAX_CELLS = 2500;
const MAX_DATA_URL_LENGTH = 8_000_000;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown) {
  return value === undefined || isFiniteNumber(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y)
  );
}

function isPointArray(
  value: unknown,
  maxLength: number,
): value is Array<{ x: number; y: number }> {
  return (
    Array.isArray(value) &&
    value.length <= maxLength &&
    value.every(isPoint)
  );
}

function isMetadata(value: unknown) {
  return (
    value === undefined ||
    (isRecord(value) &&
      Object.values(value).every((item) => typeof item === "string"))
  );
}

function isElementBinding(value: unknown): value is {
  elementId: string;
  focus: number;
  anchor?: "auto" | "fixed";
} {
  return (
    isRecord(value) &&
    typeof value.elementId === "string" &&
    isFiniteNumber(value.focus) &&
    (value.anchor === undefined ||
      value.anchor === "auto" ||
      value.anchor === "fixed")
  );
}

function isStyle(value: unknown) {
  if (!isRecord(value)) return false;
  const opacity = value.opacity;

  return (
    (value.strokeColor === undefined || typeof value.strokeColor === "string") &&
    (value.backgroundColor === undefined ||
      typeof value.backgroundColor === "string") &&
    (value.strokeWidth === undefined || isFiniteNumber(value.strokeWidth)) &&
    (value.strokeStyle === undefined ||
      value.strokeStyle === "solid" ||
      value.strokeStyle === "dashed" ||
      value.strokeStyle === "dotted") &&
    (value.fillStyle === undefined ||
      value.fillStyle === "transparent" ||
      value.fillStyle === "solid") &&
    (value.cornerStyle === undefined ||
      value.cornerStyle === "sharp" ||
      value.cornerStyle === "rounded") &&
    (opacity === undefined ||
      (isFiniteNumber(opacity) && opacity >= 0 && opacity <= 1))
  );
}

function validateBaseElement(element: JsonRecord, index: number) {
  const issues: string[] = [];
  const path = `elements[${index}]`;

  if (typeof element.id !== "string" || element.id.trim() === "") {
    issues.push(`${path}.id должен быть непустой строкой.`);
  }
  if (typeof element.type !== "string" || !ELEMENT_TYPES.has(element.type)) {
    issues.push(`${path}.type содержит неизвестный тип элемента.`);
  }
  for (const field of ["x", "y", "width", "height"]) {
    if (!isFiniteNumber(element[field])) {
      issues.push(`${path}.${field} должен быть конечным числом.`);
    }
  }
  if (!isOptionalFiniteNumber(element.angle)) {
    issues.push(`${path}.angle должен быть конечным числом.`);
  }
  if (!isStyle(element.style)) {
    issues.push(`${path}.style имеет неверный формат.`);
  }
  if (element.parentId !== undefined && typeof element.parentId !== "string") {
    issues.push(`${path}.parentId должен быть строкой.`);
  }
  if (element.groupId !== undefined && typeof element.groupId !== "string") {
    issues.push(`${path}.groupId должен быть строкой.`);
  }
  if (element.layerId !== undefined && typeof element.layerId !== "string") {
    issues.push(`${path}.layerId должен быть строкой.`);
  }
  if (element.link !== undefined && typeof element.link !== "string") {
    issues.push(`${path}.link должен быть строкой.`);
  }
  if (element.label !== undefined && typeof element.label !== "string") {
    issues.push(`${path}.label должен быть строкой.`);
  }
  if (element.locked !== undefined && typeof element.locked !== "boolean") {
    issues.push(`${path}.locked должен быть boolean.`);
  }
  if (element.tags !== undefined && !isStringArray(element.tags)) {
    issues.push(`${path}.tags должен быть массивом строк.`);
  }
  if (!isMetadata(element.metadata)) {
    issues.push(`${path}.metadata должен быть объектом строковых значений.`);
  }
  if (!isOptionalFiniteNumber(element.createdAt)) {
    issues.push(`${path}.createdAt должен быть конечным числом.`);
  }
  if (!isOptionalFiniteNumber(element.updatedAt)) {
    issues.push(`${path}.updatedAt должен быть конечным числом.`);
  }

  return issues;
}

function validateTypedElement(element: JsonRecord, index: number) {
  const issues: string[] = [];
  const path = `elements[${index}]`;

  switch (element.type) {
    case "arrow":
      if (
        element.routing !== undefined &&
        element.routing !== "straight" &&
        element.routing !== "elbow" &&
        element.routing !== "curve"
      ) {
        issues.push(`${path}.routing содержит неизвестный тип маршрута.`);
      }
      if (
        element.routeCornerStyle !== undefined &&
        element.routeCornerStyle !== "sharp" &&
        element.routeCornerStyle !== "rounded"
      ) {
        issues.push(`${path}.routeCornerStyle имеет неверное значение.`);
      }
      if (
        element.elbowAxis !== undefined &&
        element.elbowAxis !== "horizontal" &&
        element.elbowAxis !== "vertical"
      ) {
        issues.push(`${path}.elbowAxis имеет неверное значение.`);
      }
      if (!isOptionalFiniteNumber(element.elbowOffset)) {
        issues.push(`${path}.elbowOffset должен быть конечным числом.`);
      }
      if (!isOptionalFiniteNumber(element.curveOffset)) {
        issues.push(`${path}.curveOffset должен быть конечным числом.`);
      }
      if (element.startBinding !== undefined && !isElementBinding(element.startBinding)) {
        issues.push(`${path}.startBinding имеет неверный формат.`);
      }
      if (element.endBinding !== undefined && !isElementBinding(element.endBinding)) {
        issues.push(`${path}.endBinding имеет неверный формат.`);
      }
      if (element.waypoints !== undefined && !isPointArray(element.waypoints, MAX_WAYPOINTS)) {
        issues.push(`${path}.waypoints должен быть массивом точек.`);
      }
      if (
        element.waypointBindings !== undefined &&
        (!Array.isArray(element.waypointBindings) ||
          element.waypointBindings.length > MAX_WAYPOINTS ||
          !element.waypointBindings.every(
            (binding) => binding === null || isElementBinding(binding),
          ))
      ) {
        issues.push(`${path}.waypointBindings имеет неверный формат.`);
      }
      break;
    case "freedraw":
    case "highlighter":
      if (!isPointArray(element.points, MAX_POINTS)) {
        issues.push(`${path}.points должен быть массивом точек.`);
      }
      break;
    case "text":
      if (typeof element.text !== "string") {
        issues.push(`${path}.text должен быть строкой.`);
      }
      if (!isOptionalFiniteNumber(element.fontSize)) {
        issues.push(`${path}.fontSize должен быть конечным числом.`);
      }
      if (element.fontFamily !== undefined && typeof element.fontFamily !== "string") {
        issues.push(`${path}.fontFamily должен быть строкой.`);
      }
      if (
        element.textAlign !== undefined &&
        element.textAlign !== "left" &&
        element.textAlign !== "center" &&
        element.textAlign !== "right"
      ) {
        issues.push(`${path}.textAlign имеет неверное значение.`);
      }
      break;
    case "sticky":
    case "callout":
      if (typeof element.text !== "string") {
        issues.push(`${path}.text должен быть строкой.`);
      }
      if (!isOptionalFiniteNumber(element.fontSize)) {
        issues.push(`${path}.fontSize должен быть конечным числом.`);
      }
      if (element.fontFamily !== undefined && typeof element.fontFamily !== "string") {
        issues.push(`${path}.fontFamily должен быть строкой.`);
      }
      if (element.type === "callout" && element.targetPoint !== undefined && !isPoint(element.targetPoint)) {
        issues.push(`${path}.targetPoint должен быть точкой.`);
      }
      if (element.type === "callout" && element.targetId !== undefined && typeof element.targetId !== "string") {
        issues.push(`${path}.targetId должен быть строкой.`);
      }
      break;
    case "table":
      if (
        !isFiniteNumber(element.rows) ||
        !Number.isInteger(element.rows) ||
        element.rows < 1
      ) {
        issues.push(`${path}.rows должен быть положительным числом.`);
      }
      if (
        !isFiniteNumber(element.columns) ||
        !Number.isInteger(element.columns) ||
        element.columns < 1
      ) {
        issues.push(`${path}.columns должен быть положительным числом.`);
      }
      if (!Array.isArray(element.cells) || !element.cells.every((cell) => typeof cell === "string")) {
        issues.push(`${path}.cells должен быть массивом строк.`);
      } else if (element.cells.length > MAX_CELLS) {
        issues.push(`${path}.cells слишком большой для безопасного импорта.`);
      }
      if (!isOptionalFiniteNumber(element.fontSize)) {
        issues.push(`${path}.fontSize должен быть конечным числом.`);
      }
      break;
    case "frame":
      if (typeof element.name !== "string") {
        issues.push(`${path}.name должен быть строкой.`);
      }
      break;
    case "embed":
      if (typeof element.url !== "string") {
        issues.push(`${path}.url должен быть строкой.`);
      }
      if (element.title !== undefined && typeof element.title !== "string") {
        issues.push(`${path}.title должен быть строкой.`);
      }
      break;
    case "markdown":
      if (typeof element.title !== "string") {
        issues.push(`${path}.title должен быть строкой.`);
      }
      if (typeof element.content !== "string") {
        issues.push(`${path}.content должен быть строкой.`);
      }
      if (!isOptionalFiniteNumber(element.fontSize)) {
        issues.push(`${path}.fontSize должен быть конечным числом.`);
      }
      break;
    case "code":
      if (element.kind !== undefined) {
        if (typeof element.kind !== "string" || !ADVANCED_KINDS.has(element.kind)) {
          issues.push(`${path}.kind содержит неизвестный advanced shape.`);
        }
        if (typeof element.title !== "string") {
          issues.push(`${path}.title должен быть строкой.`);
        }
        if (!isStringArray(element.body)) {
          issues.push(`${path}.body должен быть массивом строк.`);
        }
      } else {
        if (typeof element.title !== "string") {
          issues.push(`${path}.title должен быть строкой.`);
        }
        if (typeof element.code !== "string") {
          issues.push(`${path}.code должен быть строкой.`);
        }
        if (typeof element.language !== "string") {
          issues.push(`${path}.language должен быть строкой.`);
        }
      }
      break;
    case "image":
      if (typeof element.fileId !== "string") {
        issues.push(`${path}.fileId должен быть строкой.`);
      }
      if (typeof element.src !== "string" || element.src.length > MAX_DATA_URL_LENGTH) {
        issues.push(`${path}.src имеет неверный или слишком большой формат.`);
      }
      if (typeof element.name !== "string") {
        issues.push(`${path}.name должен быть строкой.`);
      }
      if (typeof element.mimeType !== "string") {
        issues.push(`${path}.mimeType должен быть строкой.`);
      }
      if (!isOptionalFiniteNumber(element.cornerRadius)) {
        issues.push(`${path}.cornerRadius должен быть конечным числом.`);
      }
      if (!isOptionalFiniteNumber(element.originalWidth)) {
        issues.push(`${path}.originalWidth должен быть конечным числом.`);
      }
      if (!isOptionalFiniteNumber(element.originalHeight)) {
        issues.push(`${path}.originalHeight должен быть конечным числом.`);
      }
      if (
        element.objectFit !== undefined &&
        element.objectFit !== "fill" &&
        element.objectFit !== "contain" &&
        element.objectFit !== "cover" &&
        element.objectFit !== "scale-down" &&
        element.objectFit !== "none"
      ) {
        issues.push(`${path}.objectFit имеет неверное значение.`);
      }
      if (
        element.objectPosition !== undefined &&
        element.objectPosition !== "center" &&
        element.objectPosition !== "top" &&
        element.objectPosition !== "bottom" &&
        element.objectPosition !== "left" &&
        element.objectPosition !== "right"
      ) {
        issues.push(`${path}.objectPosition имеет неверное значение.`);
      }
      if (
        element.shape !== undefined &&
        element.shape !== "rectangle" &&
        element.shape !== "circle"
      ) {
        issues.push(`${path}.shape имеет неверное значение.`);
      }
      break;
  }

  return issues;
}

function validateLayer(layer: unknown, index: number) {
  const issues: string[] = [];
  const path = `layers[${index}]`;

  if (!isRecord(layer)) {
    return [`${path} должен быть объектом.`];
  }
  if (typeof layer.id !== "string" || layer.id.trim() === "") {
    issues.push(`${path}.id должен быть непустой строкой.`);
  }
  if (typeof layer.name !== "string" || layer.name.trim() === "") {
    issues.push(`${path}.name должен быть непустой строкой.`);
  }
  if (typeof layer.visible !== "boolean") {
    issues.push(`${path}.visible должен быть boolean.`);
  }
  if (typeof layer.locked !== "boolean") {
    issues.push(`${path}.locked должен быть boolean.`);
  }
  if (!isOptionalFiniteNumber(layer.createdAt)) {
    issues.push(`${path}.createdAt должен быть конечным числом.`);
  }
  if (!isOptionalFiniteNumber(layer.updatedAt)) {
    issues.push(`${path}.updatedAt должен быть конечным числом.`);
  }

  return issues;
}

export function getSceneValidationIssues(value: unknown) {
  const issues: string[] = [];

  if (!isRecord(value)) {
    return ["Файл сцены должен быть JSON-объектом."];
  }

  if (value.format !== "drawtool-scene") {
    issues.push("format должен быть drawtool-scene.");
  }
  if (value.version !== 1) {
    issues.push("version должен быть 1.");
  }
  if (value.savedAt !== undefined && typeof value.savedAt !== "string") {
    issues.push("savedAt должен быть строкой.");
  }
  if (value.activeLayerId !== undefined && typeof value.activeLayerId !== "string") {
    issues.push("activeLayerId должен быть строкой.");
  }
  if (value.layers !== undefined && !Array.isArray(value.layers)) {
    issues.push("layers должен быть массивом.");
  }
  if (Array.isArray(value.layers)) {
    const layerIds = new Set<string>();

    value.layers.forEach((layer, index) => {
      issues.push(...validateLayer(layer, index));
      if (isRecord(layer) && typeof layer.id === "string") {
        if (layerIds.has(layer.id)) {
          issues.push(`layers[${index}].id дублируется.`);
        }
        layerIds.add(layer.id);
      }
    });

    if (
      typeof value.activeLayerId === "string" &&
      value.activeLayerId &&
      !layerIds.has(value.activeLayerId)
    ) {
      issues.push("activeLayerId ссылается на отсутствующий слой.");
    }
  }
  if (!Array.isArray(value.elements)) {
    issues.push("elements должен быть массивом.");
    return issues;
  }
  if (value.elements.length > MAX_ELEMENTS) {
    issues.push("Сцена содержит слишком много элементов для безопасного импорта.");
  }

  const ids = new Set<string>();
  const parentIds = new Set<string>();
  const bindingIds = new Set<string>();
  const layerIds = new Set(
    Array.isArray(value.layers)
      ? value.layers
          .filter((layer): layer is JsonRecord => isRecord(layer))
          .map((layer) => layer.id)
          .filter((id): id is string => typeof id === "string")
      : [],
  );

  value.elements.forEach((item, index) => {
    if (!isRecord(item)) {
      issues.push(`elements[${index}] должен быть объектом.`);
      return;
    }

    issues.push(...validateBaseElement(item, index));
    issues.push(...validateTypedElement(item, index));

    if (typeof item.id === "string") {
      if (ids.has(item.id)) {
        issues.push(`elements[${index}].id дублируется.`);
      }
      ids.add(item.id);
    }
    if (typeof item.parentId === "string") parentIds.add(item.parentId);
    if (
      layerIds.size > 0 &&
      typeof item.layerId === "string" &&
      !layerIds.has(item.layerId)
    ) {
      issues.push(`elements[${index}].layerId ссылается на отсутствующий слой.`);
    }
    const startBinding = item.startBinding;
    const endBinding = item.endBinding;
    if (isElementBinding(startBinding)) bindingIds.add(startBinding.elementId);
    if (isElementBinding(endBinding)) bindingIds.add(endBinding.elementId);
    if (Array.isArray(item.waypointBindings)) {
      item.waypointBindings.forEach((binding) => {
        if (isElementBinding(binding)) bindingIds.add(binding.elementId);
      });
    }
  });

  parentIds.forEach((parentId) => {
    if (!ids.has(parentId)) {
      issues.push(`parentId "${parentId}" ссылается на отсутствующий элемент.`);
    }
  });
  bindingIds.forEach((elementId) => {
    if (!ids.has(elementId)) {
      issues.push(`binding "${elementId}" ссылается на отсутствующий элемент.`);
    }
  });

  return issues;
}

export function validateScene(value: unknown): value is SceneFile {
  return getSceneValidationIssues(value).length === 0;
}

