import { SlidersHorizontal, X } from "lucide-react";
import { IconButton } from "@/modules/draw-tool/shared/ui";

type PropertiesPanelHeaderProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
};

export function PropertiesPanelHeader({
  title,
  subtitle,
  onClose,
}: PropertiesPanelHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
      <SlidersHorizontal className="text-accent" size={17} />

      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold text-text">{title}</p>
        <p className="m-0 text-xs text-text-muted">{subtitle}</p>
      </div>

      <IconButton
        aria-label="Закрыть настройки"
        className="grid size-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-control hover:text-text lg:hidden"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden size={19} />
      </IconButton>
    </div>
  );
}

