import {
  BoxIcon,
  Minus,
  MoreHorizontal,
  PanelTopDashed,
  Square,
} from "lucide-react";
import type { ElementStyle, StrokeStyle } from "@/modules/draw-tool/entities/element";
import { ColorPalette, RangeField, SegmentedControl } from "@/modules/draw-tool/shared/ui";
import type { ToolStyleCapabilities } from "../model/toolCapabilities";
import { FILL_COLORS, STROKE_COLORS } from "../model/styleOptions";
import { StyleControl } from "./StyleControl";

type ToolStyleSectionProps = {
  style: ElementStyle;
  capabilities: ToolStyleCapabilities;
  onChange: (patch: Partial<ElementStyle>) => void;
};

const STROKE_WIDTHS = [
  { label: "Тонкая линия: 1px", value: "1", icon: Minus, iconOnly: true },
  { label: "Средняя линия: 2px", value: "2", icon: Minus, iconOnly: true },
  { label: "Толстая линия: 4px", value: "4", icon: Minus, iconOnly: true },
] as const;

const STROKE_STYLES = [
  { label: "Сплошная линия", value: "solid", icon: Minus, iconOnly: true },
  {
    label: "Штриховая линия",
    value: "dashed",
    icon: PanelTopDashed,
    iconOnly: true,
  },
  {
    label: "Точечная линия",
    value: "dotted",
    icon: MoreHorizontal,
    iconOnly: true,
  },
] as const;

const CORNER_STYLES = [
  { label: "Острые углы", value: "sharp", icon: BoxIcon, iconOnly: true },
  {
    label: "Скруглённые углы",
    value: "rounded",
    icon: Square,
    iconOnly: true,
  },
] as const;

export function ToolStyleSection({
  style,
  capabilities,
  onChange,
}: ToolStyleSectionProps) {
  const showStrokeControls = capabilities.strokeControls ?? true;
  const showStrokeWidthControls =
    showStrokeControls && (capabilities.strokeWidthControls ?? true);
  const showStrokeStyleControls =
    showStrokeControls && (capabilities.strokeStyleControls ?? true);

  return (
    <div className="space-y-5 scrollbar-none">
      {capabilities.stroke && (
        <StyleControl label={capabilities.strokeLabel ?? "Контур"}>
          <div className="flex flex-col gap-3">
            <ColorPalette
              label={capabilities.strokeColorLabel ?? "Цвет контура"}
              onChange={(strokeColor) => onChange({ strokeColor })}
              options={STROKE_COLORS}
              value={style.strokeColor}
            />

            {(showStrokeWidthControls || showStrokeStyleControls) && (
              <>
                {showStrokeWidthControls && (
                  <SegmentedControl
                    items={STROKE_WIDTHS}
                    label="Толщина линии"
                    onChange={(value) =>
                      onChange({ strokeWidth: Number(value) })
                    }
                    value={String(style.strokeWidth) as "1" | "2" | "4"}
                  />
                )}

                {showStrokeStyleControls && (
                  <SegmentedControl<StrokeStyle>
                    items={STROKE_STYLES}
                    label="Стиль линии"
                    onChange={(strokeStyle) => onChange({ strokeStyle })}
                    value={style.strokeStyle}
                  />
                )}
              </>
            )}
          </div>
        </StyleControl>
      )}

      {capabilities.fill && (
        <section className="space-y-3 border-t border-border pt-5">
          <ColorPalette
            label="Заливка"
            onChange={(backgroundColor) => {
              onChange({
                backgroundColor,
                fillStyle:
                  backgroundColor === "transparent" ? "transparent" : "solid",
              });
            }}
            options={FILL_COLORS}
            value={style.backgroundColor}
          />
        </section>
      )}

      {capabilities.corner && (
        <section className="border-t border-border pt-5">
          <SegmentedControl
            items={CORNER_STYLES}
            label="Углы"
            onChange={(cornerStyle) => onChange({ cornerStyle })}
            value={style.cornerStyle}
          />
        </section>
      )}

      {capabilities.opacity && (
        <section className="border-t border-border pt-5">
          <RangeField
            label={`Прозрачность: ${Math.round(style.opacity * 100)}%`}
            max={100}
            min={40}
            onChange={(value) => onChange({ opacity: value / 100 })}
            step={5}
            value={Math.round(style.opacity * 100)}
          />
        </section>
      )}
    </div>
  );
}

