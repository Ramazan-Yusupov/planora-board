import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneState } from "../model/types";
import { getSceneValidationIssues, validateScene } from "./validateScene";

const MAX_ARROW_WAYPOINTS = 10;

function parseScene(source: string) {
  const parsed: unknown = JSON.parse(source);

  if (!validateScene(parsed)) {
    const [firstIssue] = getSceneValidationIssues(parsed);
    throw new Error(firstIssue ?? "Файл не похож на сцену DrawTool.");
  }

  return parsed;
}

function deserializeElements(source: string): BoardElement[] {
  const parsed = parseScene(source);

  return parsed.elements.map((element) => ({
    ...element,
    angle:
      element.type === "arrow"
        ? 0
        : typeof element.angle === "number"
          ? element.angle
          : 0,
    ...(element.type === "arrow"
      ? {
          routing:
            element.routing === "straight" || element.routing === "curve"
              ? element.routing
              : "elbow",
          routeCornerStyle:
            element.routeCornerStyle === "rounded" ? "rounded" : "sharp",
          elbowAxis: element.elbowAxis ?? "horizontal",
          elbowOffset:
            typeof element.elbowOffset === "number" ? element.elbowOffset : 0.5,
          curveOffset:
            typeof element.curveOffset === "number" ? element.curveOffset : 0.22,
          waypoints:
            element.routing === "straight" && Array.isArray(element.waypoints)
              ? element.waypoints.slice(0, MAX_ARROW_WAYPOINTS)
              : undefined,
          waypointBindings:
            element.routing === "straight" &&
            Array.isArray(element.waypoints) &&
            Array.isArray(element.waypointBindings)
              ? element.waypointBindings
                  .slice(
                    0,
                    Math.min(element.waypoints.length, MAX_ARROW_WAYPOINTS),
                  )
                  .map((binding) => binding ?? null)
              : undefined,
        }
      : {}),
    ...(element.type === "markdown"
      ? {
          title: typeof element.title === "string" ? element.title : "Markdown note",
          content: typeof element.content === "string" ? element.content : "",
          fontSize: typeof element.fontSize === "number" ? element.fontSize : 15,
        }
      : {}),
    ...(element.type === "table"
      ? {
          fontSize: typeof element.fontSize === "number" ? element.fontSize : 14,
        }
      : {}),
    ...(element.type === "code" && !("kind" in element)
      ? {
          title: typeof element.title === "string" ? element.title : "Code sketch",
          code:
            typeof element.code === "string"
              ? element.code
              : "function component() {\n  return <main />;\n}",
          language: typeof element.language === "string" ? element.language : "tsx",
        }
      : {}),
    ...(element.type === "image"
      ? {
          cornerRadius:
            typeof element.cornerRadius === "number" ? element.cornerRadius : 0,
          objectFit:
            element.objectFit === "contain" ||
            element.objectFit === "cover" ||
            element.objectFit === "scale-down" ||
            element.objectFit === "none"
              ? element.objectFit
              : "fill",
          objectPosition:
            element.objectPosition === "top" ||
            element.objectPosition === "bottom" ||
            element.objectPosition === "left" ||
            element.objectPosition === "right"
              ? element.objectPosition
              : "center",
          shape: element.shape === "circle" ? "circle" : "rectangle",
        }
      : {}),
    style: { ...element.style },
  }));
}

/** Parses a DrawTool JSON scene and applies safe defaults for older scenes. */
export function deserializeScene(source: string): BoardElement[] {
  return deserializeElements(source);
}

export function deserializeSceneState(
  source: string,
): Omit<SceneState, "version"> {
  const parsed = parseScene(source);

  return {
    activeLayerId: parsed.activeLayerId ?? "",
    elements: deserializeElements(source),
    layers: parsed.layers ?? [],
  };
}

