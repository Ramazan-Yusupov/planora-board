import { useEffect, useState } from "react";

type NumberFieldProps = {
  description?: string;
  label: string;
  max: number;
  min: number;
  step: number;
  suffix?: string;
  value: number;
  onChange: (value: number) => void;
};

export function NumberField({
  description,
  label,
  max,
  min,
  step,
  suffix,
  value,
  onChange,
}: NumberFieldProps) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftValue(String(value));
  }, [value]);

  function commitValue() {
    const parsedValue = Number(draftValue);

    if (!Number.isFinite(parsedValue)) {
      setDraftValue(String(value));
      return;
    }

    const boundedValue = Math.min(Math.max(parsedValue, min), max);
    const steppedValue = Math.round((boundedValue - min) / step) * step + min;

    onChange(steppedValue);
    setDraftValue(String(steppedValue));
  }

  return (
    <label className="grid gap-2 text-sm text-text-muted">
      <span>{label}</span>

      <div className="flex items-center gap-2">
        <input
          className="h-9 w-24 rounded-md border border-border bg-control px-2 text-sm text-text outline-none focus:border-accent"
          inputMode="numeric"
          max={max}
          min={min}
          onBlur={commitValue}
          onChange={(event) => setDraftValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          step={step}
          type="number"
          value={draftValue}
        />

        {suffix && <span className="text-xs">{suffix}</span>}
      </div>

      {description && (
        <span className="text-xs text-text-muted">{description}</span>
      )}
    </label>
  );
}

