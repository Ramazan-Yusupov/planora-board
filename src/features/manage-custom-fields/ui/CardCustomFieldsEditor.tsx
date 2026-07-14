"use client";

import { Rows3, X } from "lucide-react";

import type { BoardCardCustomField } from "@/entities/board";
import { Button, Panel, TextField } from "@/shared/ui";

type CardCustomFieldsEditorProps = Readonly<{
  fields: readonly BoardCardCustomField[];
  onChange: (fields: BoardCardCustomField[]) => void;
}>;

export function CardCustomFieldsEditor({
  fields,
  onChange,
}: CardCustomFieldsEditorProps) {
  const updateValue = (fieldId: string, value: string) => {
    onChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, value, updatedAt: Date.now() } : field,
      ),
    );
  };

  const removeField = (fieldId: string) => {
    onChange(fields.filter((field) => field.id !== fieldId));
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <Panel>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
        <Rows3 aria-hidden="true" size={17} />
        Дополнительные поля
      </h3>
      <div className="mt-3 grid gap-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="grid gap-2 rounded-xl border border-white/8 bg-control/30 p-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]"
          >
            <div className="min-h-10 min-w-0 rounded-xl border border-white/8 bg-panel/45 px-3 py-2 text-sm font-medium text-text">
              <span className="block truncate" title={field.name}>
                {field.name}
              </span>
            </div>
            <TextField
              aria-label={`Значение поля ${field.name}`}
              placeholder="Значение"
              value={field.value}
              onChange={(event) => updateValue(field.id, event.target.value)}
            />
            <Button
              aria-label={`Удалить поле ${field.name}`}
              className="sm:w-10"
              size="sm"
              variant="ghost"
              onClick={() => removeField(field.id)}
            >
              <X aria-hidden="true" size={16} />
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
