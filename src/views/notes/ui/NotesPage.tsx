"use client";

import {
  closestCenter,
  DndContext,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Bold,
  ChevronDown,
  ChevronRight,
  Check,
  Code2,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Plus,
  Quote,
  Search,
  SquareCheck,
  Strikethrough,
  Table2,
  Text,
  ToggleRight,
  Underline,
  Trash2,
  Italic,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type RefCallback,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useBoardWorkspace } from "@/features/manage-board-workspace";
import type { Board, BoardCard, BoardList } from "@/entities/board";
import {
  addCard,
  getActiveBoardListIds,
  isListAtWipLimit,
} from "@/features/board-management";
import {
  createNote,
  loadNotes,
  parseMarkdownBlocks,
  saveNotes,
  type Note,
  type NoteBlock,
  type NoteBlockType,
} from "@/features/manage-notes";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { cn, createId } from "@/shared/lib";
import {
  Button,
  ConfirmDialog,
  TextField,
  useViewportMenuPosition,
} from "@/shared/ui";
import {
  CommandPalette,
  getWorkspaceNavigationActions,
  useCommandPaletteShortcut,
} from "@/widgets/command-palette";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

import { NotesDataModal } from "./NotesDataModal";

const DEFAULT_TABLE_ROW_COUNT = 2;
const DEFAULT_TABLE_COLUMN_COUNT = 2;
const NOTES_ROOT_DROP_ZONE_ID = "notes-root-drop-zone";

type NoteDropIntent = Readonly<{
  blockId: string;
  type: "line" | "nest";
}>;

type NoteDropTarget =
  | NoteDropIntent
  | Readonly<{
      type: "root";
    }>
  | null;

function createTableCells(
  rowCount = DEFAULT_TABLE_ROW_COUNT,
  columnCount = DEFAULT_TABLE_COLUMN_COUNT,
): string[][] {
  return Array.from({ length: rowCount }, () =>
    Array.from({ length: columnCount }, () => ""),
  );
}

function createBlock(
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

function getNoteSearchText(note: Note): string {
  return [
    note.title,
    ...note.blocks.flatMap((block) => [
      block.text,
      block.tableCells?.flat().join(" ") ?? "",
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}

function isDescendantBlock(
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

function getTableCells(block: NoteBlock): string[][] {
  const source = block.tableCells && block.tableCells.length > 0
    ? block.tableCells
    : createTableCells();
  const columnCount = Math.max(1, ...source.map((row) => row.length));

  return source.map((row) =>
    Array.from({ length: columnCount }, (_, cellIndex) => row[cellIndex] ?? ""),
  );
}

function getTableCellKey(
  blockId: string,
  rowIndex: number,
  cellIndex: number,
): string {
  return `${blockId}:${rowIndex}:${cellIndex}`;
}

function getBoardTaskItems(board: Board): NoteTaskItem[] {
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

function getActiveTaskCreateTargets(board: Board): NoteTaskCreateTarget[] {
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

function isTaskCreateQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

  return /^(task|tasks|card|задач|карточ)/.test(normalizedQuery);
}

function getTaskTitleFromSlashText(text: string): string {
  const query = text.startsWith("/") ? text.slice(1) : text;
  const title = query
    .replace(/^(task|tasks|card|задача|задачу|задачи|карточка|карточку)\s*/i, "")
    .trim();

  return title || "Новая задача";
}

function getCreatedCardFromListDiff(
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

function filterTaskItems(
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

function getNumberedListNumbers(
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

function getVisibleBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
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

type BlockCommand = Readonly<{
  id: NoteBlockType;
  title: string;
  description: string;
  shortcut?: string;
  icon: ReactNode;
}>;

type NoteTaskItem = Readonly<{
  boardId: string;
  boardTitle: string;
  card: BoardCard;
  listTitle: string;
}>;

type NoteTaskCreateTarget = Readonly<{
  disabledReason?: string;
  isDisabled: boolean;
  listId: string;
  listTitle: string;
}>;

const basicBlockCommands: readonly BlockCommand[] = [
  {
    id: "paragraph",
    title: "Text",
    description: "Обычный текстовый блок",
    icon: <Text aria-hidden="true" size={17} />,
  },
  {
    id: "heading1",
    title: "Heading 1",
    description: "Большой заголовок раздела",
    shortcut: "#",
    icon: <Heading1 aria-hidden="true" size={18} />,
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Средний заголовок",
    shortcut: "##",
    icon: <Heading2 aria-hidden="true" size={18} />,
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Малый заголовок",
    shortcut: "###",
    icon: <Heading3 aria-hidden="true" size={18} />,
  },
  {
    id: "heading4",
    title: "Heading 4",
    description: "Компактный заголовок",
    shortcut: "####",
    icon: <Heading4 aria-hidden="true" size={18} />,
  },
  {
    id: "bulleted",
    title: "Bulleted list",
    description: "Список с маркерами",
    shortcut: "-",
    icon: <List aria-hidden="true" size={17} />,
  },
  {
    id: "numbered",
    title: "Numbered list",
    description: "Нумерованный список",
    shortcut: "1.",
    icon: <ListOrdered aria-hidden="true" size={17} />,
  },
  {
    id: "todo",
    title: "To-do list",
    description: "Чекбокс с текстом",
    shortcut: "[]",
    icon: <SquareCheck aria-hidden="true" size={17} />,
  },
  {
    id: "toggle",
    title: "Toggle list",
    description: "Сворачиваемый пункт",
    shortcut: ">",
    icon: <ToggleRight aria-hidden="true" size={17} />,
  },
  {
    id: "quote",
    title: "Quote",
    description: "Цитата с вертикальной линией",
    shortcut: '"',
    icon: <Quote aria-hidden="true" size={17} />,
  },
  {
    id: "callout",
    title: "Callout",
    description: "Выделенный блок заметки",
    icon: <MessageSquare aria-hidden="true" size={17} />,
  },
  {
    id: "code",
    title: "Code",
    description: "Моноширинный блок кода",
    shortcut: "```",
    icon: <Code2 aria-hidden="true" size={17} />,
  },
  {
    id: "table",
    title: "Table",
    description: "Быстрая таблица 2 x 2",
    icon: <Table2 aria-hidden="true" size={17} />,
  },
  {
    id: "divider",
    title: "Divider",
    description: "Горизонтальная линия",
    shortcut: "---",
    icon: <Minus aria-hidden="true" size={17} />,
  },
];

type BlockColorOption = Readonly<{
  id: string;
  label: string;
  className: string;
  styleValue?: string;
  swatchClassName: string;
}>;

const textColorOptions: readonly BlockColorOption[] = [
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

const backgroundColorOptions: readonly BlockColorOption[] = [
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

function NotesLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем заметки…
      </p>
    </main>
  );
}

function getBlockClassName(type: NoteBlockType): string {
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

function getBlockColorClassName(block: NoteBlock): string {
  const backgroundColor = backgroundColorOptions.find(
    (option) => option.id === block.backgroundColor,
  );

  return cn(backgroundColor?.className);
}

function getBlockStyle(block: NoteBlock): CSSProperties | undefined {
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

function getTextFromEditable(element: HTMLElement): string {
  return element.innerText.replace(/\u00a0/g, " ").replace(/\n$/, "");
}

function escapeInlineHtml(value: string): string {
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

function sanitizeInlineHtml(value: string): string {
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

function getBlockInlineHtml(block: NoteBlock): string {
  return sanitizeInlineHtml(block.html ?? escapeInlineHtml(block.text));
}

function getInlineHtmlFromEditable(element: HTMLElement): string {
  return sanitizeInlineHtml(element.innerHTML);
}

function placeCaretAtEnd(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function clearEditableText(element: HTMLElement): void {
  element.textContent = "";
  placeCaretAtEnd(element);
}

function insertSoftBreakAtCaret(): void {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const br = document.createElement("br");
  range.deleteContents();
  range.insertNode(br);
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

function isSelectionInsideElement(
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

function getActiveInlineFormats(element: HTMLElement): ReadonlySet<InlineFormat> {
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

function applyInlineFormat(format: InlineFormat, element: HTMLElement): void {
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

function getInlineFormatShortcut(
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

type NotesEditorProps = Readonly<{
  activeBoard: Board;
  blocks: readonly NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  onCreateTask: (listId: string, title: string) => NoteTaskItem | null;
  onOpenCard: (cardId: string) => void;
}>;

type EditableBlockProps = Readonly<{
  block: NoteBlock;
  className: string;
  registerElement: RefCallback<HTMLElement>;
  style?: CSSProperties;
  onBlur: (element: HTMLElement) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPasteMarkdown: (text: string, element: HTMLElement) => boolean;
  onSelectionChange: (element: HTMLElement) => void;
}>;

function EditableBlock({
  block,
  className,
  registerElement,
  style,
  onBlur,
  onInput,
  onKeyDown,
  onPasteMarkdown,
  onSelectionChange,
}: EditableBlockProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    const html = getBlockInlineHtml(block);

    if (sanitizeInlineHtml(element.innerHTML) !== html) {
      element.innerHTML = html;
    }
  }, [block]);

  return (
    <div
      ref={(element) => {
        elementRef.current = element;
        registerElement(element);

        if (element && document.activeElement !== element) {
          element.innerHTML = getBlockInlineHtml(block);
        }
      }}
      className={cn(
        className,
        "cursor-text [&_code]:rounded [&_code]:border [&_code]:border-white/10 [&_code]:bg-white/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-sky-100",
      )}
      contentEditable
      data-placeholder="Напишите что-нибудь или введите ###, ---, -"
      role="textbox"
      style={style}
      suppressContentEditableWarning
      onBlur={(event) => onBlur(event.currentTarget)}
      onInput={(event) => onInput(event.currentTarget)}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => onSelectionChange(event.currentTarget)}
      onMouseUp={(event) => onSelectionChange(event.currentTarget)}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text/plain");

        if (onPasteMarkdown(text, event.currentTarget)) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        document.execCommand("insertHTML", false, escapeInlineHtml(text));
        onInput(event.currentTarget);
      }}
    />
  );
}

type EditableTableCellProps = Readonly<{
  blockId: string;
  canDeleteColumn: boolean;
  canDeleteRow: boolean;
  cellIndex: number;
  className?: string;
  isHeader: boolean;
  isMenuOpen: boolean;
  placeholder: string;
  rowIndex: number;
  tableHasHeaderRow: boolean;
  value: string;
  onChange: (value: string) => void;
  onCloseMenu: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onOpenMenu: () => void;
  onRegisterElement: (element: HTMLElement | null) => void;
  onTableAction: (action: TableCellAction) => void;
}>;

function EditableTableCell({
  blockId,
  canDeleteColumn,
  canDeleteRow,
  cellIndex,
  className,
  isHeader,
  isMenuOpen,
  placeholder,
  rowIndex,
  tableHasHeaderRow,
  value,
  onChange,
  onCloseMenu,
  onKeyDown,
  onOpenMenu,
  onRegisterElement,
  onTableAction,
}: EditableTableCellProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    if (element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={wrapperRef}
      className={cn("group/cell relative min-h-9", className)}
      onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        onOpenMenu();
      }}
    >
      <div
        ref={(element) => {
          elementRef.current = element;
          onRegisterElement(element);

          if (element && document.activeElement !== element) {
            element.textContent = value;
          }
        }}
        className={cn(
          "min-h-9 px-3 py-2 pr-8 outline-none empty:before:text-text-muted/55 empty:before:content-[attr(data-placeholder)] focus:bg-white/5",
          isHeader && "font-medium text-white",
        )}
        contentEditable
        data-placeholder={placeholder}
        data-table-block-id={blockId}
        data-table-cell-index={cellIndex}
        data-table-row-index={rowIndex}
        role="textbox"
        suppressContentEditableWarning
        onInput={(event) => onChange(getTextFromEditable(event.currentTarget))}
        onKeyDown={onKeyDown}
      />
      <button
        aria-label="Открыть меню ячейки"
        className="absolute right-1 top-1 grid size-6 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/10 hover:text-text focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent/60 group-hover/cell:opacity-80 group-focus-within/cell:opacity-80"
        type="button"
        onClick={onOpenMenu}
      >
        <MoreHorizontal aria-hidden="true" size={14} />
      </button>
      {isMenuOpen ? (
        <TableCellActionMenu
          anchorRef={wrapperRef}
          canDeleteColumn={canDeleteColumn}
          canDeleteRow={canDeleteRow}
          hasHeaderRow={tableHasHeaderRow}
          onAction={onTableAction}
          onClose={onCloseMenu}
        />
      ) : null}
    </div>
  );
}

type SlashMenuState = Readonly<{
  blockId: string;
  query: string;
}> | null;

type BlockActionMenuState = Readonly<{
  blockId: string;
}> | null;

type TableCellMenuState = Readonly<{
  blockId: string;
  cellIndex: number;
  rowIndex: number;
}> | null;

type TableCellAction =
  | "insert-row-above"
  | "insert-row-below"
  | "delete-row"
  | "insert-column-left"
  | "insert-column-right"
  | "delete-column"
  | "toggle-header-row";

type InlineFormat = "bold" | "italic" | "underline" | "strike" | "code";

type InlineFormatMenuState = Readonly<{
  blockId: string;
  left: number;
  top: number;
  activeFormats: ReadonlySet<InlineFormat>;
}> | null;

function filterBlockCommands(query: string): readonly BlockCommand[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return basicBlockCommands;
  }

  return basicBlockCommands.filter((command) => {
    const haystack = [
      command.title,
      command.description,
      command.shortcut ?? "",
      command.id,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function useViewportMenuStyle(
  menuRef: RefObject<HTMLDivElement | null>,
  maxHeight = 352,
  placementKey = 0,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const availableHeight = window.innerHeight - margin * 2;
    const nextMaxHeight = Math.min(maxHeight, availableHeight);
    const overflowBottom = rect.bottom - (window.innerHeight - margin);
    const overflowTopAfterShift = rect.top - Math.max(0, overflowBottom);
    const shiftY =
      overflowBottom > 0
        ? -Math.min(overflowBottom, Math.max(0, overflowTopAfterShift - margin))
        : 0;

    setStyle({
      maxHeight: nextMaxHeight,
      transform: shiftY ? `translateY(${shiftY}px)` : undefined,
    });
  }, [maxHeight, menuRef, placementKey]);

  return style;
}

function BlockCommandMenu({
  anchorRef,
  commands,
  showTaskCreateSection,
  taskCreateTargets,
  tasks,
  onClose,
  onCreateTask,
  onSelect,
  onSelectTask,
}: Readonly<{
  anchorRef: RefObject<HTMLDivElement | null>;
  commands: readonly BlockCommand[];
  showTaskCreateSection: boolean;
  taskCreateTargets: readonly NoteTaskCreateTarget[];
  tasks: readonly NoteTaskItem[];
  onClose: () => void;
  onCreateTask: (target: NoteTaskCreateTarget) => void;
  onSelect: (command: BlockCommand) => void;
  onSelectTask: (task: NoteTaskItem) => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { style: menuStyle } = useViewportMenuPosition({
    anchorRef,
    maxHeight: 440,
    menuRef,
    width: 352,
  });

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="flex flex-col overflow-hidden rounded-lg border border-white/12 bg-[#242424] text-white shadow-2xl"
      role="menu"
      style={{
        ...menuStyle,
        zIndex: 85,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="min-h-24 flex-1 overflow-y-auto p-1.5">
        <p className="px-2 py-1.5 text-xs font-semibold text-white/45">
          Basic blocks
        </p>
        {commands.length > 0 ? (
          commands.map((command) => (
            <button
              key={command.id}
              className="flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm transition hover:bg-white/10 focus:bg-white/10 focus:outline-none"
              role="menuitem"
              type="button"
              onClick={() => onSelect(command)}
            >
              <span className="grid size-6 shrink-0 place-items-center text-white/78">
                {command.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white/90">
                  {command.title}
                </span>
                <span className="block truncate text-xs text-white/42">
                  {command.description}
                </span>
              </span>
              {command.shortcut ? (
                <span className="shrink-0 font-mono text-xs text-white/32">
                  {command.shortcut}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-2.5 py-6 text-center text-sm text-white/45">
            Ничего не найдено
          </p>
        )}
      </div>
      {showTaskCreateSection ? (
        <div className="shrink-0 border-t border-white/10 p-1.5">
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <p className="text-xs font-semibold text-white/45">
              Создать задачу
            </p>
            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
              {taskCreateTargets.length}
            </span>
          </div>
          <div className="max-h-[6.75rem] overflow-x-hidden overflow-y-auto pr-1">
            {taskCreateTargets.length > 0 ? (
              <div className="grid min-w-0 gap-1">
                {taskCreateTargets.map((target) => (
                  <button
                    key={target.listId}
                    className={cn(
                      "flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition focus:border-accent/60 focus:outline-none",
                      target.isDisabled
                        ? "cursor-not-allowed opacity-45"
                        : "hover:border-accent/45 hover:bg-white/10",
                    )}
                    disabled={target.isDisabled}
                    role="menuitem"
                    title={
                      target.disabledReason
                        ? `${target.listTitle}: ${target.disabledReason}`
                        : `Создать задачу в «${target.listTitle}»`
                    }
                    type="button"
                    onClick={() => onCreateTask(target)}
                  >
                    <Plus
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                      size={16}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block max-w-full truncate font-semibold text-white/90">
                        {target.listTitle}
                      </span>
                      <span className="block max-w-full truncate text-xs text-white/42">
                        {target.disabledReason ?? "Из текущей строки"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-2.5 py-4 text-center text-sm text-white/45">
                Нет доступных списков
              </p>
            )}
          </div>
        </div>
      ) : null}
      <div className="shrink-0 border-t border-white/10 p-1.5">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <p className="text-xs font-semibold text-white/45">Задачи доски</p>
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
            {tasks.length}
          </span>
        </div>
        <div className="max-h-[6.75rem] overflow-x-hidden overflow-y-auto pr-1">
          {tasks.length > 0 ? (
            <div className="grid min-w-0 gap-1">
              {tasks.map((task) => (
                <button
                  key={`${task.boardId}-${task.card.id}`}
                  className="flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition hover:border-accent/45 hover:bg-white/10 focus:border-accent/60 focus:outline-none"
                  role="menuitem"
                  title={`${task.boardTitle}: ${task.card.title}`}
                  type="button"
                  onClick={() => onSelectTask(task)}
                >
                  {task.card.sticker ? (
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-base leading-none"
                    >
                      {task.card.sticker}
                    </span>
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-accent" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block max-w-full truncate font-semibold text-white/90">
                      {task.card.title}
                    </span>
                    <span className="block max-w-full truncate text-xs text-white/42">
                      {task.listTitle}
                      {task.card.dueDate ? ` · ${task.card.dueDate}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2.5 py-4 text-center text-sm text-white/45">
              В этой доске нет задач
            </p>
          )}
        </div>
      </div>
      <div className="flex min-h-10 items-center justify-between border-t border-white/10 px-3 text-sm">
        <button
          className="font-medium text-white/85 transition hover:text-white"
          type="button"
          onClick={onClose}
        >
          Close menu
        </button>
        <span className="text-xs text-white/35">esc</span>
      </div>
    </div>,
    document.body,
  );
}

function BlockActionMenu({
  block,
  onClose,
  onDelete,
  onSetBackgroundColor,
  onSetTextColor,
}: Readonly<{
  block: NoteBlock;
  onClose: () => void;
  onDelete: () => void;
  onSetBackgroundColor: (color: string | undefined) => void;
  onSetTextColor: (color: string | undefined) => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const viewportStyle = useViewportMenuStyle(menuRef, 304);
  const canChangeColors = block.type !== "linked-card" && block.type !== "table";

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", onClose);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute left-8 top-9 z-40 w-[min(18rem,calc(100vw-3rem))] overflow-y-auto rounded-lg border border-white/12 bg-[#242424] p-1.5 text-white shadow-2xl"
      role="menu"
      style={viewportStyle}
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/12"
        role="menuitem"
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 aria-hidden="true" size={15} />
        Удалить
      </button>

      {canChangeColors ? (
        <>
          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Цвет текста
            </p>
            <div className="grid gap-1">
              {textColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive = (block.textColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetTextColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Фон
            </p>
            <div className="grid gap-1">
              {backgroundColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive =
                  (block.backgroundColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetBackgroundColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function TableCellActionMenu({
  anchorRef,
  canDeleteColumn,
  canDeleteRow,
  hasHeaderRow,
  onAction,
  onClose,
}: Readonly<{
  anchorRef: RefObject<HTMLDivElement | null>;
  canDeleteColumn: boolean;
  canDeleteRow: boolean;
  hasHeaderRow: boolean;
  onAction: (action: TableCellAction) => void;
  onClose: () => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { style: menuStyle } = useViewportMenuPosition({
    align: "end",
    anchorRef,
    maxHeight: 240,
    menuRef,
    width: 256,
  });

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const runAction = (action: TableCellAction) => {
    onAction(action);
    onClose();
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="overflow-y-auto rounded-lg border border-white/12 bg-[#242424] p-1.5 text-white shadow-2xl"
      role="menu"
      style={{
        ...menuStyle,
        zIndex: 80,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-row-above")}
      >
        <Plus aria-hidden="true" size={14} />
        Строка выше
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-row-below")}
      >
        <Plus aria-hidden="true" size={14} />
        Строка ниже
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-column-left")}
      >
        <Plus aria-hidden="true" size={14} />
        Колонка слева
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-column-right")}
      >
        <Plus aria-hidden="true" size={14} />
        Колонка справа
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitemcheckbox"
        type="button"
        aria-checked={hasHeaderRow}
        onClick={() => runAction("toggle-header-row")}
      >
        <span className="grid size-4 place-items-center">
          {hasHeaderRow ? <Check aria-hidden="true" size={14} /> : null}
        </span>
        Header row
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-200 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:text-white/28 disabled:hover:bg-transparent"
        disabled={!canDeleteRow}
        role="menuitem"
        type="button"
        onClick={() => runAction("delete-row")}
      >
        <Trash2 aria-hidden="true" size={14} />
        Удалить строку
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-200 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:text-white/28 disabled:hover:bg-transparent"
        disabled={!canDeleteColumn}
        role="menuitem"
        type="button"
        onClick={() => runAction("delete-column")}
      >
        <Trash2 aria-hidden="true" size={14} />
        Удалить колонку
      </button>
    </div>,
    document.body,
  );
}

function InlineFormatBubble({
  menu,
  onFormat,
}: Readonly<{
  menu: InlineFormatMenuState;
  onFormat: (format: InlineFormat) => void;
}>) {
  if (!menu || typeof document === "undefined") {
    return null;
  }

  const actions: ReadonlyArray<{
    format: InlineFormat;
    label: string;
    icon: ReactNode;
  }> = [
    {
      format: "bold",
      label: "Bold",
      icon: <Bold aria-hidden="true" size={15} />,
    },
    {
      format: "italic",
      label: "Italic",
      icon: <Italic aria-hidden="true" size={15} />,
    },
    {
      format: "underline",
      label: "Underline",
      icon: <Underline aria-hidden="true" size={15} />,
    },
    {
      format: "strike",
      label: "Strike",
      icon: <Strikethrough aria-hidden="true" size={15} />,
    },
    {
      format: "code",
      label: "Inline code",
      icon: <Code2 aria-hidden="true" size={15} />,
    },
  ];

  return createPortal(
    <div
      className="fixed z-[90] flex items-center gap-1 rounded-lg border border-white/12 bg-[#242424] p-1 text-white shadow-2xl"
      role="toolbar"
      style={{
        left: menu.left,
        top: menu.top,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => {
        const isActive = menu.activeFormats.has(action.format);

        return (
          <button
            key={action.format}
            aria-label={action.label}
            aria-pressed={isActive}
            className={cn(
              "grid size-8 place-items-center rounded-md text-white/72 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              isActive && "bg-white/14 text-white",
            )}
            type="button"
            onClick={() => onFormat(action.format)}
          >
            {action.icon}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

function RootDropZone({
  isDraggingNestedBlock,
}: Readonly<{
  isDraggingNestedBlock: boolean;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: NOTES_ROOT_DROP_ZONE_ID,
    data: { type: "notes-root-drop-zone" },
  });

  if (!isDraggingNestedBlock) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-2 ml-[6.5rem] rounded-lg border border-dashed border-white/14 bg-control/20 px-3 py-2 text-xs font-medium text-text-muted transition",
        isOver && "border-accent/70 bg-accent/12 text-text",
      )}
    >
      Отпустите здесь, чтобы вынести блок на корневой уровень
    </div>
  );
}

type SortableNoteBlockProps = Readonly<{
  block: NoteBlock;
  dropIntent: NoteDropIntent | null;
  isNested: boolean;
  isActionMenuOpen: boolean;
  isSlashMenuOpen: boolean;
  openTableCellMenu: TableCellMenuState;
  menuCommands: readonly BlockCommand[];
  numberedListNumber: number | undefined;
  showTaskCreateSection: boolean;
  taskCreateTargets: readonly NoteTaskCreateTarget[];
  taskItems: readonly NoteTaskItem[];
  onBlur: (block: NoteBlock, element: HTMLElement) => void;
  onCloseTableCellMenu: () => void;
  onDeleteBlock: (blockId: string) => void;
  onInput: (block: NoteBlock, element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>, block: NoteBlock) => void;
  onPasteMarkdown: (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ) => boolean;
  onOpenActionMenu: (blockId: string) => void;
  onOpenTableCellMenu: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
  ) => void;
  onCloseActionMenu: () => void;
  onCloseSlashMenu: () => void;
  onInsertAfter: (blockId: string) => void;
  onRegisterElement: (blockId: string, element: HTMLElement | null) => void;
  onRegisterTableCell: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    element: HTMLElement | null,
  ) => void;
  onSelectionChange: (block: NoteBlock, element: HTMLElement) => void;
  onSetBlockColor: (
    blockId: string,
    patch: Pick<NoteBlock, "backgroundColor" | "textColor">,
  ) => void;
  onCreateTask: (block: NoteBlock, target: NoteTaskCreateTarget) => void;
  onSelectCommand: (block: NoteBlock, command: BlockCommand) => void;
  onSelectTask: (block: NoteBlock, task: NoteTaskItem) => void;
  onOpenLinkedCard: (block: NoteBlock) => void;
  onTableCellAction: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    action: TableCellAction,
  ) => void;
  onTableCellKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
    rowIndex: number,
    cellIndex: number,
  ) => void;
  onToggleCollapsed: (block: NoteBlock) => void;
  onToggleTodo: (block: NoteBlock) => void;
  onUpdateTableCell: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => void;
}>;

function SortableNoteBlock({
  block,
  dropIntent,
  isNested,
  isActionMenuOpen,
  isSlashMenuOpen,
  openTableCellMenu,
  menuCommands,
  numberedListNumber,
  showTaskCreateSection,
  taskCreateTargets,
  taskItems,
  onBlur,
  onCloseTableCellMenu,
  onDeleteBlock,
  onInput,
  onKeyDown,
  onPasteMarkdown,
  onOpenActionMenu,
  onOpenTableCellMenu,
  onCloseActionMenu,
  onCloseSlashMenu,
  onInsertAfter,
  onRegisterElement,
  onRegisterTableCell,
  onSelectionChange,
  onSetBlockColor,
  onCreateTask,
  onSelectCommand,
  onSelectTask,
  onOpenLinkedCard,
  onTableCellAction,
  onTableCellKeyDown,
  onToggleCollapsed,
  onToggleTodo,
  onUpdateTableCell,
}: SortableNoteBlockProps) {
  const blockElementRef = useRef<HTMLDivElement | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      blockId: block.id,
      blockType: block.type,
      parentId: block.parentId,
      type: "note-block",
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const tableCells = block.type === "table" ? getTableCells(block) : [];
  const tableColumnCount =
    tableCells[0]?.length ?? DEFAULT_TABLE_COLUMN_COUNT;
  const tableHasHeaderRow = block.tableHasHeaderRow ?? true;
  const linkedTask = block.linkedCardId
    ? taskItems.find((task) => task.card.id === block.linkedCardId)
    : undefined;

  const registerBlockElement = (element: HTMLDivElement | null) => {
    blockElementRef.current = element;
    setNodeRef(element);
  };

  if (block.type === "divider") {
    return (
      <div
        ref={registerBlockElement}
        style={style}
        className={cn(
          "group relative flex items-center gap-1 py-3",
          isNested && "ml-12 border-l border-white/10 pl-3",
          isDragging && "opacity-35",
          dropIntent?.type === "nest" &&
            "rounded-lg bg-accent/10 ring-1 ring-accent/45",
        )}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenActionMenu(block.id);
        }}
      >
        {dropIntent?.type === "line" ? (
          <span className="absolute -top-1 left-10 right-0 h-0.5 rounded-full bg-accent shadow-[0_0_12px_rgb(59_130_246/_70%)]" />
        ) : null}
        <button
          aria-label="Добавить строку ниже"
          className="grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
          onClick={() => onInsertAfter(block.id)}
        >
          <Plus aria-hidden="true" size={16} />
        </button>
        <button
          aria-label="Открыть меню блока"
          className="grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
          onClick={() => onOpenActionMenu(block.id)}
        >
          <MoreHorizontal aria-hidden="true" size={16} />
        </button>
        <button
          {...attributes}
          {...listeners}
          aria-label="Переместить блок"
          className="grid size-7 touch-none place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
        >
          <GripVertical aria-hidden="true" size={16} />
        </button>
        <button
          className="h-px min-w-0 flex-1 bg-white/16 transition hover:bg-white/30"
          type="button"
          onClick={() => onInsertAfter(block.id)}
        />
        {isActionMenuOpen ? (
          <BlockActionMenu
            block={block}
            onClose={onCloseActionMenu}
            onDelete={() => onDeleteBlock(block.id)}
            onSetBackgroundColor={(backgroundColor) =>
              onSetBlockColor(block.id, { backgroundColor })
            }
            onSetTextColor={(textColor) =>
              onSetBlockColor(block.id, { textColor })
            }
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={registerBlockElement}
      style={style}
      className={cn(
        "group relative flex items-start gap-1",
        isNested && "ml-12 border-l border-white/10 pl-3",
        isDragging && "opacity-35",
        dropIntent?.type === "nest" &&
          "rounded-lg bg-accent/10 ring-1 ring-accent/45",
      )}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenActionMenu(block.id);
      }}
    >
      {dropIntent?.type === "line" ? (
        <span className="absolute -top-1 left-10 right-0 h-0.5 rounded-full bg-accent shadow-[0_0_12px_rgb(59_130_246/_70%)]" />
      ) : null}
      <button
        aria-label="Добавить строку ниже"
        className="mt-0.5 grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
        onClick={() => onInsertAfter(block.id)}
      >
        <Plus aria-hidden="true" size={16} />
      </button>
      <button
        aria-label="Открыть меню блока"
        className="mt-0.5 grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
        onClick={() => onOpenActionMenu(block.id)}
      >
        <MoreHorizontal aria-hidden="true" size={16} />
      </button>
      <button
        {...attributes}
        {...listeners}
        aria-label="Переместить блок"
        className="mt-0.5 grid size-7 touch-none place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
      >
        <GripVertical aria-hidden="true" size={16} />
      </button>

      {block.type === "bulleted" ? (
        <span className="mt-3 size-1.5 shrink-0 rounded-full bg-text-muted" />
      ) : null}
      {block.type === "numbered" ? (
        <span className="mt-1.5 w-7 shrink-0 text-right text-sm tabular-nums text-text-muted">
          {numberedListNumber ?? 1}.
        </span>
      ) : null}
      {block.type === "todo" ? (
        <button
          aria-label={block.checked ? "Снять отметку" : "Отметить выполненным"}
          className={cn(
            "mt-1.5 grid size-5 shrink-0 place-items-center rounded border transition",
            block.checked
              ? "border-emerald-300/45 bg-emerald-400/20 text-emerald-100"
              : "border-white/20 text-transparent hover:border-white/40",
          )}
          type="button"
          onClick={() => onToggleTodo(block)}
        >
          <Check aria-hidden="true" size={13} />
        </button>
      ) : null}
      {block.type === "toggle" ? (
        <button
          aria-label={block.collapsed ? "Развернуть" : "Свернуть"}
          className="mt-1 grid size-6 shrink-0 place-items-center rounded-md text-text-muted transition hover:bg-white/8 hover:text-text"
          type="button"
          onClick={() => onToggleCollapsed(block)}
        >
          <ChevronRight
            aria-hidden="true"
            className={cn("transition", !block.collapsed && "rotate-90")}
            size={16}
          />
        </button>
      ) : null}
      {block.type === "callout" ? (
        <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-md bg-amber-300/12 text-sm">
          !
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        {block.type === "linked-card" ? (
          <button
            className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-white/10 bg-control/35 px-3 py-2 text-left transition hover:border-accent/45 hover:bg-control/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={() => onOpenLinkedCard(block)}
          >
            {linkedTask?.card.sticker ? (
              <span aria-hidden="true" className="shrink-0 text-lg leading-none">
                {linkedTask.card.sticker}
              </span>
            ) : (
              <span className="size-2.5 shrink-0 rounded-full bg-accent" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text">
                {linkedTask?.card.title || block.text || "Задача недоступна"}
              </span>
              <span className="block truncate text-xs text-text-muted">
                {linkedTask
                  ? `${linkedTask.boardTitle} / ${linkedTask.listTitle}`
                  : "Карточка не найдена в текущей доске"}
              </span>
            </span>
            {linkedTask?.card.dueDate ? (
              <span className="shrink-0 rounded-md border border-white/10 bg-black/12 px-2 py-1 text-[11px] font-semibold tabular-nums text-text-muted">
                {linkedTask.card.dueDate}
              </span>
            ) : null}
          </button>
        ) : block.type === "table" ? (
          <div className="max-w-full overflow-x-auto rounded-lg pb-2">
            <div
              className="grid overflow-hidden rounded-lg border border-white/12 bg-black/14 text-sm text-text"
              style={{
                gridTemplateColumns: `repeat(${tableColumnCount}, minmax(9rem, 1fr))`,
                minWidth:
                  tableColumnCount > 4
                    ? `${tableColumnCount * 9}rem`
                    : undefined,
              }}
            >
              {tableCells.map((row, rowIndex) =>
                row.map((cell, cellIndex) => (
                  <EditableTableCell
                    key={`${rowIndex}-${cellIndex}`}
                    blockId={block.id}
                    canDeleteColumn={tableColumnCount > 1}
                    canDeleteRow={tableCells.length > 1}
                    cellIndex={cellIndex}
                    className={cn(
                      rowIndex < tableCells.length - 1 &&
                        "border-b border-white/10",
                      cellIndex < tableColumnCount - 1 &&
                        "border-r border-white/10",
                      tableHasHeaderRow && rowIndex === 0 && "bg-white/5",
                    )}
                    isHeader={tableHasHeaderRow && rowIndex === 0}
                    isMenuOpen={
                      openTableCellMenu?.blockId === block.id &&
                      openTableCellMenu.rowIndex === rowIndex &&
                      openTableCellMenu.cellIndex === cellIndex
                    }
                    placeholder={
                      tableHasHeaderRow && rowIndex === 0
                        ? `Столбец ${cellIndex + 1}`
                        : "Пусто"
                    }
                    rowIndex={rowIndex}
                    tableHasHeaderRow={tableHasHeaderRow}
                    value={cell}
                    onCloseMenu={onCloseTableCellMenu}
                    onChange={(value) =>
                      onUpdateTableCell(block.id, rowIndex, cellIndex, value)
                    }
                    onKeyDown={(event) =>
                      onTableCellKeyDown(event, block, rowIndex, cellIndex)
                    }
                    onOpenMenu={() =>
                      onOpenTableCellMenu(block.id, rowIndex, cellIndex)
                    }
                    onRegisterElement={(element) =>
                      onRegisterTableCell(block.id, rowIndex, cellIndex, element)
                    }
                    onTableAction={(action) =>
                      onTableCellAction(block.id, rowIndex, cellIndex, action)
                    }
                  />
                )),
              )}
            </div>
          </div>
        ) : (
          <EditableBlock
            block={block}
            className={cn(
            "min-w-0 flex-1 rounded-md px-1.5 py-0.5 outline-none transition empty:before:text-transparent empty:before:content-[attr(data-placeholder)] group-hover:empty:before:text-text-muted/60 focus:empty:before:text-text-muted/60 focus:bg-white/5",
              "whitespace-pre-wrap",
              getBlockClassName(block.type),
              getBlockColorClassName(block),
              block.type === "todo" &&
                block.checked &&
                "text-text-muted line-through",
            )}
            registerElement={(element) => onRegisterElement(block.id, element)}
            style={getBlockStyle(block)}
            onBlur={(element) => onBlur(block, element)}
            onInput={(element) => onInput(block, element)}
            onKeyDown={(event) => onKeyDown(event, block)}
            onPasteMarkdown={(text, element) =>
              onPasteMarkdown(block, text, element)
            }
            onSelectionChange={(element) => onSelectionChange(block, element)}
          />
        )}
      </div>

      {isSlashMenuOpen ? (
        <BlockCommandMenu
          anchorRef={blockElementRef}
          commands={menuCommands}
          showTaskCreateSection={showTaskCreateSection}
          taskCreateTargets={taskCreateTargets}
          tasks={filterTaskItems(taskItems, block.text.startsWith("/") ? block.text.slice(1) : "")}
          onClose={onCloseSlashMenu}
          onCreateTask={(target) => onCreateTask(block, target)}
          onSelect={(command) => onSelectCommand(block, command)}
          onSelectTask={(task) => onSelectTask(block, task)}
        />
      ) : null}
      {isActionMenuOpen ? (
        <BlockActionMenu
          block={block}
          onClose={onCloseActionMenu}
          onDelete={() => onDeleteBlock(block.id)}
          onSetBackgroundColor={(backgroundColor) =>
            onSetBlockColor(block.id, { backgroundColor })
          }
          onSetTextColor={(textColor) =>
            onSetBlockColor(block.id, { textColor })
          }
        />
      ) : null}
    </div>
  );
}

function NotesEditor({
  activeBoard,
  blocks,
  onChange,
  onCreateTask,
  onOpenCard,
}: NotesEditorProps) {
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tableCellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFocusIdRef = useRef<string | null>(null);
  const pendingTableCellFocusRef = useRef<{
    blockId: string;
    rowIndex: number;
    cellIndex: number;
  } | null>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>(null);
  const [actionMenu, setActionMenu] = useState<BlockActionMenuState>(null);
  const [tableCellMenu, setTableCellMenu] = useState<TableCellMenuState>(null);
  const [inlineMenu, setInlineMenu] = useState<InlineFormatMenuState>(null);
  const [activeDragBlockId, setActiveDragBlockId] = useState<string | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<NoteDropTarget>(null);
  const visibleCommands = filterBlockCommands(slashMenu?.query ?? "");
  const visibleTaskCreateTargets = isTaskCreateQuery(slashMenu?.query ?? "")
    ? getActiveTaskCreateTargets(activeBoard)
    : [];
  const visibleBlocks = useMemo(() => getVisibleBlocks(blocks), [blocks]);
  const taskItems = useMemo(() => getBoardTaskItems(activeBoard), [activeBoard]);
  const numberedListNumbers = useMemo(
    () => getNumberedListNumbers(visibleBlocks),
    [visibleBlocks],
  );

  useEffect(() => {
    const pendingFocusId = pendingFocusIdRef.current;

    if (!pendingFocusId) {
      return;
    }

    pendingFocusIdRef.current = null;
    const element = blockRefs.current.get(pendingFocusId);

    if (!element) {
      return;
    }

    element.focus();
    placeCaretAtEnd(element);
  }, [blocks]);

  useEffect(() => {
    const pendingFocus = pendingTableCellFocusRef.current;

    if (!pendingFocus) {
      return;
    }

    pendingTableCellFocusRef.current = null;
    const element = tableCellRefs.current.get(
      getTableCellKey(
        pendingFocus.blockId,
        pendingFocus.rowIndex,
        pendingFocus.cellIndex,
      ),
    );

    if (!element) {
      return;
    }

    element.focus();
    placeCaretAtEnd(element);
  }, [blocks]);

  const focusBlock = (blockId: string) => {
    pendingFocusIdRef.current = blockId;
  };

  const focusTableCell = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
  ) => {
    pendingTableCellFocusRef.current = { blockId, rowIndex, cellIndex };
  };

  const closeSlashMenu = () => setSlashMenu(null);
  const closeActionMenu = () => setActionMenu(null);
  const closeTableCellMenu = () => setTableCellMenu(null);
  const closeInlineMenu = () => setInlineMenu(null);

  const getDropTarget = (
    activeBlockId: string,
    overId: string | null,
  ): NoteDropTarget => {
    if (!overId || activeBlockId === overId) {
      return null;
    }

    const activeBlock = blocks.find((block) => block.id === activeBlockId);

    if (!activeBlock) {
      return null;
    }

    if (overId === NOTES_ROOT_DROP_ZONE_ID) {
      return activeBlock.parentId ? { type: "root" } : null;
    }

    const overBlock = blocks.find((block) => block.id === overId);

    if (!overBlock) {
      return null;
    }

    if (isDescendantBlock(overBlock, activeBlock.id, blocks)) {
      return null;
    }

    if (overBlock.type === "toggle" && activeBlock.parentId !== overBlock.id) {
      return { blockId: overBlock.id, type: "nest" };
    }

    return { blockId: overBlock.id, type: "line" };
  };

  const updateInlineMenu = (block: NoteBlock, element: HTMLElement) => {
    const selection = window.getSelection();

    if (!isSelectionInsideElement(selection, element)) {
      closeInlineMenu();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();

    if (!rect.width && !rect.height) {
      closeInlineMenu();
      return;
    }

    const menuWidth = 184;
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.left + rect.width / 2 - menuWidth / 2),
      window.innerWidth - menuWidth - margin,
    );
    const top = Math.max(margin, rect.top - 46);

    setInlineMenu({
      blockId: block.id,
      left,
      top,
      activeFormats: getActiveInlineFormats(element),
    });
  };

  const updateBlock = (blockId: string, patch: Partial<NoteBlock>) => {
    onChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    );
  };

  const syncInlineBlock = (blockId: string, element: HTMLElement) => {
    updateBlock(blockId, {
      html: getInlineHtmlFromEditable(element),
      text: getTextFromEditable(element),
    });
  };

  const applyInlineFormatToCurrentSelection = (format: InlineFormat) => {
    const blockId = inlineMenu?.blockId;
    const element = blockId ? blockRefs.current.get(blockId) : undefined;
    const block = blockId ? blocks.find((current) => current.id === blockId) : undefined;

    if (!blockId || !element || !block) {
      closeInlineMenu();
      return;
    }

    element.focus();
    applyInlineFormat(format, element);
    syncInlineBlock(blockId, element);
    updateInlineMenu(block, element);
  };

  const insertBlockAfter = (
    blockId: string,
    nextBlock: NoteBlock = createBlock(),
  ) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    const childIndexes =
      nextBlock.parentId === blockId
        ? blocks
            .map((block, blockIndex) =>
              block.parentId === blockId ? blockIndex : -1,
            )
            .filter((blockIndex) => blockIndex >= 0)
        : [];
    const insertIndex =
      childIndexes.length > 0 ? Math.max(...childIndexes) : index;
    const nextBlocks = [...blocks];

    if (nextBlock.parentId === blockId && index >= 0) {
      nextBlocks[index] = {
        ...nextBlocks[index],
        collapsed: false,
      };
    }

    nextBlocks.splice(insertIndex + 1, 0, nextBlock);
    focusBlock(nextBlock.id);
    onChange(nextBlocks);
  };

  const createContinuationBlock = (block: NoteBlock): NoteBlock => {
    if (block.type === "toggle") {
      return createBlock("paragraph", "", block.id);
    }

    if (
      block.type === "numbered" ||
      block.type === "bulleted" ||
      block.type === "quote"
    ) {
      return createBlock(block.type, "", block.parentId);
    }

    if (block.type === "todo") {
      return createBlock("todo", "", block.parentId);
    }

    return createBlock("paragraph", "", block.parentId);
  };

  const removeBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      updateBlock(blockId, {
        checked: false,
        html: undefined,
        text: "",
        type: "paragraph",
      });
      return;
    }

    const index = blocks.findIndex((block) => block.id === blockId);
    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const focusTarget = nextBlocks[Math.max(0, index - 1)];

    if (focusTarget) {
      focusBlock(focusTarget.id);
    }

    onChange(nextBlocks);
  };

  const updateTableCell = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => {
    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const tableCells = getTableCells(block);
        tableCells[rowIndex][cellIndex] = value;

        return {
          ...block,
          tableCells,
        };
      }),
    );
  };

  const applyTableCellAction = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    action: TableCellAction,
  ) => {
    closeTableCellMenu();

    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const tableCells = getTableCells(block);
        const rowCount = tableCells.length;
        const columnCount = tableCells[0]?.length ?? 1;

        if (action === "toggle-header-row") {
          focusTableCell(blockId, rowIndex, cellIndex);
          return {
            ...block,
            tableHasHeaderRow: !(block.tableHasHeaderRow ?? true),
            tableCells,
          };
        }

        if (action === "insert-row-above" || action === "insert-row-below") {
          const insertIndex =
            action === "insert-row-above" ? rowIndex : rowIndex + 1;
          const nextTableCells = [...tableCells];
          nextTableCells.splice(insertIndex, 0, Array(columnCount).fill(""));
          focusTableCell(blockId, insertIndex, cellIndex);

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (action === "delete-row") {
          if (rowCount <= 1) {
            return block;
          }

          const nextTableCells = tableCells.filter(
            (_, currentRowIndex) => currentRowIndex !== rowIndex,
          );
          focusTableCell(
            blockId,
            Math.min(rowIndex, nextTableCells.length - 1),
            Math.min(cellIndex, columnCount - 1),
          );

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (
          action === "insert-column-left" ||
          action === "insert-column-right"
        ) {
          const insertIndex =
            action === "insert-column-left" ? cellIndex : cellIndex + 1;
          const nextTableCells = tableCells.map((row) => {
            const nextRow = [...row];
            nextRow.splice(insertIndex, 0, "");
            return nextRow;
          });
          focusTableCell(blockId, rowIndex, insertIndex);

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (action === "delete-column") {
          if (columnCount <= 1) {
            return block;
          }

          const nextTableCells = tableCells.map((row) =>
            row.filter((_, currentCellIndex) => currentCellIndex !== cellIndex),
          );
          focusTableCell(
            blockId,
            rowIndex,
            Math.min(cellIndex, columnCount - 2),
          );

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        return block;
      }),
    );
  };

  const handleTableCellKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
    rowIndex: number,
    cellIndex: number,
  ) => {
    if (event.key === "Escape") {
      closeTableCellMenu();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const tableCells = getTableCells(block);
    const rowCount = tableCells.length;
    const columnCount = tableCells[0]?.length ?? 1;

    if (event.shiftKey) {
      if (rowIndex === 0 && cellIndex === 0) {
        return;
      }

      if (cellIndex > 0) {
        focusTableCell(block.id, rowIndex, cellIndex - 1);
        return;
      }

      focusTableCell(block.id, rowIndex - 1, columnCount - 1);
      return;
    }

    if (cellIndex < columnCount - 1) {
      focusTableCell(block.id, rowIndex, cellIndex + 1);
      return;
    }

    if (rowIndex < rowCount - 1) {
      focusTableCell(block.id, rowIndex + 1, 0);
      return;
    }

    applyTableCellAction(block.id, rowIndex, cellIndex, "insert-row-below");
  };

  const applyBlockCommand = (block: NoteBlock, command: BlockCommand) => {
    const element = blockRefs.current.get(block.id);
    const currentText = element ? getTextFromEditable(element) : block.text;
    const currentHtml = element
      ? getInlineHtmlFromEditable(element)
      : block.html;
    const shouldClearText =
      currentText.startsWith("/") || command.id === "divider";
    const nextText = shouldClearText ? "" : currentText;
    const nextBlocks = blocks.map((current) =>
      current.id === block.id
        ? {
            ...current,
            checked: command.id === "todo" ? false : undefined,
            collapsed: command.id === "toggle" ? false : undefined,
            html:
              shouldClearText || command.id === "table"
                ? undefined
                : currentHtml,
            tableHasHeaderRow: command.id === "table" ? true : undefined,
            tableCells:
              command.id === "table"
                ? getTableCells({ ...current, tableCells: undefined })
                : undefined,
            text: command.id === "table" ? "" : nextText,
            type: command.id,
          }
        : current,
    );

    if (element && shouldClearText) {
      clearEditableText(element);
    }

    if (command.id === "divider") {
      const index = nextBlocks.findIndex((current) => current.id === block.id);
      const nextBlock = createBlock();
      const withInserted = [...nextBlocks];
      withInserted.splice(index + 1, 0, nextBlock);
      focusBlock(nextBlock.id);
      onChange(withInserted);
      closeSlashMenu();
      return;
    }

    focusBlock(block.id);
    onChange(nextBlocks);
    closeSlashMenu();
  };

  const applyTaskLink = (block: NoteBlock, task: NoteTaskItem) => {
    const element = blockRefs.current.get(block.id);
    const nextBlocks = blocks.map((current) =>
      current.id === block.id
        ? {
            ...current,
            checked: undefined,
            collapsed: undefined,
            html: undefined,
            linkedBoardId: task.boardId,
            linkedCardId: task.card.id,
            tableCells: undefined,
            tableHasHeaderRow: undefined,
            text: task.card.title,
            type: "linked-card" as const,
          }
        : current,
    );

    if (element) {
      clearEditableText(element);
    }

    onChange(nextBlocks);
    closeSlashMenu();
    closeInlineMenu();
  };

  const applyTaskCreate = (
    block: NoteBlock,
    target: NoteTaskCreateTarget,
  ) => {
    if (target.isDisabled) {
      return;
    }

    const element = blockRefs.current.get(block.id);
    const currentText = element ? getTextFromEditable(element) : block.text;
    const taskTitle = getTaskTitleFromSlashText(currentText);
    const task = onCreateTask(target.listId, taskTitle);

    if (!task) {
      return;
    }

    applyTaskLink(block, task);
  };

  const handleShortcut = (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ): boolean => {
    if (text === "#") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading1" });
      return true;
    }

    if (text === "##") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading2" });
      return true;
    }

    if (text === "###") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading3" });
      return true;
    }

    if (text === "####") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading4" });
      return true;
    }

    if (text === "-") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "bulleted" });
      return true;
    }

    if (/^\d+\.$/.test(text)) {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "numbered" });
      return true;
    }

    if (text === "[]" || text === "[ ]") {
      clearEditableText(element);
      updateBlock(block.id, {
        checked: false,
        html: undefined,
        text: "",
        type: "todo",
      });
      return true;
    }

    if (text === ">") {
      clearEditableText(element);
      updateBlock(block.id, {
        collapsed: false,
        html: undefined,
        text: "",
        type: "toggle",
      });
      return true;
    }

    if (text === "\"") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "quote" });
      return true;
    }

    if (text === "```") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "code" });
      return true;
    }

    if (text === "---") {
      clearEditableText(element);
      const nextBlock = createBlock();
      const nextBlocks = blocks.map((current) =>
        current.id === block.id
          ? { ...current, html: undefined, text: "", type: "divider" as const }
          : current,
      );
      const index = nextBlocks.findIndex((current) => current.id === block.id);
      const withInserted = [...nextBlocks];
      withInserted.splice(index + 1, 0, nextBlock);
      focusBlock(nextBlock.id);
      onChange(withInserted);
      return true;
    }

    return false;
  };

  const handleInput = (block: NoteBlock, element: HTMLElement) => {
    const text = getTextFromEditable(element);
    updateBlock(block.id, {
      html: getInlineHtmlFromEditable(element),
      text,
    });

    if (text.startsWith("/")) {
      setSlashMenu({
        blockId: block.id,
        query: text.slice(1),
      });
      closeActionMenu();
      closeTableCellMenu();
      closeInlineMenu();
      return;
    }

    if (slashMenu?.blockId === block.id) {
      closeSlashMenu();
    }
  };

  const shouldParseMarkdownPaste = (text: string): boolean => {
    const trimmed = text.trim();

    if (!trimmed) {
      return false;
    }

    return (
      trimmed.includes("\n") ||
      /^(#{1,4}\s|-\s|- \[[ xX]\]\s|\d+\.\s|>\s|```|---$|\|.+\|$)/.test(
        trimmed,
      )
    );
  };

  const handleMarkdownPaste = (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ): boolean => {
    if (block.type === "code" || !shouldParseMarkdownPaste(text)) {
      return false;
    }

    const pastedBlocks = parseMarkdownBlocks(text).map((pastedBlock) => ({
      ...pastedBlock,
      boardId: block.boardId,
      parentId: pastedBlock.parentId ?? block.parentId,
    }));

    if (pastedBlocks.length === 0) {
      return false;
    }

    const currentText = getTextFromEditable(element).trim();
    const blockIndex = blocks.findIndex((current) => current.id === block.id);

    if (blockIndex < 0) {
      return false;
    }

    closeSlashMenu();
    closeActionMenu();
    closeTableCellMenu();
    closeInlineMenu();

    if (!currentText || currentText === "/") {
      const [firstPastedBlock, ...restPastedBlocks] = pastedBlocks;

      if (!firstPastedBlock) {
        return false;
      }

      const nextBlocks = [...blocks];
      nextBlocks[blockIndex] = {
        ...firstPastedBlock,
        id: block.id,
        parentId: block.parentId,
      };
      nextBlocks.splice(blockIndex + 1, 0, ...restPastedBlocks);
      clearEditableText(element);
      focusBlock(restPastedBlocks.at(-1)?.id ?? block.id);
      onChange(nextBlocks);
      return true;
    }

    const nextBlocks = [...blocks];
    nextBlocks.splice(blockIndex + 1, 0, ...pastedBlocks);
    focusBlock(pastedBlocks.at(-1)?.id ?? block.id);
    onChange(nextBlocks);
    return true;
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
  ) => {
    const text = getTextFromEditable(event.currentTarget);
    const isCurrentMenuOpen = slashMenu?.blockId === block.id;
    const inlineShortcut = getInlineFormatShortcut(event);

    if (inlineShortcut && block.type !== "code") {
      event.preventDefault();
      applyInlineFormat(inlineShortcut, event.currentTarget);
      syncInlineBlock(block.id, event.currentTarget);
      updateInlineMenu(block, event.currentTarget);
      return;
    }

    if (event.key === "Escape" && inlineMenu?.blockId === block.id) {
      event.preventDefault();
      closeInlineMenu();
      return;
    }

    if (event.key === "Escape" && isCurrentMenuOpen) {
      event.preventDefault();
      closeSlashMenu();
      closeInlineMenu();
      return;
    }

    if (event.key === "Enter" && isCurrentMenuOpen) {
      const taskCreateTarget = visibleTaskCreateTargets.find(
        (target) => !target.isDisabled,
      );

      if (taskCreateTarget) {
        event.preventDefault();
        applyTaskCreate(block, taskCreateTarget);
        return;
      }

      const command = visibleCommands[0];

      if (command) {
        event.preventDefault();
        applyBlockCommand(block, command);
        return;
      }
    }

    if (event.key === " " && handleShortcut(block, text, event.currentTarget)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const element = event.currentTarget;
      insertSoftBreakAtCaret();
      window.requestAnimationFrame(() => {
        updateBlock(block.id, {
          text: getTextFromEditable(element),
        });
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        !text &&
        (block.type === "numbered" ||
          block.type === "bulleted" ||
          block.type === "todo" ||
          block.type === "quote")
      ) {
        updateBlock(block.id, {
          checked: false,
          html: undefined,
          text: "",
          type: "paragraph",
        });
        return;
      }

      if (text === "---") {
        const nextBlock = createBlock();
        const nextBlocks = blocks.map((current) =>
          current.id === block.id
            ? { ...current, html: undefined, text: "", type: "divider" as const }
            : current,
        );
        const index = nextBlocks.findIndex(
          (current) => current.id === block.id,
        );
        const withInserted = [...nextBlocks];
        withInserted.splice(index + 1, 0, nextBlock);
        focusBlock(nextBlock.id);
        onChange(withInserted);
        return;
      }

      insertBlockAfter(block.id, createContinuationBlock(block));
      return;
    }

    if (event.key === "Backspace" && !text && block.type !== "paragraph") {
      event.preventDefault();
      updateBlock(block.id, {
        checked: false,
        html: undefined,
        text: "",
        type: "paragraph",
      });
      return;
    }

    if (event.key === "Backspace" && !text) {
      event.preventDefault();
      removeBlock(block.id);
    }
  };

  const resetDragState = () => {
    setActiveDragBlockId(null);
    setDropTarget(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragBlockId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setDropTarget(getDropTarget(activeId, overId));
  };

  const handleDragCancel = () => {
    resetDragState();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const target = getDropTarget(activeId, overId);
    resetDragState();

    if (!overId || activeId === overId || !target) {
      return;
    }

    closeSlashMenu();
    closeActionMenu();
    closeTableCellMenu();
    closeInlineMenu();

    const activeBlock = blocks.find((block) => block.id === activeId);
    const overBlock = blocks.find((block) => block.id === overId);
    const oldIndex = blocks.findIndex((block) => block.id === activeId);
    const newIndex = blocks.findIndex((block) => block.id === overId);

    if (!activeBlock || !overBlock || oldIndex < 0 || newIndex < 0) {
      if (target.type === "root" && activeBlock && oldIndex >= 0) {
        const withoutActive = blocks.filter((block) => block.id !== activeId);
        const lastRootIndex = withoutActive.reduce(
          (lastIndex, block, index) => (!block.parentId ? index : lastIndex),
          -1,
        );
        const movedBlock = { ...activeBlock, parentId: undefined };
        const nextBlocks = [...withoutActive];
        nextBlocks.splice(lastRootIndex + 1, 0, movedBlock);
        onChange(nextBlocks);
      }

      return;
    }

    if (target.type === "root") {
      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const lastRootIndex = withoutActive.reduce(
        (lastIndex, block, index) => (!block.parentId ? index : lastIndex),
        -1,
      );
      const movedBlock = {
        ...activeBlock,
        parentId: undefined,
      };
      const nextBlocks = [...withoutActive];
      nextBlocks.splice(lastRootIndex + 1, 0, movedBlock);
      onChange(nextBlocks);
      return;
    }

    if (
      target.type === "nest" &&
      overBlock.type === "toggle" &&
      activeBlock.parentId !== overBlock.id
    ) {
      if (overBlock.parentId === activeBlock.id) {
        return;
      }

      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const toggleIndex = withoutActive.findIndex(
        (block) => block.id === overBlock.id,
      );
      const childIndexes = withoutActive
        .map((block, index) => (block.parentId === overBlock.id ? index : -1))
        .filter((index) => index >= 0);
      const insertIndex =
        childIndexes.length > 0 ? Math.max(...childIndexes) : toggleIndex;
      const movedBlock = {
        ...activeBlock,
        parentId: overBlock.id,
      };
      const nextBlocks = withoutActive.map((block) =>
        block.id === overBlock.id ? { ...block, collapsed: false } : block,
      );
      nextBlocks.splice(insertIndex + 1, 0, movedBlock);
      onChange(nextBlocks);
      return;
    }

    if (activeBlock.parentId !== overBlock.parentId) {
      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const targetIndex = withoutActive.findIndex(
        (block) => block.id === overBlock.id,
      );

      if (targetIndex < 0) {
        return;
      }

      withoutActive.splice(targetIndex, 0, {
        ...activeBlock,
        parentId: overBlock.parentId,
      });
      onChange(withoutActive);
      return;
    }

    onChange(arrayMove([...blocks], oldIndex, newIndex));
  };
  const lastBlock = visibleBlocks[visibleBlocks.length - 1];
  const activeDragBlock = activeDragBlockId
    ? blocks.find((block) => block.id === activeDragBlockId)
    : undefined;
  const isDraggingNestedBlock = Boolean(activeDragBlock?.parentId);

  return (
    <div className="mx-auto min-h-full w-full max-w-3xl px-4 py-8 sm:px-8">
      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={visibleBlocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            <RootDropZone isDraggingNestedBlock={isDraggingNestedBlock} />
            {visibleBlocks.map((block) => (
              <SortableNoteBlock
                key={block.id}
                block={block}
                dropIntent={
                  dropTarget?.type !== "root" && dropTarget?.blockId === block.id
                    ? dropTarget
                    : null
                }
                isNested={Boolean(block.parentId)}
                isActionMenuOpen={actionMenu?.blockId === block.id}
                isSlashMenuOpen={slashMenu?.blockId === block.id}
                openTableCellMenu={tableCellMenu}
                menuCommands={visibleCommands}
                numberedListNumber={numberedListNumbers.get(block.id)}
                showTaskCreateSection={isTaskCreateQuery(slashMenu?.query ?? "")}
                taskCreateTargets={visibleTaskCreateTargets}
                taskItems={taskItems}
                onBlur={(currentBlock, element) =>
                  updateBlock(currentBlock.id, {
                    html: getInlineHtmlFromEditable(element),
                    text: getTextFromEditable(element),
                  })
                }
                onCloseActionMenu={closeActionMenu}
                onCloseSlashMenu={closeSlashMenu}
                onCloseTableCellMenu={closeTableCellMenu}
                onDeleteBlock={removeBlock}
                onInput={handleInput}
                onInsertAfter={insertBlockAfter}
                onKeyDown={handleKeyDown}
                onPasteMarkdown={handleMarkdownPaste}
                onOpenActionMenu={(blockId) => {
                  closeSlashMenu();
                  closeTableCellMenu();
                  closeInlineMenu();
                  setActionMenu({ blockId });
                }}
                onOpenTableCellMenu={(blockId, rowIndex, cellIndex) => {
                  closeSlashMenu();
                  closeActionMenu();
                  closeInlineMenu();
                  setTableCellMenu({ blockId, rowIndex, cellIndex });
                }}
                onRegisterElement={(blockId, element) => {
                  if (element) {
                    blockRefs.current.set(blockId, element);
                  } else {
                    blockRefs.current.delete(blockId);
                  }
                }}
                onRegisterTableCell={(blockId, rowIndex, cellIndex, element) => {
                  const key = getTableCellKey(blockId, rowIndex, cellIndex);

                  if (element) {
                    tableCellRefs.current.set(key, element);
                  } else {
                    tableCellRefs.current.delete(key);
                  }
                }}
                onSetBlockColor={(blockId, patch) =>
                  updateBlock(blockId, patch)
                }
                onCreateTask={applyTaskCreate}
                onSelectionChange={(currentBlock, element) => {
                  if (currentBlock.type === "code") {
                    closeInlineMenu();
                    return;
                  }

                  updateInlineMenu(currentBlock, element);
                }}
                onSelectCommand={applyBlockCommand}
                onSelectTask={applyTaskLink}
                onOpenLinkedCard={(currentBlock) => {
                  if (currentBlock.linkedCardId) {
                    onOpenCard(currentBlock.linkedCardId);
                  }
                }}
                onTableCellAction={applyTableCellAction}
                onTableCellKeyDown={handleTableCellKeyDown}
                onToggleCollapsed={(currentBlock) =>
                  updateBlock(currentBlock.id, {
                    collapsed: !currentBlock.collapsed,
                  })
                }
                onToggleTodo={(currentBlock) =>
                  updateBlock(currentBlock.id, {
                    checked: !currentBlock.checked,
                  })
                }
                onUpdateTableCell={updateTableCell}
              />
            ))}
            {lastBlock ? (
              <button
                className="ml-[6.5rem] mt-2 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-muted transition hover:bg-white/8 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onClick={() => insertBlockAfter(lastBlock.id)}
              >
                <Plus aria-hidden="true" size={16} />
                Новая строка
              </button>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>
      <InlineFormatBubble
        menu={inlineMenu}
        onFormat={applyInlineFormatToCurrentSelection}
      />
    </div>
  );
}

type NoteSnapshot = Readonly<Pick<Note, "blocks" | "title">>;

type NoteHistoryState = Readonly<{
  future: NoteSnapshot[];
  noteId: string | null;
  past: NoteSnapshot[];
}>;

function NoteSwitcher({
  activeNote,
  isOpen,
  notes,
  onDelete,
  onOpenChange,
  onSelect,
}: Readonly<{
  activeNote: Note;
  isOpen: boolean;
  notes: readonly Note[];
  onDelete: (noteId: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (noteId: string) => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={menuRef} className="relative min-w-0 flex-1">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-control/45 px-3 text-left text-text transition hover:border-white/20 hover:bg-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "border-accent/55 ring-2 ring-accent/20",
        )}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
      >
        <FileText
          aria-hidden="true"
          className="hidden shrink-0 text-accent sm:block"
          size={17}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {activeNote.title || "Без названия"}
          </span>
          <span className="block truncate text-xs text-text-muted">
            {new Date(activeNote.updatedAt).toLocaleDateString("ru-RU")}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "shrink-0 text-text-muted transition",
            isOpen && "rotate-180 text-text",
          )}
          size={17}
        />
      </button>

      {isOpen ? (
        <div
          aria-label="Заметки"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-70 overflow-hidden rounded-2xl border border-white/10 bg-panel/98 p-2 shadow-2xl backdrop-blur-xl"
          role="menu"
        >
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Заметки
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {notes.length} заметок
              </p>
            </div>
          </div>

          <div className="max-h-[15rem] overflow-y-auto px-1 py-1">
            {notes.map((note) => {
              const isActive = note.id === activeNote.id;

              return (
                <div
                  key={note.id}
                  className={cn(
                    "group flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 transition",
                    isActive
                      ? "bg-accent/15 text-text"
                      : "text-text-muted hover:bg-control hover:text-text",
                  )}
                  role="none"
                >
                  <button
                    aria-current={isActive ? "page" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      onSelect(note.id);
                      onOpenChange(false);
                    }}
                  >
                    <FileText
                      aria-hidden="true"
                      className="shrink-0"
                      size={17}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {note.title || "Без названия"}
                      </span>
                      <span className="block truncate text-xs opacity-70">
                        {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                      </span>
                    </span>
                  </button>
                  {isActive ? (
                    <Check
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                      size={16}
                    />
                  ) : null}
                  <button
                    aria-label={`Удалить заметку ${note.title || "Без названия"}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted opacity-70 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
                    type="button"
                    onClick={() => {
                      onDelete(note.id);
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function cloneNoteBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({
    ...block,
    tableCells: block.tableCells?.map((row) => [...row]),
  }));
}

function createNoteSnapshot(note: Note): NoteSnapshot {
  return {
    blocks: cloneNoteBlocks(note.blocks),
    title: note.title,
  };
}

function areNoteSnapshotsEqual(
  first: NoteSnapshot,
  second: NoteSnapshot,
): boolean {
  return (
    first.title === second.title &&
    JSON.stringify(first.blocks) === JSON.stringify(second.blocks)
  );
}

export function NotesPage() {
  const router = useRouter();
  const {
    workspace,
    activeBoard,
    isReady,
    persistenceState,
    storageError,
    workspaceStorage,
    createProject,
    deleteProject,
    selectProject,
    updateActiveBoard,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isNotesDataOpen, setIsNotesDataOpen] = useState(false);
  const [isNotesReady, setIsNotesReady] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [isNoteSwitcherOpen, setIsNoteSwitcherOpen] = useState(false);
  const noteHistoryRef = useRef<NoteHistoryState>({
    future: [],
    noteId: null,
    past: [],
  });
  const [historyCapabilities, setHistoryCapabilities] = useState({
    canRedo: false,
    canUndo: false,
    noteId: null as string | null,
  });
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const activeBoardId = activeBoard?.id ?? null;
  const boardNotes = useMemo(
    () =>
      activeBoardId
        ? notes.filter((note) => note.boardId === activeBoardId)
        : [],
    [activeBoardId, notes],
  );
  const activeNote = useMemo(
    () => boardNotes.find((note) => note.id === activeNoteId) ?? boardNotes[0],
    [activeNoteId, boardNotes],
  );
  const filteredBoardNotes = useMemo(() => {
    const query = noteSearchQuery.trim().toLocaleLowerCase("ru-RU");

    if (!query) {
      return boardNotes;
    }

    return boardNotes.filter((note) => getNoteSearchText(note).includes(query));
  }, [boardNotes, noteSearchQuery]);
  const deleteNote = deleteNoteId
    ? notes.find((note) => note.id === deleteNoteId)
    : undefined;
  const bumpHistoryVersion = useCallback(() => {
    const history = noteHistoryRef.current;

    setHistoryCapabilities({
      canRedo: history.future.length > 0,
      canUndo: history.past.length > 0,
      noteId: history.noteId,
    });
  }, []);
  const applyNoteSnapshot = useCallback((noteId: string, snapshot: NoteSnapshot) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              blocks: cloneNoteBlocks(snapshot.blocks),
              title: snapshot.title,
              updatedAt: Date.now(),
            }
          : note,
      ),
    );
  }, []);
  const recordActiveNoteHistory = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const snapshot = createNoteSnapshot(activeNote);
    const history = noteHistoryRef.current;
    const past = history.noteId === activeNote.id ? history.past : [];
    const lastSnapshot = past.at(-1);

    if (lastSnapshot && areNoteSnapshotsEqual(lastSnapshot, snapshot)) {
      return;
    }

    noteHistoryRef.current = {
      future: [],
      noteId: activeNote.id,
      past: [...past, snapshot].slice(-50),
    };
    bumpHistoryVersion();
  }, [activeNote, bumpHistoryVersion]);
  const undoActiveNote = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const history = noteHistoryRef.current;
    const previousSnapshot = history.past.at(-1);

    if (history.noteId !== activeNote.id || !previousSnapshot) {
      return;
    }

    noteHistoryRef.current = {
      future: [createNoteSnapshot(activeNote), ...history.future].slice(0, 50),
      noteId: activeNote.id,
      past: history.past.slice(0, -1),
    };
    applyNoteSnapshot(activeNote.id, previousSnapshot);
    bumpHistoryVersion();
  }, [activeNote, applyNoteSnapshot, bumpHistoryVersion]);
  const redoActiveNote = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const history = noteHistoryRef.current;
    const nextSnapshot = history.future[0];

    if (history.noteId !== activeNote.id || !nextSnapshot) {
      return;
    }

    noteHistoryRef.current = {
      future: history.future.slice(1),
      noteId: activeNote.id,
      past: [...history.past, createNoteSnapshot(activeNote)].slice(-50),
    };
    applyNoteSnapshot(activeNote.id, nextSnapshot);
    bumpHistoryVersion();
  }, [activeNote, applyNoteSnapshot, bumpHistoryVersion]);

  useEffect(() => {
    const handleHistoryShortcut = (event: globalThis.KeyboardEvent) => {
      if (deleteNoteId || isCommandPaletteOpen || isNotesDataOpen) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        redoActiveNote();
        return;
      }

      undoActiveNote();
    };

    window.addEventListener("keydown", handleHistoryShortcut);

    return () => {
      window.removeEventListener("keydown", handleHistoryShortcut);
    };
  }, [
    deleteNoteId,
    isCommandPaletteOpen,
    isNotesDataOpen,
    redoActiveNote,
    undoActiveNote,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const loadedNotes = loadNotes();
      const requestedNoteId = new URLSearchParams(window.location.search).get(
        "note",
      );
      setNotes(loadedNotes);
      setActiveNoteId(requestedNoteId ?? loadedNotes[0]?.id ?? null);
      setIsNotesReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isNotesReady) {
      return;
    }

    saveNotes(notes);
  }, [isNotesReady, notes]);

  useEffect(() => {
    if (!isNotesReady || !workspace || !activeBoard) {
      return;
    }

    const hasUnscopedNotes = notes.some((note) => !note.boardId);

    if (!hasUnscopedNotes) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotes((currentNotes) =>
        currentNotes.map((note) => {
          if (note.boardId) {
            return note;
          }

          const titleMatch = workspace.boards.find(
            (board) =>
              board.title.trim().toLowerCase() ===
              note.title.trim().toLowerCase(),
          );

          return {
            ...note,
            boardId: titleMatch?.id ?? activeBoard.id,
          };
        }),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeBoard, isNotesReady, notes, workspace]);

  useEffect(() => {
    if (!isNotesReady || !activeBoard) {
      return;
    }

    if (boardNotes.length === 0) {
      const timeoutId = window.setTimeout(() => {
        const note = createNote(activeBoard.id);
        setNotes((currentNotes) => [note, ...currentNotes]);
        setActiveNoteId(note.id);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!activeNoteId || !boardNotes.some((note) => note.id === activeNoteId)) {
      const timeoutId = window.setTimeout(() => {
        setActiveNoteId(boardNotes[0]?.id ?? null);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [activeBoard, activeNoteId, boardNotes, isNotesReady]);

  if (!isReady || !workspace || !activeBoard || !isNotesReady || !activeNote) {
    return <NotesLoadingState />;
  }

  const statusLabel =
    persistenceState === "saving"
      ? "Сохраняем…"
      : persistenceState === "error"
        ? "Ошибка сохранения"
        : workspaceStorage.kind === "folder" && workspaceStorage.isConnected
          ? `Сохранено в папку: ${workspaceStorage.name}`
          : workspaceStorage.kind === "folder"
            ? "Требуется доступ к папке"
            : "Сохранено в браузере";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };
  const selectProjectFromHeader = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
  };
  const createProjectFromHeader = (title: string, templateId?: Parameters<typeof createProject>[1]) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      selectProjectFromHeader(createdBoardId);
    }
  };
  const deleteProjectFromHeader = (boardId: string) => {
    deleteProject(boardId);
    setIsProjectsOpen(false);
  };

  const patchActiveNote = (patch: Partial<Pick<Note, "blocks" | "title">>) => {
    recordActiveNoteHistory();
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === activeNote.id
          ? { ...note, boardId: activeBoard.id, ...patch, updatedAt: Date.now() }
          : note,
      ),
    );
  };

  const addNote = () => {
    const note = createNote(activeBoard.id);
    setNotes((currentNotes) => [note, ...currentNotes]);
    setActiveNoteId(note.id);
  };

  const createTaskFromNote = (
    listId: string,
    title: string,
  ): NoteTaskItem | null => {
    let createdTask: NoteTaskItem | null = null;

    updateActiveBoard((board) => {
      const previousList = board.lists[listId];

      if (!previousList || previousList.isArchived) {
        return board;
      }

      const nextBoard = addCard(board, listId, title);
      const nextList = nextBoard.lists[listId];

      if (nextBoard === board || !nextList) {
        return board;
      }

      const card = getCreatedCardFromListDiff(
        previousList,
        nextList,
        nextBoard.cards,
      );

      if (card) {
        createdTask = {
          boardId: nextBoard.id,
          boardTitle: nextBoard.title,
          card,
          listTitle: nextList.title,
        };
      }

      return nextBoard;
    }, "immediate");

    return createdTask;
  };
  const commandActions = [
    ...getWorkspaceNavigationActions({
      onOpenAnalytics: () => router.push(ANALYTICS_ROUTE),
      onOpenBoard: () => openBoard(activeBoard.id),
      onOpenCalendar: () => router.push(CALENDAR_ROUTE),
      onOpenMyWork: () => router.push(MY_WORK_ROUTE),
      onOpenNotes: () => router.push(NOTES_ROUTE),
    }),
    {
      id: "notes-new-note",
      label: "Новая заметка",
      description: "Создать заметку в активной доске",
      shortcut: "N",
      icon: <Plus aria-hidden="true" size={18} />,
      onSelect: addNote,
    },
    ...boardNotes.map((note) => ({
      id: `note-${note.id}`,
      label: note.title || "Без названия",
      description: `Заметка · ${new Date(note.updatedAt).toLocaleDateString("ru-RU")}`,
      icon: <FileText aria-hidden="true" size={18} />,
      onSelect: () => setActiveNoteId(note.id),
    })),
  ];
  const canUndoNote =
    historyCapabilities.noteId === activeNote.id && historyCapabilities.canUndo;
  const canRedoNote =
    historyCapabilities.noteId === activeNote.id && historyCapabilities.canRedo;

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="notes"
        canRedo={canRedoNote}
        canUndo={canUndoNote}
        dataToolsGroupLabel="Заметки"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onOpenCommands={openCommandPalette}
        onOpenMyWork={() => router.push(MY_WORK_ROUTE)}
        onOpenNotes={() => router.push(NOTES_ROUTE)}
        onOpenWorkspaceData={() => setIsNotesDataOpen(true)}
        onRedo={redoActiveNote}
        showProjectsButton={false}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
        onUndo={undoActiveNote}
        workspaceDataLabel="Backup заметок"
      >
        <ProjectSwitcher
          activeBoard={activeBoard}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onCreateBoard={createProjectFromHeader}
          onDeleteBoard={deleteProjectFromHeader}
          onOpenChange={setIsProjectsOpen}
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          {storageError ? (
            <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <p>{storageError}</p>
              </div>
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="hidden min-h-0 border-r border-white/10 bg-panel/72 p-3 lg:block">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-text">Notes</h2>
                <Button size="sm" onClick={addNote}>
                  <Plus aria-hidden="true" size={16} />
                  Новая
                </Button>
              </div>

              <label className="relative mt-3 block">
                <span className="sr-only">Поиск заметок</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={15}
                />
                <TextField
                  className="h-10 rounded-lg pl-9"
                  placeholder="Поиск заметок"
                  value={noteSearchQuery}
                  onChange={(event) =>
                    setNoteSearchQuery(event.currentTarget.value)
                  }
                />
              </label>

              <div className="mt-3 max-h-[15rem] space-y-1 overflow-y-auto lg:max-h-[calc(100dvh-12rem)]">
                {filteredBoardNotes.length > 0 ? (
                  filteredBoardNotes.map((note) => {
                    const isActive = activeNote.id === note.id;

                    return (
                    <div
                      key={note.id}
                      className={cn(
                        "group flex min-h-14 w-full items-center gap-2 rounded-lg px-3 py-2 transition",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-text-muted hover:bg-control hover:text-text",
                      )}
                      role="none"
                    >
                      <button
                        aria-current={isActive ? "page" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                        type="button"
                        onClick={() => setActiveNoteId(note.id)}
                      >
                        <FileText
                          aria-hidden="true"
                          className="shrink-0"
                          size={17}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {note.title || "Без названия"}
                          </span>
                          <span className="block truncate text-xs opacity-75">
                            {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                          </span>
                        </span>
                      </button>
                      {isActive ? (
                        <Check
                          aria-hidden="true"
                          className={cn(
                            "shrink-0",
                            isActive ? "text-accent-foreground" : "text-accent",
                          )}
                          size={16}
                        />
                      ) : null}
                      <button
                        aria-label={`Удалить заметку ${note.title || "Без названия"}`}
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40 lg:opacity-0 lg:group-hover:opacity-100",
                          isActive
                            ? "text-accent-foreground/75 hover:bg-black/10 hover:text-accent-foreground"
                            : "text-text-muted hover:bg-red-500/15 hover:text-red-300",
                        )}
                        type="button"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-white/12 px-3 py-5 text-center text-sm text-text-muted">
                    Ничего не найдено.
                  </p>
                )}
              </div>
            </aside>

            <section className="min-h-0 overflow-y-auto">
              <div className="border-b border-white/10 bg-panel/70 px-4 py-3 lg:hidden">
                <div className="flex items-center gap-2">
                  <NoteSwitcher
                    activeNote={activeNote}
                    isOpen={isNoteSwitcherOpen}
                    notes={boardNotes}
                    onDelete={setDeleteNoteId}
                    onOpenChange={setIsNoteSwitcherOpen}
                    onSelect={setActiveNoteId}
                  />
                  <Button size="sm" onClick={addNote}>
                    <Plus aria-hidden="true" size={16} />
                    Новая
                  </Button>
                </div>
              </div>
              <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-8">
                <div className="flex items-start gap-2">
                  <TextField
                    aria-label="Название заметки"
                    className="h-auto border-0 bg-transparent px-0 py-1 text-4xl font-semibold leading-tight text-text shadow-none focus:border-0"
                    value={activeNote.title}
                    onChange={(event) =>
                      patchActiveNote({ title: event.currentTarget.value })
                    }
                    onBlur={(event) =>
                      patchActiveNote({
                        title:
                          event.currentTarget.value.trim() || "Без названия",
                      })
                    }
                  />
                </div>
              </div>

              <NotesEditor
                activeBoard={activeBoard}
                blocks={activeNote.blocks}
                onChange={(blocks) => patchActiveNote({ blocks })}
                onCreateTask={createTaskFromNote}
                onOpenCard={(cardId) => {
                  selectProject(activeBoard.id);
                  router.push(getBoardRoute(activeBoard.id, cardId));
                }}
              />
            </section>
          </div>
        </section>
      </div>

      <ConfirmDialog
        confirmLabel="Удалить заметку"
        description={
          deleteNote
            ? `Заметка «${deleteNote.title || "Без названия"}» будет удалена.`
            : "Заметка будет удалена."
        }
        destructive
        isOpen={Boolean(deleteNoteId)}
        title="Удалить заметку?"
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={() => {
          if (deleteNoteId) {
            setNotes((currentNotes) => {
              const nextNotes = currentNotes.filter(
                (note) => note.id !== deleteNoteId,
              );
              const nextBoardNotes = nextNotes.filter(
                (note) => note.boardId === activeBoard.id,
              );

              if (nextBoardNotes.length > 0) {
                setActiveNoteId(nextBoardNotes[0]?.id ?? null);
                return nextNotes;
              }

              const fallbackNote = createNote(activeBoard.id);
              setActiveNoteId(fallbackNote.id);
              return [fallbackNote, ...nextNotes];
            });
          }
          setDeleteNoteId(null);
        }}
      />

      <NotesDataModal
        activeNote={activeNote}
        isOpen={isNotesDataOpen}
        notes={boardNotes}
        onClose={() => setIsNotesDataOpen(false)}
        onReplaceNotes={(nextNotes) => {
          const scopedNotes = nextNotes.map((note) => ({
            ...note,
            boardId: activeBoard.id,
          }));
          setNotes((currentNotes) => [
            ...scopedNotes,
            ...currentNotes.filter((note) => note.boardId !== activeBoard.id),
          ]);
          setActiveNoteId(scopedNotes[0]?.id ?? null);
        }}
      />
      <CommandPalette
        actions={commandActions}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </main>
  );
}
