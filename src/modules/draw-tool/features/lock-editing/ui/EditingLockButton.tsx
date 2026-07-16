import { useSyncExternalStore } from "react";
import { Lock, Unlock } from "lucide-react";
import { editingLockStore } from "../model/editingLockStore";
import { toggleEditingLock } from "../model/toggleEditingLock";
import { Button } from "@/modules/draw-tool/shared/ui";
import { cn } from "@/modules/draw-tool/shared/lib";

export function EditingLockButton() {
  const { isLocked } = useSyncExternalStore(
    editingLockStore.subscribe,
    editingLockStore.get,
    editingLockStore.get,
  );

  const label = isLocked
    ? "Разблокировать редактирование"
    : "Заблокировать редактирование";

  return (
    <Button
      aria-label={label}
      aria-pressed={isLocked}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-lg transition-colors max-lg:size-11",
        isLocked ? "bg-accent text-white" : "text-text hover:bg-control",
      )}
      onClick={toggleEditingLock}
      title={`${label} (Ctrl/Cmd + Shift + L)`}
      type="button"
    >
      {isLocked ? (
        <Lock aria-hidden size={19} strokeWidth={2} />
      ) : (
        <Unlock aria-hidden size={19} strokeWidth={2} />
      )}
      <span className="absolute bottom-0.5 right-1 text-[9px] leading-none opacity-70">
        ⇧L
      </span>
    </Button>
  );
}

