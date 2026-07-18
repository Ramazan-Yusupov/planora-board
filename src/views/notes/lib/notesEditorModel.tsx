"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import {
  Code2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  MessageSquare,
  Minus,
  Quote,
  SquareCheck,
  Table2,
  Text,
  ToggleRight,
} from "lucide-react";

import type { Board, BoardCard, BoardList } from "@/entities/board";
import { getActiveBoardListIds, isListAtWipLimit } from "@/features/board-management";
import type { Note, NoteBlock, NoteBlockType } from "@/features/manage-notes";
import { cn, createId } from "@/shared/lib";
const DEFAULT_TABLE_ROW_COUNT = 2;
export const DEFAULT_TABLE_COLUMN_COUNT = 2;
export const NOTES_ROOT_DROP_ZONE_ID = "notes-root-drop-zone";

export type NoteDropIntent = Readonly<{
  blockId: string;
  type: "line" | "nest";
}>;

export type NoteDropTarget =
  | NoteDropIntent
  | Readonly<{
      type: "root";
    }>
  | null;

export function createTableCells(
  rowCount = DEFAULT_TABLE_ROW_COUNT,
  columnCount = DEFAULT_TABLE_COLUMN_COUNT,
): string[][] {
  return Array.from({ length: rowCount }, () =>
    Array.from({ length: columnCount }, () => ""),
  );
}

export function createBlock(
  type: NoteBlockType = "paragraph",
  text = "",
  parentId?: string,
): NoteBlock {
  return {
    checked: type === "todo" ? false : undefined,
    collapsed: type === "toggle" ? false : undefined,
    id: createId("note-block"),
    tableCells: type === "table" ? createTableCells() : undefined,
    tableHasHeaderRow: type === "table" ? true : undefined,
    text,
    type,
    parentId,
  };
}

export function getNoteSearchText(note: Note): string {
  return [
    note.title,
    note.status,
    note.dueDate ?? "",
    note.linkedBoardId ?? "",
    note.linkedCardId ?? "",
    note.tags.join(" "),
    ...note.blocks.flatMap((block) => [
      block.text,
      block.tableCells?.flat().join(" ") ?? "",
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}

export function isDescendantBlock(
  block: NoteBlock,
  ancestorId: string,
  blocks: readonly NoteBlock[],
): boolean {
  let parentId = block.parentId;

  while (parentId) {
    if (parentId === ancestorId) {
      return true;
    }

    parentId = blocks.find((current) => current.id === parentId)?.parentId;
  }

  return false;
}

export function getTableCells(block: NoteBlock): string[][] {
  const source = block.tableCells && block.tableCells.length > 0
    ? block.tableCells
    : createTableCells();
  const columnCount = Math.max(1, ...source.map((row) => row.length));

  return source.map((row) =>
    Array.from({ length: columnCount }, (_, cellIndex) => row[cellIndex] ?? ""),
  );
}

export function getTableCellKey(
  blockId: string,
  rowIndex: number,
  cellIndex: number,
): string {
  return `${blockId}:${rowIndex}:${cellIndex}`;
}

export function getBoardTaskItems(board: Board): NoteTaskItem[] {
  return board.listIds.flatMap((listId) => {
    const list = board.lists[listId];

  if (!list || list.isArchived) {
      return [];
    }

    return list.cardIds.flatMap((cardId) => {
      const card = board.cards[cardId];

      if (!card || card.isArchived) {
        return [];
      }

      return [
        {
          boardId: board.id,
          boardTitle: board.title,
          card,
          listTitle: list.title,
        },
      ];
    });
  });
}

export function getActiveTaskCreateTargets(board: Board): NoteTaskCreateTarget[] {
  return getActiveBoardListIds(board).flatMap((listId) => {
    const list = board.lists[listId];

    if (!list) {
      return [];
    }

    const isDisabled = isListAtWipLimit(list);

    return [
      {
        disabledReason: isDisabled ? "Достигнут WIP-лимит" : undefined,
        isDisabled,
        listId: list.id,
        listTitle: list.title,
      },
    ];
  });
}

export function isTaskCreateQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

  return /^(task|tasks|card|задач|карточ)/.test(normalizedQuery);
}

export function getTaskTitleFromSlashText(text: string): string {
  const query = text.startsWith("/") ? text.slice(1) : text;
  const title = query
    .replace(/^(task|tasks|card|задача|задачу|задачи|карточка|карточку)\s*/i, "")
    .trim();

  return title || "Новая задача";
}

export function getCreatedCardFromListDiff(
  previousList: BoardList,
  nextList: BoardList,
  cards: Readonly<Record<string, BoardCard>>,
): BoardCard | null {
  const previousCardIds = new Set(previousList.cardIds);
  const createdCardId = nextList.cardIds.find(
    (cardId) => !previousCardIds.has(cardId),
  );

  return createdCardId ? (cards[createdCardId] ?? null) : null;
}

export function filterTaskItems(
  items: readonly NoteTaskItem[],
  query: string,
): NoteTaskItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...items];
  }

  return items.filter((item) =>
    [item.card.title, item.card.description, item.listTitle, item.boardTitle]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function getNumberedListNumbers(
  blocks: readonly NoteBlock[],
): ReadonlyMap<string, number> {
  const numbers = new Map<string, number>();
  const currentNumbers = new Map<string, number>();

  for (const block of blocks) {
    const parentKey = block.parentId ?? "root";

    if (block.type !== "numbered") {
      currentNumbers.set(parentKey, 0);
      continue;
    }

    const nextNumber = (currentNumbers.get(parentKey) ?? 0) + 1;
    currentNumbers.set(parentKey, nextNumber);
    numbers.set(block.id, nextNumber);
  }

  return numbers;
}

export function getVisibleBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  const blockIds = new Set(blocks.map((block) => block.id));
  const visibleBlocks: NoteBlock[] = [];

  for (const block of blocks) {
    if (block.parentId && blockIds.has(block.parentId)) {
      const parent = blocks.find((candidate) => candidate.id === block.parentId);

      if (parent?.type === "toggle" && !parent.collapsed) {
        visibleBlocks.push(block);
      }

      continue;
    }

    visibleBlocks.push(block);
  }

  return visibleBlocks;
}

export type BlockCommand = Readonly<{
  aliases?: readonly string[];
  createBlocks?: (sourceBlock: NoteBlock) => NoteBlock[];
  group?: "basic" | "markdown" | "planora";
  id: string;
  targetType?: NoteBlockType;
  title: string;
  description: string;
  shortcut?: string;
  icon: ReactNode;
}>;

export type NoteTaskItem = Readonly<{
  boardId: string;
  boardTitle: string;
  card: BoardCard;
  listTitle: string;
}>;

export type NoteTaskCreateTarget = Readonly<{
  disabledReason?: string;
  isDisabled: boolean;
  listId: string;
  listTitle: string;
}>;

export const basicBlockCommands: readonly BlockCommand[] = [
  {
    id: "paragraph",
    targetType: "paragraph",
    title: "Text",
    description: "Обычный текстовый блок",
    aliases: ["paragraph", "p", "text", "текст"],
    icon: <Text aria-hidden="true" size={17} />,
  },
  {
    id: "heading1",
    targetType: "heading1",
    title: "Heading 1",
    description: "Большой заголовок раздела",
    shortcut: "#",
    aliases: ["h1", "title", "заголовок"],
    icon: <Heading1 aria-hidden="true" size={18} />,
  },
  {
    id: "heading2",
    targetType: "heading2",
    title: "Heading 2",
    description: "Средний заголовок",
    shortcut: "##",
    aliases: ["h2", "subtitle", "подзаголовок"],
    icon: <Heading2 aria-hidden="true" size={18} />,
  },
  {
    id: "heading3",
    targetType: "heading3",
    title: "Heading 3",
    description: "Малый заголовок",
    shortcut: "###",
    aliases: ["h3"],
    icon: <Heading3 aria-hidden="true" size={18} />,
  },
  {
    id: "heading4",
    targetType: "heading4",
    title: "Heading 4",
    description: "Компактный заголовок",
    shortcut: "####",
    aliases: ["h4"],
    icon: <Heading4 aria-hidden="true" size={18} />,
  },
  {
    id: "bulleted",
    targetType: "bulleted",
    title: "Bulleted list",
    description: "Список с маркерами",
    shortcut: "-",
    aliases: ["ul", "bullet", "list", "список"],
    icon: <List aria-hidden="true" size={17} />,
  },
  {
    id: "numbered",
    targetType: "numbered",
    title: "Numbered list",
    description: "Нумерованный список",
    shortcut: "1.",
    aliases: ["ol", "ordered", "steps", "шаги"],
    icon: <ListOrdered aria-hidden="true" size={17} />,
  },
  {
    id: "todo",
    targetType: "todo",
    title: "To-do list",
    description: "Чекбокс с текстом",
    shortcut: "[]",
    aliases: ["task", "checklist", "todo", "чеклист"],
    icon: <SquareCheck aria-hidden="true" size={17} />,
  },
  {
    id: "toggle",
    targetType: "toggle",
    title: "Toggle list",
    description: "Сворачиваемый пункт",
    shortcut: ">",
    aliases: ["details", "spoiler", "toggle"],
    icon: <ToggleRight aria-hidden="true" size={17} />,
  },
  {
    id: "quote",
    targetType: "quote",
    title: "Quote",
    description: "Цитата с вертикальной линией",
    shortcut: '"',
    aliases: ["blockquote", "цитата"],
    icon: <Quote aria-hidden="true" size={17} />,
  },
  {
    id: "callout",
    targetType: "callout",
    title: "Callout",
    description: "Выделенный блок заметки",
    aliases: ["note", "info", "warning", "заметка"],
    icon: <MessageSquare aria-hidden="true" size={17} />,
  },
  {
    id: "code",
    targetType: "code",
    title: "Code",
    description: "Моноширинный блок кода",
    shortcut: "```",
    aliases: ["snippet", "pre", "код"],
    icon: <Code2 aria-hidden="true" size={17} />,
  },
  {
    id: "table",
    targetType: "table",
    title: "Table",
    description: "Быстрая таблица 2 x 2",
    aliases: ["database", "grid", "таблица"],
    icon: <Table2 aria-hidden="true" size={17} />,
  },
  {
    id: "divider",
    targetType: "divider",
    title: "Divider",
    description: "Горизонтальная линия",
    shortcut: "---",
    aliases: ["hr", "line", "разделитель"],
    icon: <Minus aria-hidden="true" size={17} />,
  },
  {
    id: "template-checklist",
    group: "markdown",
    title: "Checklist section",
    description: "Заголовок и несколько задач",
    aliases: ["todo section", "checklist", "чеклист"],
    icon: <SquareCheck aria-hidden="true" size={17} />,
    createBlocks: () => [
      createBlock("heading2", "Checklist"),
      createBlock("todo", "Первый пункт"),
      createBlock("todo", "Следующий пункт"),
      createBlock("todo", "Проверить результат"),
    ],
  },
  {
    id: "template-meeting",
    group: "markdown",
    title: "Meeting note",
    description: "Повестка, решения и action items",
    aliases: ["meeting", "standup", "встреча"],
    icon: <FileText aria-hidden="true" size={17} />,
    createBlocks: () => [
      createBlock("heading2", "Повестка"),
      createBlock("bulleted", "Контекст"),
      createBlock("heading2", "Решения"),
      createBlock("quote", "Коротко: что решили и почему."),
      createBlock("heading2", "Action items"),
      createBlock("todo", "Назначить владельца"),
      createBlock("todo", "Обновить задачу Planora"),
    ],
  },
  {
    id: "template-decision",
    group: "markdown",
    title: "Decision record",
    description: "Решение, альтернативы и последствия",
    aliases: ["decision", "adr", "решение"],
    icon: <Quote aria-hidden="true" size={17} />,
    createBlocks: () => [
      createBlock("heading2", "Decision"),
      createBlock("callout", "Короткое решение и причина."),
      createBlock("heading2", "Alternatives"),
      {
        ...createBlock("table"),
        tableCells: [
          ["Вариант", "Плюсы", "Минусы"],
          ["", "", ""],
          ["", "", ""],
        ],
        tableHasHeaderRow: true,
      },
      createBlock("heading2", "Next steps"),
      createBlock("todo", "Привязать связанную задачу"),
    ],
  },
  {
    id: "template-bug-report",
    group: "markdown",
    title: "Bug report",
    description: "Шаги, ожидание, факт и окружение",
    aliases: ["bug", "issue", "ошибка", "баг"],
    icon: <FileText aria-hidden="true" size={17} />,
    createBlocks: () => [
      createBlock("heading2", "Шаги воспроизведения"),
      createBlock("numbered", "Открыть сценарий"),
      createBlock("numbered", "Повторить действие"),
      createBlock("heading2", "Ожидание"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Факт"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Окружение"),
      createBlock("code", "Planora / Browser / localhost"),
    ],
  },
];

export type BlockColorOption = Readonly<{
  id: string;
  label: string;
  className: string;
  styleValue?: string;
  swatchClassName: string;
}>;

export const textColorOptions: readonly BlockColorOption[] = [
  {
    id: "default",
    label: "Обычный",
    className: "",
    styleValue: undefined,
    swatchClassName: "bg-text",
  },
  {
    id: "gray",
    label: "Серый",
    className: "text-slate-400",
    styleValue: "#94a3b8",
    swatchClassName: "bg-slate-400",
  },
  {
    id: "red",
    label: "Красный",
    className: "text-red-200",
    styleValue: "#fecaca",
    swatchClassName: "bg-red-300",
  },
  {
    id: "yellow",
    label: "Желтый",
    className: "text-amber-200",
    styleValue: "#fde68a",
    swatchClassName: "bg-amber-300",
  },
  {
    id: "green",
    label: "Зеленый",
    className: "text-emerald-200",
    styleValue: "#a7f3d0",
    swatchClassName: "bg-emerald-300",
  },
  {
    id: "blue",
    label: "Синий",
    className: "text-sky-200",
    styleValue: "#bae6fd",
    swatchClassName: "bg-sky-300",
  },
  {
    id: "purple",
    label: "Фиолетовый",
    className: "text-violet-200",
    styleValue: "#ddd6fe",
    swatchClassName: "bg-violet-300",
  },
];

export const backgroundColorOptions: readonly BlockColorOption[] = [
  {
    id: "default",
    label: "Без фона",
    className: "",
    styleValue: undefined,
    swatchClassName: "bg-control",
  },
  {
    id: "gray",
    label: "Серый фон",
    className: "bg-white/6",
    styleValue: "rgb(255 255 255 / 0.06)",
    swatchClassName: "bg-slate-500",
  },
  {
    id: "red",
    label: "Красный фон",
    className: "bg-red-400/10",
    styleValue: "rgb(248 113 113 / 0.10)",
    swatchClassName: "bg-red-400",
  },
  {
    id: "yellow",
    label: "Желтый фон",
    className: "bg-amber-300/12",
    styleValue: "rgb(252 211 77 / 0.12)",
    swatchClassName: "bg-amber-300",
  },
  {
    id: "green",
    label: "Зеленый фон",
    className: "bg-emerald-300/10",
    styleValue: "rgb(110 231 183 / 0.10)",
    swatchClassName: "bg-emerald-300",
  },
  {
    id: "blue",
    label: "Синий фон",
    className: "bg-sky-300/10",
    styleValue: "rgb(125 211 252 / 0.10)",
    swatchClassName: "bg-sky-300",
  },
  {
    id: "purple",
    label: "Фиолетовый фон",
    className: "bg-violet-300/10",
    styleValue: "rgb(196 181 253 / 0.10)",
    swatchClassName: "bg-violet-300",
  },
];


export type InlineFormat = "bold" | "italic" | "underline" | "strike" | "code";

export function getBlockClassName(type: NoteBlockType): string {
  if (type === "heading1") {
    return "min-h-11 text-3xl font-semibold leading-tight text-text";
  }

  if (type === "heading2") {
    return "min-h-10 text-2xl font-semibold leading-tight text-text";
  }

  if (type === "heading3") {
    return "min-h-9 text-xl font-semibold leading-tight text-text";
  }

  if (type === "heading4") {
    return "min-h-8 text-lg font-semibold leading-tight text-text";
  }

  if (type === "quote") {
    return "min-h-8 border-l-2 border-white/22 pl-3 text-base italic leading-7 text-text";
  }

  if (type === "callout") {
    return "min-h-11 rounded-lg border border-amber-300/18 bg-amber-300/8 px-3 py-2 text-base leading-7 text-text";
  }

  if (type === "code") {
    return "min-h-10 rounded-lg border border-white/10 bg-black/24 px-3 py-2 font-mono text-sm leading-6 text-sky-100";
  }

  if (type === "table") {
    return "min-h-9 font-mono text-sm leading-6 text-text";
  }

  return "min-h-8 text-base leading-7 text-text";
}

export function getBlockColorClassName(block: NoteBlock): string {
  const backgroundColor = backgroundColorOptions.find(
    (option) => option.id === block.backgroundColor,
  );

  return cn(backgroundColor?.className);
}

export function getBlockStyle(block: NoteBlock): CSSProperties | undefined {
  const textColor = textColorOptions.find(
    (option) => option.id === block.textColor,
  );
  const backgroundColor = backgroundColorOptions.find(
    (option) => option.id === block.backgroundColor,
  );
  const style: CSSProperties = {};

  if (textColor?.styleValue) {
    style.color = textColor.styleValue;
  }

  if (backgroundColor?.styleValue) {
    style.backgroundColor = backgroundColor.styleValue;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

export function getTextFromEditable(element: HTMLElement): string {
  return element.innerText.replace(/\u00a0/g, " ").replace(/\n$/, "");
}

export function escapeInlineHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

function getNormalizedInlineTagName(tagName: string): string | null {
  const normalizedTagName = tagName.toLowerCase();

  if (normalizedTagName === "b" || normalizedTagName === "strong") {
    return "strong";
  }

  if (normalizedTagName === "i" || normalizedTagName === "em") {
    return "em";
  }

  if (normalizedTagName === "u") {
    return "u";
  }

  if (normalizedTagName === "s" || normalizedTagName === "strike") {
    return "s";
  }

  if (normalizedTagName === "code") {
    return "code";
  }

  if (normalizedTagName === "br") {
    return "br";
  }

  return null;
}

export function sanitizeInlineHtml(value: string): string {
  if (typeof document === "undefined") {
    return escapeInlineHtml(value);
  }

  const source = document.createElement("template");
  const target = document.createElement("div");
  source.innerHTML = value;

  const appendCleanNode = (node: Node, parent: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent ?? ""));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tagName = getNormalizedInlineTagName(element.tagName);

    if (tagName === "br") {
      parent.appendChild(document.createElement("br"));
      return;
    }

    if (!tagName) {
      element.childNodes.forEach((childNode) =>
        appendCleanNode(childNode, parent),
      );
      return;
    }

    const cleanElement = document.createElement(tagName);
    element.childNodes.forEach((childNode) =>
      appendCleanNode(childNode, cleanElement),
    );
    parent.appendChild(cleanElement);
  };

  source.content.childNodes.forEach((node) => appendCleanNode(node, target));

  return target.innerHTML;
}

export function getBlockInlineHtml(block: NoteBlock): string {
  return sanitizeInlineHtml(block.html ?? escapeInlineHtml(block.text));
}

export function getInlineHtmlFromEditable(element: HTMLElement): string {
  return sanitizeInlineHtml(element.innerHTML);
}

export function placeCaretAtEnd(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function clearEditableText(element: HTMLElement): void {
  element.textContent = "";
  placeCaretAtEnd(element);
}

export function insertSoftBreakAtCaret(): void {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const br = document.createElement("br");
  range.deleteContents();
  range.insertNode(br);

  if (!br.nextSibling) {
    br.parentNode?.insertBefore(document.createElement("br"), br.nextSibling);
  }

  range.setStartAfter(br);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getElementFromSelectionNode(node: Node | null): HTMLElement | null {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.ELEMENT_NODE
    ? (node as HTMLElement)
    : node.parentElement;
}

function getClosestInlineElement(
  node: Node | null,
  editorElement: HTMLElement,
  tagName: string,
): HTMLElement | null {
  const element = getElementFromSelectionNode(node);
  const closest = element?.closest(tagName);

  return closest instanceof HTMLElement && editorElement.contains(closest)
    ? closest
    : null;
}

function unwrapInlineElement(element: HTMLElement): void {
  const parent = element.parentNode;

  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

export function isSelectionInsideElement(
  selection: Selection | null,
  element: HTMLElement,
): selection is Selection {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }

  return (
    Boolean(selection.anchorNode && element.contains(selection.anchorNode)) &&
    Boolean(selection.focusNode && element.contains(selection.focusNode))
  );
}

export function getActiveInlineFormats(element: HTMLElement): ReadonlySet<InlineFormat> {
  const selection = window.getSelection();
  const activeFormats = new Set<InlineFormat>();

  if (!isSelectionInsideElement(selection, element)) {
    return activeFormats;
  }

  if (document.queryCommandState("bold")) {
    activeFormats.add("bold");
  }

  if (document.queryCommandState("italic")) {
    activeFormats.add("italic");
  }

  if (document.queryCommandState("underline")) {
    activeFormats.add("underline");
  }

  if (document.queryCommandState("strikeThrough")) {
    activeFormats.add("strike");
  }

  if (
    getClosestInlineElement(selection.anchorNode, element, "code") ||
    getClosestInlineElement(selection.focusNode, element, "code")
  ) {
    activeFormats.add("code");
  }

  return activeFormats;
}

function toggleInlineCode(element: HTMLElement): void {
  const selection = window.getSelection();

  if (!isSelectionInsideElement(selection, element)) {
    return;
  }

  const activeCodeElement =
    getClosestInlineElement(selection.anchorNode, element, "code") ??
    getClosestInlineElement(selection.focusNode, element, "code");

  if (activeCodeElement) {
    unwrapInlineElement(activeCodeElement);
    return;
  }

  const range = selection.getRangeAt(0);
  const codeElement = document.createElement("code");
  codeElement.appendChild(range.extractContents());
  range.insertNode(codeElement);
  selection.removeAllRanges();
  const nextRange = document.createRange();
  nextRange.selectNodeContents(codeElement);
  selection.addRange(nextRange);
}

export function applyInlineFormat(format: InlineFormat, element: HTMLElement): void {
  if (format === "bold") {
    document.execCommand("bold");
    return;
  }

  if (format === "italic") {
    document.execCommand("italic");
    return;
  }

  if (format === "underline") {
    document.execCommand("underline");
    return;
  }

  if (format === "strike") {
    document.execCommand("strikeThrough");
    return;
  }

  toggleInlineCode(element);
}

export function getInlineFormatShortcut(
  event: KeyboardEvent<HTMLElement>,
): InlineFormat | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return null;
  }

  const key = event.key.toLowerCase();

  if (key === "b") {
    return "bold";
  }

  if (key === "i") {
    return "italic";
  }

  if (key === "u") {
    return "underline";
  }

  if (key === "x" && event.shiftKey) {
    return "strike";
  }

  if (key === "`") {
    return "code";
  }

  return null;
}


export type NoteSnapshot = Readonly<
  Pick<
    Note,
    | "blocks"
    | "dueDate"
    | "linkedBoardId"
    | "linkedCardId"
    | "status"
    | "tags"
    | "title"
  >
>;

export type NoteHistoryState = Readonly<{
  future: NoteSnapshot[];
  noteId: string | null;
  past: NoteSnapshot[];
}>;

export function cloneNoteBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({
    ...block,
    tableCells: block.tableCells?.map((row) => [...row]),
  }));
}

export function createNoteSnapshot(note: Note): NoteSnapshot {
  return {
    blocks: cloneNoteBlocks(note.blocks),
    dueDate: note.dueDate,
    linkedBoardId: note.linkedBoardId,
    linkedCardId: note.linkedCardId,
    status: note.status,
    tags: [...note.tags],
    title: note.title,
  };
}

export function areNoteSnapshotsEqual(
  first: NoteSnapshot,
  second: NoteSnapshot,
): boolean {
  return (
    first.title === second.title &&
    first.status === second.status &&
    first.dueDate === second.dueDate &&
    first.linkedBoardId === second.linkedBoardId &&
    first.linkedCardId === second.linkedCardId &&
    JSON.stringify(first.tags) === JSON.stringify(second.tags) &&
    JSON.stringify(first.blocks) === JSON.stringify(second.blocks)
  );
}


