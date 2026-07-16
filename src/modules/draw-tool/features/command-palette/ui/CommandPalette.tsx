import { useState, useSyncExternalStore } from "react";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { productivityToolsStore } from "@/modules/draw-tool/features/productivity-tools";
import { commandPaletteStore } from "../model/commandPaletteStore";
import { Button, Modal } from "@/modules/draw-tool/shared/ui";

export function CommandPalette() {
  const isOpen = useSyncExternalStore(
    commandPaletteStore.subscribe,
    commandPaletteStore.get,
    commandPaletteStore.get,
  );
  const [query, setQuery] = useState("");
  const commands = [
    { label: "Open Power Tools", run: productivityToolsStore.open },
    { label: "Search elements", run: productivityToolsStore.open },
    { label: "Export .drawtool file", run: boardActions.exportDrawToolFile },
    { label: "Insert markdown note", run: boardActions.insertMarkdownNote },
    {
      label: "Connect selection with smart arrows",
      run: boardActions.connectSelectionSmart,
    },
    {
      label: "Auto layout selection",
      run: () => boardActions.autoLayoutSelection("flow"),
    },
    {
      label: "Insert flowchart template",
      run: () => boardActions.insertTemplate("flowchart"),
    },
    {
      label: "Insert mind map template",
      run: () => boardActions.insertTemplate("mindmap"),
    },
    {
      label: "Create checkpoint",
      run: () => boardActions.createSnapshot("Checkpoint"),
    },
    { label: "Restore checkpoint", run: boardActions.restoreLatestSnapshot },
    { label: "Group selection", run: boardActions.groupSelection },
    {
      label: "Lock / unlock selection",
      run: () => boardActions.toggleLockSelection(),
    },
    { label: "Apply brand kit", run: boardActions.applyBrandKit },
  ].filter((command) =>
    command.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function run(command: () => unknown) {
    command();
    commandPaletteStore.close();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={commandPaletteStore.close}
      title="Command Palette"
    >
      <input
        autoFocus
        className="mb-3 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-text outline-none focus:border-accent"
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search command..."
        value={query}
      />
      <div className="space-y-1">
        {commands.map((command) => (
          <Button
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-control"
            key={command.label}
            onClick={() => run(command.run)}
          >
            {command.label}
          </Button>
        ))}
      </div>
    </Modal>
  );
}

