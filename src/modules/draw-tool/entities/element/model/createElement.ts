import { createId } from "@/modules/draw-tool/shared/lib";
import { ADVANCED_DEFAULTS } from "./advancedDefaults";
import { DEFAULT_ELEMENT_STYLE } from "./constants";
import type {
  ArrowElement,
  ArrowCornerStyle,
  ArrowRouting,
  AdvancedElement,
  AdvancedElementKind,
  BadgeElement,
  BoardElement,
  CalloutElement,
  CloudElement,
  CodeSketchElement,
  DiamondElement,
  ElementStyle,
  ElementType,
  EllipseElement,
  EmbedElement,
  FrameElement,
  FreeDrawElement,
  HexagonElement,
  HighlighterElement,
  ImageElement,
  ImageObjectFit,
  ImageObjectPosition,
  ImageShape,
  LineElement,
  MarkdownElement,
  MeasureElement,
  RectangleElement,
  StarElement,
  StickyElement,
  TableElement,
  TextAlign,
  TextElement,
  TriangleElement,
} from "./types";
import type { Point } from "@/modules/draw-tool/shared/types";

type BaseCreateParams = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  style?: Partial<ElementStyle>;
};

type TextCreateParams = BaseCreateParams & {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: TextAlign;
};

type ArrowCreateParams = BaseCreateParams & {
  routing?: ArrowRouting;
  routeCornerStyle?: ArrowCornerStyle;
};

type FreeDrawCreateParams = BaseCreateParams & {
  points?: Point[];
};

type ImageCreateParams = BaseCreateParams & {
  fileId: string;
  cornerRadius?: number;
  objectFit?: ImageObjectFit;
  objectPosition?: ImageObjectPosition;
  shape?: ImageShape;
  src: string;
  name?: string;
  mimeType?: string;
  originalWidth: number;
  originalHeight: number;
};

type AdvancedCreateParams = BaseCreateParams & {
  kind?: AdvancedElementKind;
  title?: string;
  body?: string[];
};

function createBase<T extends BoardElement>(
  type: T["type"],
  params: BaseCreateParams,
): Omit<T, "type"> & { type: T["type"] } {
  const now = Date.now();

  return {
    id: createId(type),
    type,
    x: params.x,
    y: params.y,
    width: params.width ?? 0,
    height: params.height ?? 0,
    angle: 0,
    createdAt: now,
    updatedAt: now,
    style: {
      ...DEFAULT_ELEMENT_STYLE,
      ...params.style,
    },
  } as Omit<T, "type"> & { type: T["type"] };
}

export function createRectangle(params: BaseCreateParams): RectangleElement {
  return createBase<RectangleElement>("rectangle", params);
}
export function createEllipse(params: BaseCreateParams): EllipseElement {
  return createBase<EllipseElement>("ellipse", params);
}
export function createDiamond(params: BaseCreateParams): DiamondElement {
  return createBase<DiamondElement>("diamond", params);
}
export function createTriangle(params: BaseCreateParams): TriangleElement {
  return createBase<TriangleElement>("triangle", params);
}
export function createHexagon(params: BaseCreateParams): HexagonElement {
  return createBase<HexagonElement>("hexagon", params);
}
export function createBadge(params: BaseCreateParams): BadgeElement {
  return {
    ...createBase<BadgeElement>("badge", {
      ...params,
      width: params.width ?? 240,
      height: params.height ?? 96,
      style: {
        strokeColor: "#9333ea",
        backgroundColor: "#f3e8ff",
        fillStyle: "transparent",
        cornerStyle: "rounded",
        strokeWidth: 5,
        ...params.style,
      },
    }),
    label: "Badge",
  };
}
export function createStar(params: BaseCreateParams): StarElement {
  return createBase<StarElement>("star", params);
}
export function createCloud(params: BaseCreateParams): CloudElement {
  return createBase<CloudElement>("cloud", params);
}
export function createLine(params: BaseCreateParams): LineElement {
  return createBase<LineElement>("line", params);
}

export function createArrow(params: ArrowCreateParams): ArrowElement {
  return {
    ...createBase<ArrowElement>("arrow", params),
    routing: params.routing ?? "straight",
    routeCornerStyle: params.routeCornerStyle ?? "sharp",
    elbowAxis: "horizontal",
    elbowOffset: 0.5,
    curveOffset: 0.22,
  };
}

export function createMeasure(params: BaseCreateParams): MeasureElement {
  return createBase<MeasureElement>("measure", {
    ...params,
    style: {
      strokeColor: "#38bdf8",
      ...params.style,
      fillStyle: "transparent",
    },
  });
}

export function createFrame(params: BaseCreateParams & { name?: string }): FrameElement {
  return { ...createBase<FrameElement>("frame", params), name: params.name ?? "Frame" };
}
export function createEmbed(params: BaseCreateParams & { title?: string; url?: string }): EmbedElement {
  return {
    ...createBase<EmbedElement>("embed", params),
    title: params.title ?? "Встроенная страница",
    url: params.url ?? "https://example.com",
  };
}

export function createMarkdown(params: BaseCreateParams & { title?: string; content?: string; fontSize?: number }): MarkdownElement {
  return {
    ...createBase<MarkdownElement>("markdown", {
      ...params,
      width: params.width ?? 320,
      height: params.height ?? 220,
      style: {
        strokeColor: "#cbd5e1",
        backgroundColor: "#0f172a",
        fillStyle: "solid",
        cornerStyle: "rounded",
        ...params.style,
      },
    }),
    title: params.title ?? "Markdown note",
    content: params.content ?? "## Заметка\n- идея\n- действие\n\n`code` и ссылки рядом с диаграммой",
    fontSize: params.fontSize ?? 15,
  };
}

export function createAdvanced(params: AdvancedCreateParams): AdvancedElement {
  const kind = params.kind ?? "swimlane";
  const defaults = ADVANCED_DEFAULTS[kind];
  return {
    ...createBase<AdvancedElement>("code", {
      ...params,
      width: params.width ?? defaults.width,
      height: params.height ?? defaults.height,
      style: {
        strokeColor: "#93c5fd",
        backgroundColor: "#0f172a",
        fillStyle: "solid",
        cornerStyle: "rounded",
        ...params.style,
      },
    }),
    kind,
    title: params.title ?? defaults.title,
    body: params.body ?? defaults.body,
  };
}

export function createCodeSketch(params: BaseCreateParams & { title?: string; code?: string; language?: string }): CodeSketchElement {
  return {
    ...createBase<CodeSketchElement>("code", params),
    title: params.title ?? "Code sketch",
    code: params.code ?? "function component() {\n  return <main />;\n}",
    language: params.language ?? "tsx",
  };
}

export function createFreeDraw(params: FreeDrawCreateParams): FreeDrawElement {
  return { ...createBase<FreeDrawElement>("freedraw", params), points: params.points ?? [] };
}

export function createHighlighter(params: FreeDrawCreateParams): HighlighterElement {
  return {
    ...createBase<HighlighterElement>("highlighter", {
      ...params,
      style: {
        strokeColor: "#facc15",
        ...params.style,
        strokeWidth: Math.max(params.style?.strokeWidth ?? 16, 8),
        opacity: Math.min(params.style?.opacity ?? 0.38, 0.58),
      },
    }),
    points: params.points ?? [],
  };
}

export function createImage(params: ImageCreateParams): ImageElement {
  return {
    ...createBase<ImageElement>("image", params),
    fileId: params.fileId,
    cornerRadius: params.cornerRadius ?? 0,
    objectFit: params.objectFit ?? "fill",
    objectPosition: params.objectPosition ?? "center",
    shape: params.shape ?? "rectangle",
    src: params.src,
    name: params.name ?? "image",
    mimeType: params.mimeType ?? "image/*",
    originalWidth: params.originalWidth,
    originalHeight: params.originalHeight,
  };
}

export function createText(params: TextCreateParams): TextElement {
  return {
    ...createBase<TextElement>("text", params),
    text: params.text ?? "",
    fontSize: params.fontSize ?? 24,
    fontFamily: params.fontFamily ?? '"Segoe Print", "Comic Sans MS", cursive',
    textAlign: params.textAlign ?? "left",
  };
}

export function createSticky(params: TextCreateParams): StickyElement {
  return {
    ...createBase<StickyElement>("sticky", {
      ...params,
      style: {
        strokeColor: "#a16207",
        backgroundColor: "#fde68a",
        fillStyle: "solid",
        cornerStyle: "rounded",
        ...params.style,
      },
    }),
    text: params.text ?? "Заметка",
    fontSize: params.fontSize ?? 18,
    fontFamily: params.fontFamily ?? 'Inter, "Segoe UI", sans-serif',
  };
}

export function createCallout(params: TextCreateParams & { targetId?: string; targetPoint?: Point }): CalloutElement {
  return {
    ...createBase<CalloutElement>("callout", {
      ...params,
      style: {
        strokeColor: "#60a5fa",
        backgroundColor: "#172554",
        fillStyle: "solid",
        cornerStyle: "rounded",
        ...params.style,
      },
    }),
    text: params.text ?? "Комментарий",
    fontSize: params.fontSize ?? 16,
    fontFamily: params.fontFamily ?? 'Inter, "Segoe UI", sans-serif',
    targetId: params.targetId,
    targetPoint: params.targetPoint,
  };
}

export function createTable(params: BaseCreateParams & { rows?: number; columns?: number; cells?: string[]; fontSize?: number }): TableElement {
  const rows = Math.max(1, Math.round(params.rows ?? 3));
  const columns = Math.max(1, Math.round(params.columns ?? 3));
  const cells = Array.from({ length: rows * columns }, (_, index) => params.cells?.[index] ?? (index < columns ? `Заголовок ${index + 1}` : ""));
  return {
    ...createBase<TableElement>("table", {
      ...params,
      style: {
        strokeColor: "#64748b",
        backgroundColor: "#0f172a",
        fillStyle: "solid",
        cornerStyle: "rounded",
        ...params.style,
      },
    }),
    rows,
    columns,
    cells,
    fontSize: params.fontSize ?? 14,
  };
}


export function createElement(
  type: Exclude<ElementType, "image"> | "advanced",
  params: BaseCreateParams &
    TextCreateParams &
    ArrowCreateParams &
    FreeDrawCreateParams &
    AdvancedCreateParams & {
      content?: string;
      language?: string;
      rows?: number;
      columns?: number;
      cells?: string[];
      title?: string;
    },
): BoardElement {
  switch (type) {
    case "rectangle": return createRectangle(params);
    case "ellipse": return createEllipse(params);
    case "diamond": return createDiamond(params);
    case "triangle": return createTriangle(params);
    case "hexagon": return createHexagon(params);
    case "badge": return createBadge(params);
    case "star": return createStar(params);
    case "cloud": return createCloud(params);
    case "line": return createLine(params);
    case "arrow": return createArrow(params);
    case "measure": return createMeasure(params);
    case "frame": return createFrame(params);
    case "embed": return createEmbed(params);
    case "markdown": return createMarkdown(params);
    case "advanced": return createAdvanced(params);
    case "code": return createCodeSketch(params);
    case "freedraw": return createFreeDraw(params);
    case "highlighter": return createHighlighter(params);
    case "text": return createText(params);
    case "sticky": return createSticky(params);
    case "callout": return createCallout(params);
    case "table": return createTable(params);
  }
}

