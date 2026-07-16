type RangeFieldProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: RangeFieldProps) {
  return (
    <label className="grid gap-2 text-xs font-medium text-text-muted">
      <span>{label}</span>

      <input
        className="drawtool-range w-full"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

