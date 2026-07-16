import type { ReactNode } from "react";
import { Button } from "@/modules/draw-tool/shared/ui";

type BoardContextMenuActionProps = {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function BoardContextMenuAction({
  children,
  danger = false,
  disabled = false,
  onClick,
}: BoardContextMenuActionProps) {
  return (
    <Button
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-text hover:bg-control ${
        danger ? "text-red-500! hover:bg-red-500/15 hover:text-red-200" : ""
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </Button>
  );
}

