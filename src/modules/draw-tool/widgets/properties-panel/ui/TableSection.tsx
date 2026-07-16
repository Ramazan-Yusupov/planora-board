import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import type { TableElement } from "@/modules/draw-tool/entities/element";
import { NumberField } from "@/modules/draw-tool/shared/ui";

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
  const cells = useMemo(() => table.cells.map((cell, index) => ({ value: index, label: `Ячейка ${Math.floor(index / table.columns) + 1}:${(index % table.columns) + 1}${cell ? ` — ${cell.slice(0, 18)}` : ""}` })), [table.cells, table.columns]);
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text"><Table2 size={16} /> Таблица</div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Строки" max={24} min={1} onChange={(rows) => onChangeStructure(rows, table.columns)} step={1} value={table.rows} />
        <NumberField label="Столбцы" max={24} min={1} onChange={(columns) => onChangeStructure(table.rows, columns)} step={1} value={table.columns} />
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
        <select className="h-9 rounded-md border border-border bg-control px-2 text-xs text-text outline-none focus:border-accent" onChange={(event) => setCellIndex(Number(event.currentTarget.value))} value={safeCellIndex}>
          {cells.map((cell) => <option key={cell.value} value={cell.value}>{cell.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-text-muted">
        Содержимое
        <textarea className="min-h-18 rounded-md border border-border bg-control p-2 text-xs text-text outline-none focus:border-accent" onBlur={(event) => onChangeCell(safeCellIndex, event.currentTarget.value)} defaultValue={table.cells[safeCellIndex] ?? ""} key={`${table.id}-${safeCellIndex}-${table.cells[safeCellIndex] ?? ""}`} />
      </label>
    </section>
  );
}

