import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  CaseSensitive,
} from "lucide-react";
import type { TextAlign } from "@/modules/draw-tool/entities/element";
import { NumberField, SegmentedControl } from "@/modules/draw-tool/shared/ui";

const TEXT_ALIGN_ITEMS = [
  {
    label: "Выровнять по левому краю",
    value: "left",
    icon: AlignLeft,
    iconOnly: true,
  },
  {
    label: "Выровнять по центру",
    value: "center",
    icon: AlignCenter,
    iconOnly: true,
  },
  {
    label: "Выровнять по правому краю",
    value: "right",
    icon: AlignRight,
    iconOnly: true,
  },
] as const;

type TextOptionsSectionProps = {
  fontSize: number;
  textAlign: TextAlign;
  showAlign: boolean;
  onChange: (patch: { fontSize?: number; textAlign?: TextAlign }) => void;
};

export function TextOptionsSection({
  fontSize,
  textAlign,
  showAlign,
  onChange,
}: TextOptionsSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <CaseSensitive size={18} />
        Текст
      </div>

      <NumberField
        label="Размер шрифта"
        max={120}
        min={12}
        onChange={(nextFontSize) => onChange({ fontSize: nextFontSize })}
        step={1}
        suffix="px"
        value={fontSize}
      />

      {showAlign && (
        <SegmentedControl<TextAlign>
          items={TEXT_ALIGN_ITEMS}
          label="Выравнивание"
          onChange={(nextTextAlign) => onChange({ textAlign: nextTextAlign })}
          value={textAlign}
        />
      )}
    </section>
  );
}

