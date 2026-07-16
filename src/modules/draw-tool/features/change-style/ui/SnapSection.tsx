import { NumberField } from "@/modules/draw-tool/shared/ui";

type SnapSectionProps = {
  checked: boolean;
  snapSize: number;
  onCheckedChange: (checked: boolean) => void;
  onSnapSizeChange: (snapSize: number) => void;
};

export function SnapSection({
  checked,
  snapSize,
  onCheckedChange,
  onSnapSizeChange,
}: SnapSectionProps) {
  return (
    <section className="space-y-4 border-t border-border pt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          checked={checked}
          className="mt-1 size-4 accent-accent"
          onChange={(event) => onCheckedChange(event.currentTarget.checked)}
          type="checkbox"
        />

        <span>
          <strong className="block text-sm text-text">
            Привязка к пересечениям сетки
          </strong>

          <span className="block text-xs text-text-muted">
            Новые фигуры будут захватывать ближайшую точку.
          </span>
        </span>
      </label>

      <NumberField
        description="Используется для привязки и Shift + ЛКМ."
        label="Шаг привязки"
        max={200}
        min={1}
        onChange={onSnapSizeChange}
        step={1}
        suffix="px"
        value={snapSize}
      />
    </section>
  );
}

