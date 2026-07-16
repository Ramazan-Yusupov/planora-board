import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { createId } from "@/modules/draw-tool/shared/lib";
import { cloneElements } from "./elementPayload";
import { readSnapshots, writeSnapshots } from "./storage";

export function createSnapshotItem(
  elements: BoardElement[],
  name = "Checkpoint",
) {
  const snapshots = readSnapshots();
  writeSnapshots(
    [
      {
        id: createId("snapshot"),
        name,
        createdAt: Date.now(),
        elements: cloneElements(elements),
      },
      ...snapshots,
    ].slice(0, 12),
  );
}

export function getSnapshots() {
  return readSnapshots();
}

export function getLatestSnapshot() {
  return readSnapshots()[0] ?? null;
}

export function getSnapshotById(snapshotId: string) {
  return readSnapshots().find((item) => item.id === snapshotId) ?? null;
}

