import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Braces,
  CalendarRange,
  Circle,
  Cloud,
  Columns2,
  Computer,
  CreditCard,
  Database,
  Diamond,
  DoorClosedLocked,
  GitBranch,
  LayoutTemplate,
  ListCollapse,
  Network,
  RectangleHorizontal,
  Server,
  SquareKanban,
  Table2,
  UserRound,
  Wallpaper,
  Webhook,
} from "lucide-react";
import type { AdvancedElementKind, BoardElement } from "@/modules/draw-tool/entities/element";

type ShapeLibraryBaseItem = {
  category: string;
  description: string;
  icon: LucideIcon;
  id: string;
  keywords: string[];
  title: string;
};

export type ShapeLibraryItem =
  | (ShapeLibraryBaseItem & {
      elementType: Exclude<BoardElement["type"], "image" | "code">;
      label?: string;
      kind?: never;
      titleOverride?: never;
      body?: never;
    })
  | (ShapeLibraryBaseItem & {
      elementType: "advanced";
      kind: AdvancedElementKind;
      titleOverride?: string;
      body?: string[];
      label?: never;
    });

export const SHAPE_LIBRARY_CATEGORIES = [
  "Flowchart",
  "Network / Cloud",
  "UML / BPMN",
  "ERD / Data",
  "Product / UI",
] as const;

export const SHAPE_LIBRARY_ITEMS: ShapeLibraryItem[] = [
  {
    id: "flow-process",
    category: "Flowchart",
    title: "Process",
    description: "Классический блок процесса для схем.",
    icon: RectangleHorizontal,
    elementType: "rectangle",
    label: "Process",
    keywords: ["process", "flow", "step", "rectangle"],
  },
  {
    id: "flow-decision",
    category: "Flowchart",
    title: "Decision",
    description: "Условие или развилка маршрута.",
    icon: Diamond,
    elementType: "diamond",
    label: "Decision",
    keywords: ["decision", "if", "gateway", "flow"],
  },
  {
    id: "flow-event",
    category: "Flowchart",
    title: "Start / End",
    description: "Начало или завершение процесса.",
    icon: Circle,
    elementType: "ellipse",
    label: "Start",
    keywords: ["start", "end", "terminator", "flow"],
  },
  {
    id: "flow-step-card",
    category: "Flowchart",
    title: "Numbered flow step",
    description: "Шаг процесса с номером и описанием.",
    icon: Columns2,
    elementType: "advanced",
    kind: "flow-step",
    keywords: ["step", "number", "process"],
  },
  {
    id: "cloud-service",
    category: "Network / Cloud",
    title: "Cloud service",
    description: "Сервис, API, очередь или cloud boundary.",
    icon: Cloud,
    elementType: "advanced",
    kind: "cloud-service",
    keywords: ["cloud", "service", "aws", "network"],
  },
  {
    id: "database",
    category: "Network / Cloud",
    title: "Database",
    description: "База данных или storage node.",
    icon: Database,
    elementType: "advanced",
    kind: "database-cylinder",
    keywords: ["database", "storage", "sql", "data"],
  },
  {
    id: "api-endpoint",
    category: "Network / Cloud",
    title: "API endpoint",
    description: "HTTP endpoint с request/response зонами.",
    icon: Webhook,
    elementType: "advanced",
    kind: "api-endpoint",
    keywords: ["api", "http", "endpoint", "backend"],
  },
  {
    id: "server-node",
    category: "Network / Cloud",
    title: "Server node",
    description: "Инфраструктурный сервер или worker.",
    icon: Server,
    elementType: "rectangle",
    label: "Server",
    keywords: ["server", "node", "worker", "infra"],
  },
  {
    id: "uml-class",
    category: "UML / BPMN",
    title: "UML class",
    description: "Класс с полями и методами.",
    icon: Braces,
    elementType: "advanced",
    kind: "uml-class",
    keywords: ["uml", "class", "object"],
  },
  {
    id: "uml-actor",
    category: "UML / BPMN",
    title: "UML actor",
    description: "Пользователь или внешняя система.",
    icon: UserRound,
    elementType: "advanced",
    kind: "uml-actor",
    keywords: ["uml", "actor", "user"],
  },
  {
    id: "bpmn-task",
    category: "UML / BPMN",
    title: "BPMN task",
    description: "Задача BPMN-процесса.",
    icon: Computer,
    elementType: "advanced",
    kind: "bpmn-task",
    keywords: ["bpmn", "task", "workflow"],
  },
  {
    id: "bpmn-gateway",
    category: "UML / BPMN",
    title: "BPMN gateway",
    description: "BPMN-развилка маршрута.",
    icon: DoorClosedLocked,
    elementType: "advanced",
    kind: "bpmn-gateway",
    keywords: ["bpmn", "gateway", "decision"],
  },
  {
    id: "bpmn-event",
    category: "UML / BPMN",
    title: "BPMN event",
    description: "Событие начала, конца или промежуточный event.",
    icon: CalendarRange,
    elementType: "advanced",
    kind: "bpmn-event",
    keywords: ["bpmn", "event", "start", "end"],
  },
  {
    id: "erd-table",
    category: "ERD / Data",
    title: "ERD table",
    description: "Таблица БД с PK/FK строками.",
    icon: Table2,
    elementType: "advanced",
    kind: "erd-table",
    keywords: ["erd", "table", "database"],
  },
  {
    id: "erd-relationship",
    category: "ERD / Data",
    title: "ERD relationship",
    description: "Связь 1:N между таблицами.",
    icon: GitBranch,
    elementType: "advanced",
    kind: "erd-relationship",
    keywords: ["erd", "relationship", "relation"],
  },
  {
    id: "data-cluster",
    category: "ERD / Data",
    title: "Data cluster",
    description: "Группа сервисов или данных.",
    icon: Boxes,
    elementType: "advanced",
    kind: "section-zone",
    titleOverride: "Data domain",
    body: ["Service", "Database", "Events"],
    keywords: ["data", "domain", "cluster"],
  },
  {
    id: "wireframe",
    category: "Product / UI",
    title: "Wireframe",
    description: "Каркас экрана или страницы.",
    icon: Wallpaper,
    elementType: "advanced",
    kind: "wireframe",
    keywords: ["ui", "wireframe", "screen"],
  },
  {
    id: "kanban",
    category: "Product / UI",
    title: "Kanban board",
    description: "Колонки Backlog / Doing / Done.",
    icon: SquareKanban,
    elementType: "advanced",
    kind: "kanban-board",
    keywords: ["kanban", "product", "tasks"],
  },
  {
    id: "org-card",
    category: "Product / UI",
    title: "Org card",
    description: "Карточка команды, человека или владельца.",
    icon: CreditCard,
    elementType: "advanced",
    kind: "org-card",
    keywords: ["org", "person", "team", "card"],
  },
  {
    id: "section-zone",
    category: "Product / UI",
    title: "Section zone",
    description: "Контейнер/область для группировки.",
    icon: LayoutTemplate,
    elementType: "advanced",
    kind: "section-zone",
    keywords: ["section", "container", "zone"],
  },
  {
    id: "mindmap-node",
    category: "Product / UI",
    title: "Mind map node",
    description: "Узел mind map или idea map.",
    icon: Network,
    elementType: "advanced",
    kind: "mindmap-node",
    keywords: ["mindmap", "idea", "node"],
  },
  {
    id: "annotation-pin",
    category: "Product / UI",
    title: "Annotation pin",
    description: "Пин-заметка для ревью.",
    icon: ListCollapse,
    elementType: "advanced",
    kind: "annotation-pin",
    keywords: ["note", "pin", "annotation"],
  },
];

