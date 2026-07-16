import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import type { TableElement } from "@/modules/draw-tool/entities/element";
import { NumberField } from "@/modules/draw-tool/shared/ui";
import { Select } from "@/shared/ui";

type TableSectionProps = {
  table: TableElement;
  onChangeCell: (index: number, value: string) => void;
  onChangeFontSize: (fontSize: number) => void;
  onChangeStructure: (rows: number, columns: number) => void;
};

export function TableSection({
  table,
  onChangeCell,
  onChangeFontSize,
  onChangeStructure,
}: TableSectionProps) {
  const [cellIndex, setCellIndex] = useState(0);
  const safeCellIndex = Math.min(cellIndex, table.cells.length - 1);
  const cells = useMemo(
    () =>
      table.cells.map((cell, index) => ({
        label: `Ячейка ${Math.floor(index / table.columns) + 1}:${
          (index % table.columns) + 1
        }${cell ? ` - ${cell.slice(0, 18)}` : ""}`,
        value: index,
      })),
    [table.cells, table.columns],
  );
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Table2 size={16} /> Таблица
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Строки"
          max={24}
          min={1}
          step={1}
          value={table.rows}
          onChange={(rows) => onChangeStructure(rows, table.columns)}
        />
        <NumberField
          label="Столбцы"
          max={24}
          min={1}
          step={1}
          value={table.columns}
          onChange={(columns) => onChangeStructure(table.rows, columns)}
        />
      </div>
      <NumberField
        label="Размер текста"
        max={36}
        min={8}
        onChange={onChangeFontSize}
        step={1}
        suffix="px"
        value={table.fontSize}
      />
      <label className="grid gap-1 text-xs font-medium text-text-muted">
        Ячейка
        <Select
          className="h-9 rounded-md text-xs"
          value={String(safeCellIndex)}
          onChange={(event) => setCellIndex(Number(event.currentTarget.value))}
        >
          {cells.map((cell) => (
            <option key={cell.value} value={cell.value}>
              {cell.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-text-muted">
        Содержимое
        <textarea
          key={`${table.id}-${safeCellIndex}-${table.cells[safeCellIndex] ?? ""}`}
          className="min-h-18 rounded-md border border-border bg-control p-2 text-xs text-text outline-none focus:border-accent"
          defaultValue={table.cells[safeCellIndex] ?? ""}
          onBlur={(event) =>
            onChangeCell(safeCellIndex, event.currentTarget.value)
          }
        />
      </label>
    </section>
  );
}

