import type { Point } from "@/modules/draw-tool/shared/types";

export type ElementType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "hexagon"
  | "badge"
  | "star"
  | "cloud"
  | "line"
  | "arrow"
  | "freedraw"
  | "highlighter"
  | "text"
  | "sticky"
  | "callout"
  | "measure"
  | "table"
  | "frame"
  | "embed"
  | "markdown"
  | "code"
  | "image";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FillStyle = "transparent" | "solid";
export type CornerStyle = "sharp" | "rounded";
export type ArrowCornerStyle = "sharp" | "rounded";
export type ArrowRouting = "straight" | "elbow" | "curve";
export type ElbowAxis = "horizontal" | "vertical";
export type ImageObjectFit = "fill" | "contain" | "cover" | "scale-down" | "none";
export type ImageObjectPosition = "center" | "top" | "bottom" | "left" | "right";
export type ImageShape = "rectangle" | "circle";
export type TextAlign = "left" | "center" | "right";

export type ElementStyle = {
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  fillStyle: FillStyle;
  cornerStyle: CornerStyle;
  opacity: number;
};

/** Connection metadata for an endpoint attached to another board element. */
export type ElementBinding = {
  elementId: string;
  /**
   * Angle of the attached anchor around the target centre. Existing scenes
   * may safely omit the fixed-anchor flag and keep the previous auto mode.
   */
  focus: number;
  /** New bindings retain the exact side of the target selected by the user. */
  anchor?: "auto" | "fixed";
};

export type BaseElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in radians. It may exceed 2π while the user keeps rotating. */
  angle: number;
  /** Optional containing Frame. Frame children move and resize with their parent. */
  parentId?: string;
  /** Optional external link opened with Ctrl/Cmd + click while using selection. */
  link?: string;
  /** Optional user-facing label rendered on top of simple shapes and arrows. */
  label?: string;
  /** Optional grouping token. Elements with the same group move/select together. */
  groupId?: string;
  /** Optional visual layer. Missing values are normalized to the default layer. */
  layerId?: string;
  /** Lightweight user metadata for search, filtering and workflows. */
  metadata?: Record<string, string>;
  /** User-facing tags used by search and future filters. */
  tags?: string[];
  /** Locked elements stay visible but cannot be selected or changed accidentally. */
  locked?: boolean;
  createdAt: number;
  updatedAt: number;
  style: ElementStyle;
};

export type RectangleElement = BaseElement & { type: "rectangle" };
export type EllipseElement = BaseElement & { type: "ellipse" };
export type DiamondElement = BaseElement & { type: "diamond" };
export type TriangleElement = BaseElement & { type: "triangle" };
export type HexagonElement = BaseElement & { type: "hexagon" };
export type BadgeElement = BaseElement & { type: "badge" };
export type StarElement = BaseElement & { type: "star" };
export type CloudElement = BaseElement & { type: "cloud" };
export type LineElement = BaseElement & { type: "line" };

export type ArrowElement = BaseElement & {
  type: "arrow";
  routing: ArrowRouting;
  routeCornerStyle: ArrowCornerStyle;
  elbowAxis: ElbowAxis;
  elbowOffset: number;
  /** Signed normal offset for the smooth quadratic Bézier route. */
  curveOffset: number;
  startBinding?: ElementBinding;
  endBinding?: ElementBinding;
  /** Editable absolute route points between start and end. */
  waypoints?: Point[];
  /** Optional bindings for each waypoint. Null keeps array indexes aligned. */
  waypointBindings?: Array<ElementBinding | null>;
};

export type FreeDrawElement = BaseElement & {
  type: "freedraw";
  points: Point[];
};

/** Wide semi-transparent freehand stroke. */
export type HighlighterElement = BaseElement & {
  type: "highlighter";
  points: Point[];
};

export type FrameElement = BaseElement & {
  type: "frame";
  name: string;
};

export type EmbedElement = BaseElement & {
  type: "embed";
  title?: string;
  url: string;
};

export type MarkdownElement = BaseElement & {
  type: "markdown";
  title: string;
  content: string;
  fontSize: number;
};

export type AdvancedElementKind =
  | "swimlane"
  | "bpmn-task"
  | "bpmn-event"
  | "bpmn-gateway"
  | "uml-class"
  | "uml-actor"
  | "erd-table"
  | "kanban-board"
  | "timeline"
  | "mindmap-node"
  | "cloud-service"
  | "wireframe"
  | "smart-connector"
  | "section-zone"
  | "erd-relationship"
  | "flow-step"
  | "status-badge"
  | "annotation-pin"
  | "template-stamp"
  | "api-endpoint"
  | "database-cylinder"
  | "org-card";

export type AdvancedElement = BaseElement & {
  type: "code";
  kind: AdvancedElementKind;
  title: string;
  body: string[];
};

/** A self-contained, resizable code card. Its title and source stay inside the card. */
export type CodeSketchElement = BaseElement & {
  type: "code";
  title: string;
  code: string;
  language: string;
};

/** A portable image. The data URL keeps the asset available after save/export/import. */
export type ImageElement = BaseElement & {
  type: "image";
  fileId: string;
  cornerRadius: number;
  objectFit: ImageObjectFit;
  objectPosition: ImageObjectPosition;
  shape: ImageShape;
  src: string;
  name: string;
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
};

export type TextElement = BaseElement & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
};

/** Sticky note with independently editable text and a folded corner. */
export type StickyElement = BaseElement & {
  type: "sticky";
  text: string;
  fontSize: number;
  fontFamily: string;
};

/** Review comment card. targetPoint is synchronized from targetId when attached. */
export type CalloutElement = BaseElement & {
  type: "callout";
  text: string;
  fontSize: number;
  fontFamily: string;
  targetId?: string;
  targetPoint?: Point;
};

/** A line that permanently displays distance, dimensions and angle. */
export type MeasureElement = BaseElement & { type: "measure" };

/** Lightweight table with a grid and serialized cell values. */
export type TableElement = BaseElement & {
  type: "table";
  rows: number;
  columns: number;
  cells: string[];
  fontSize: number;
};


export type BoardElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | TriangleElement
  | HexagonElement
  | BadgeElement
  | StarElement
  | CloudElement
  | LineElement
  | ArrowElement
  | FreeDrawElement
  | HighlighterElement
  | TextElement
  | StickyElement
  | CalloutElement
  | MeasureElement
  | TableElement
  | FrameElement
  | EmbedElement
  | MarkdownElement
  | AdvancedElement
  | CodeSketchElement
  | ImageElement;

export type ElementEndpoints = {
  start: Point;
  end: Point;
};

