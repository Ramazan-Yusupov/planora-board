import { updateElement } from "@/modules/draw-tool/entities/element";
import type { TableElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";

function normalizeDimension(value: number) {
  return Math.max(1, Math.min(24, Math.round(value)));
}

function resizeCells(table: TableElement, rows: number, columns: number) {
  const cells = Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const priorIndex = row * table.columns + column;
    return table.cells[priorIndex] ?? (row === 0 ? `Заголовок ${column + 1}` : "");
  });
  return cells;
}

export function updateTableStructure(tableId: string, rows: number, columns: number) {
  const current = sceneStore.get().elements.find((element) => element.id === tableId);
  if (!current || current.type !== "table") return false;
  const nextRows = normalizeDimension(rows);
  const nextColumns = normalizeDimension(columns);
  if (current.rows === nextRows && current.columns === nextColumns) return false;
  historyStore.begin();
  sceneStore.updateById(tableId, (element) => element.type === "table"
    ? updateElement(element, { rows: nextRows, columns: nextColumns, cells: resizeCells(element, nextRows, nextColumns) })
    : element);
  return historyStore.commit();
}

export function updateTableCell(tableId: string, cellIndex: number, value: string) {
  const current = sceneStore.get().elements.find((element) => element.id === tableId);
  if (!current || current.type !== "table" || current.cells[cellIndex] === value) return false;
  const cells = [...current.cells];
  cells[cellIndex] = value;
  historyStore.begin();
  sceneStore.updateById(tableId, (element) => element.type === "table" ? updateElement(element, { cells }) : element);
  return historyStore.commit();
}

export function updateTableFontSize(tableId: string, fontSize: number) {
  const current = sceneStore.get().elements.find((element) => element.id === tableId);
  if (!current || current.type !== "table" || current.fontSize === fontSize) return false;
  historyStore.begin();
  sceneStore.updateById(tableId, (element) =>
    element.type === "table" ? updateElement(element, { fontSize }) : element,
  );
  return historyStore.commit();
}

