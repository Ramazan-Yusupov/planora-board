import { useState } from "react";
import { Check, Eye, EyeOff, Layers3, Lock, Plus, Unlock, X } from "lucide-react";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button, IconButton, Panel } from "@/modules/draw-tool/shared/ui";
import { useLayersPanel } from "../model/useLayersPanel";
import { LayerRow } from "./LayerRow";

type LayersPanelProps = {
  onClose?: () => void;
};

/** Scene-order panel for selecting elements by their visual stacking order. */
export function LayersPanel({ onClose }: LayersPanelProps) {
  const {
    activeLayerId,
    activeLayerName,
    addLayer,
    count,
    isSelected,
    layers,
    renameLayer,
    selectLayer,
    setActiveLayer,
    toggleLayerLock,
    toggleLayerVisibility,
  } = useLayersPanel();
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  function startRename(layerId: string, name: string) {
    setEditingLayerId(layerId);
    setDraftName(name);
  }

  function finishRename() {
    if (editingLayerId) {
      renameLayer(editingLayerId, draftName);
    }
    setEditingLayerId(null);
    setDraftName("");
  }

  return (
    <Panel className="w-64 rounded-2xl border border-border/90 bg-panel/94 p-2 shadow-panel backdrop-blur-xl">
      <header className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="min-w-0 text-sm font-semibold text-text">
          <div className="flex items-center gap-2">
            <Layers3 className="shrink-0 text-accent" size={17} />
            <span>Слои</span>
            <span className="text-xs font-normal text-text-muted">{count}</span>
          </div>
          <div className="truncate pl-6 text-xs font-normal text-text-muted">
            {activeLayerName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label="Добавить слой"
            className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-control hover:text-text"
            onClick={addLayer}
            type="button"
          >
            <Plus aria-hidden size={16} />
          </IconButton>
          {onClose && (
          <IconButton
            aria-label="Закрыть слои"
            className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-control hover:text-text"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden size={16} />
          </IconButton>
          )}
        </div>
      </header>
      <div className="max-h-80 space-y-1 overflow-y-auto p-1">
        {layers.length > 0 ? (
          layers.map((group) => (
            <section
              className="rounded-lg border border-border/70 bg-surface/50 p-1"
              key={group.layer.id}
            >
              <div className="flex items-center gap-1">
                <Button
                  className={cn(
                    "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-xs font-medium",
                    activeLayerId === group.layer.id
                      ? "bg-accent/15 text-accent"
                      : "text-text hover:bg-control",
                  )}
                  disabled={!group.layer.visible || group.layer.locked}
                  onClick={() => setActiveLayer(group.layer.id)}
                  onDoubleClick={() => startRename(group.layer.id, group.layer.name)}
                  type="button"
                >
                  {activeLayerId === group.layer.id && <Check aria-hidden size={13} />}
                  {editingLayerId === group.layer.id ? (
                    <input
                      autoFocus
                      className="h-6 min-w-0 flex-1 rounded border border-border bg-control px-1 text-xs text-text outline-none focus:border-accent"
                      onBlur={finishRename}
                      onChange={(event) => setDraftName(event.currentTarget.value)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") finishRename();
                        if (event.key === "Escape") setEditingLayerId(null);
                      }}
                      value={draftName}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{group.layer.name}</span>
                  )}
                  <span className="text-[11px] text-text-muted">{group.elements.length}</span>
                </Button>
                <IconButton
                  aria-label={group.layer.visible ? "Скрыть слой" : "Показать слой"}
                  className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-control hover:text-text"
                  onClick={() => toggleLayerVisibility(group.layer.id)}
                  type="button"
                >
                  {group.layer.visible ? <Eye aria-hidden size={15} /> : <EyeOff aria-hidden size={15} />}
                </IconButton>
                <IconButton
                  aria-label={group.layer.locked ? "Разблокировать слой" : "Заблокировать слой"}
                  className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-control hover:text-text"
                  onClick={() => toggleLayerLock(group.layer.id)}
                  type="button"
                >
                  {group.layer.locked ? <Lock aria-hidden size={15} /> : <Unlock aria-hidden size={15} />}
                </IconButton>
              </div>
              {group.elements.length > 0 && (
                <div className="mt-1 space-y-1 pl-2">
                  {group.elements.map((layer) => (
                    <LayerRow
                      isDisabled={!group.layer.visible || group.layer.locked}
                      isSelected={isSelected(layer.element.id)}
                      key={layer.element.id}
                      layer={layer}
                      onSelect={selectLayer}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        ) : (
          <p className="m-2 text-sm text-text-muted">На доске пока нет объектов.</p>
        )}
      </div>
    </Panel>
  );
}

