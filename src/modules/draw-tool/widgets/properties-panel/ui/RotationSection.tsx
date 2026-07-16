import { RotateCw } from "lucide-react";
import { NumberField } from "@/modules/draw-tool/shared/ui";

type RotationSectionProps = {
  angleRadians: number;
  onChange: (degrees: number) => void;
};

export function RotationSection({
  angleRadians,
  onChange,
}: RotationSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <RotateCw size={17} />
        Поворот
      </div>

      <NumberField
        label="Угол"
        max={360}
        min={-360}
        onChange={onChange}
        step={1}
        suffix="°"
        value={Math.round((angleRadians * 180) / Math.PI)}
      />
    </section>
  );
}

