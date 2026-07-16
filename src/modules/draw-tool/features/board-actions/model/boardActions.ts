import {
  createElement,
  DEFAULT_ELEMENT_STYLE,
  getElementBounds,
  updateElement,
  type ArrowCornerStyle,
  type BoardElement,
} from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import type { serializeScene } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import {
  downloadFile,
  exportToJson,
  exportToPng,
  exportToSvg,
} from "@/modules/draw-tool/features/export-scene";
import { createId } from "@/modules/draw-tool/shared/lib";
import {
  getAlignedPositionPatch,
  getAutoLayoutTargets,
  getDistributionTargets,
  getElementsBounds,
  type AlignCommand,
  type DistributeCommand,
} from "./layoutGeometry";
import { readSnapshots, saveBrandKit, writeSnapshots } from "./storage";
import {
  decodeSharePayload,
  encodeSharePayload,
  normalizeInsertedElements,
} from "./elementPayload";
import {
  createBoundArrow,
  createTemplateElements,
  parseDiagramEdges,
} from "./diagramFactories";
import { createWaypointInsertPatch } from "./arrowWaypoints";
import {
  searchElementsByText,
  type ElementSearchResult,
} from "./elementSearch";
import { parseCsvRows } from "./tableImport";
import {
  canUseLabel,
  getElementsByIds,
  getSelectedElements,
} from "./selectionQueries";
import {
  getFrameExportElements,
  getFrameSummaries,
  getSelectedFrame,
} from "./frameActions";
import { getViewportForElement, getViewportForFrame } from "./viewportFocus";
import { createDrawToolFile, parseDrawToolFile } from "./drawToolFile";
import {
  copyElementsAsPng,
  copyElementsAsSvg,
  copyElementsToClipboard,
  readElementsFromClipboard,
} from "./clipboardActions";
import {
  deleteLibraryItemById,
  getClonedLibraryItems,
  getNormalizedLibraryItemElements,
  saveElementsToLibrary,
} from "./componentLibraryActions";
import {
  createSnapshotItem,
  getLatestSnapshot,
  getSnapshotById,
  getSnapshots,
} from "./snapshotActions";
import { getDiagramDiagnostics } from "./diagramDiagnostics";
export type { AlignCommand, DistributeCommand } from "./layoutGeometry";
export type { LibraryItem } from "./storage";
export type { ElementSearchResult } from "./elementSearch";

const SHARE_HASH_PREFIX = "scene=";

function getInsertionPoint() {
  const viewport = viewportStore.get();
  return {
    x: viewport.x + window.innerWidth / viewport.zoom / 2 - 160,
    y: viewport.y + window.innerHeight / viewport.zoom / 2 - 100,
  };
}

export const boardActions = {
  copySelectionToClipboard() {
    return copyElementsToClipboard(getSelectedElements());
  },

  async pasteElementsFromClipboard() {
    const clipboardElements = await readElementsFromClipboard();
    if (!clipboardElements) return false;

    const elements = normalizeInsertedElements(clipboardElements);
    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, ...elements]);
    selectionStore.setElementIds(elements.map((element) => element.id));
    historyStore.commit();
    return true;
  },

  async copySelectionAsPng() {
    return copyElementsAsPng(getSelectedElements());
  },

  async copySelectionAsSvg() {
    return copyElementsAsSvg(getSelectedElements());
  },

  groupSelection() {
    const elements = getSelectedElements().filter((element) => !element.locked);
    if (elements.length < 2) return false;
    const groupId = createId("group");
    historyStore.begin();
    sceneStore.updateAll((element) =>
      elements.some((item) => item.id === element.id)
        ? updateElement(element, { groupId })
        : element,
    );
    historyStore.commit();
    return true;
  },

  ungroupSelection() {
    const ids = new Set(selectionStore.get().elementIds);
    historyStore.begin();
    sceneStore.updateAll((element) =>
      ids.has(element.id) && element.groupId
        ? updateElement(element, { groupId: undefined })
        : element,
    );
    historyStore.commit();
    return true;
  },

  toggleLockSelection(targetElementId?: string) {
    const elements = targetElementId
      ? getElementsByIds([targetElementId])
      : getSelectedElements();
    if (elements.length === 0) return false;
    const shouldLock = elements.some((element) => !element.locked);
    const elementIds = elements.map((element) => element.id);
    historyStore.begin();
    sceneStore.updateAll((element) =>
      elements.some((item) => item.id === element.id)
        ? updateElement(element, { locked: shouldLock })
        : element,
    );
    if (shouldLock) {
      selectionStore.clear();
    } else {
      selectionStore.setElementIds(elementIds);
    }
    historyStore.commit();
    return true;
  },

  alignSelection(command: AlignCommand) {
    const elements = getSelectedElements().filter((element) => !element.locked);
    const selectionBounds = getElementsBounds(elements);
    if (!selectionBounds || elements.length < 2) return false;

    historyStore.begin();
    sceneStore.updateAll((element) => {
      if (!elements.some((item) => item.id === element.id)) return element;
      return updateElement(
        element,
        getAlignedPositionPatch(command, element, selectionBounds),
      );
    });
    historyStore.commit();
    return true;
  },

  distributeSelection(command: DistributeCommand) {
    const elements = getSelectedElements().filter((element) => !element.locked);
    if (elements.length < 3) return false;
    const targetById = getDistributionTargets(elements, command);

    historyStore.begin();
    sceneStore.updateAll((element) => {
      const target = targetById.get(element.id);
      if (target === undefined) return element;
      const bounds = getElementBounds(element);
      return command === "horizontal"
        ? updateElement(element, { x: element.x + target - bounds.x })
        : updateElement(element, { y: element.y + target - bounds.y });
    });
    historyStore.commit();
    return true;
  },

  setSelectionLabel(label: string) {
    const elements = getSelectedElements().filter(
      (element) => !element.locked && canUseLabel(element),
    );
    if (elements.length === 0) return false;
    historyStore.begin();
    sceneStore.updateAll((element) =>
      elements.some((item) => item.id === element.id)
        ? updateElement(element, { label: label.trim() || undefined })
        : element,
    );
    historyStore.commit();
    return true;
  },

  saveSelectionToLibrary(name = "Компонент") {
    return saveElementsToLibrary(getSelectedElements(), name);
  },

  getLibraryItems() {
    return getClonedLibraryItems();
  },

  insertLibraryItem(itemId: string) {
    const elements = getNormalizedLibraryItemElements(itemId);
    if (!elements) return false;

    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, ...elements]);
    selectionStore.setElementIds(elements.map((element) => element.id));
    historyStore.commit();
    return true;
  },

  deleteLibraryItem(itemId: string) {
    return deleteLibraryItemById(itemId);
  },

  async exportSelectedFrame(format: "png" | "svg" | "json") {
    const frame = getSelectedFrame(getSelectedElements());
    if (!frame) return false;
    const elements = getFrameExportElements(frame, sceneStore.get().elements);
    const fileName = `${frame.type}-${frame.id}`;
    const file =
      format === "png"
        ? await exportToPng(elements, { fileName: `${fileName}.png` })
        : format === "svg"
          ? exportToSvg(elements, { fileName: `${fileName}.svg` })
          : exportToJson(elements, { fileName: `${fileName}.json` });
    downloadFile(file.blob, file.fileName);
    return true;
  },

  focusSelectedFrame() {
    const frame = getSelectedFrame(getSelectedElements());
    if (!frame) return false;
    viewportStore.set(getViewportForFrame(frame));
    return true;
  },

  async copyReadonlyShareLink() {
    if (!navigator.clipboard?.writeText) return false;
    const payload = encodeSharePayload(sceneStore.get().elements);
    const url = `${window.location.origin}${window.location.pathname}#${SHARE_HASH_PREFIX}${payload}`;
    await navigator.clipboard.writeText(url);
    return true;
  },

  restoreSceneFromShareHash() {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith(SHARE_HASH_PREFIX)) return false;
    try {
      const source = decodeSharePayload(hash.slice(SHARE_HASH_PREFIX.length));
      const parsed = JSON.parse(source) as ReturnType<typeof serializeScene>;
      if (!Array.isArray(parsed.elements)) return false;
      historyStore.begin();
      sceneStore.setElements(parsed.elements);
      selectionStore.clear();
      historyStore.commit();
      return true;
    } catch {
      return false;
    }
  },

  insertTemplate(template: "flowchart" | "mindmap" | "roadmap") {
    const elements = createTemplateElements(template);
    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, ...elements]);
    selectionStore.setElementIds(elements.map((element) => element.id));
    historyStore.commit();
    return true;
  },

  createSnapshot(name = "Checkpoint") {
    createSnapshotItem(sceneStore.get().elements, name);
    return true;
  },

  restoreLatestSnapshot() {
    const snapshot = getLatestSnapshot();
    if (!snapshot) return false;
    historyStore.begin();
    sceneStore.setElements(snapshot.elements);
    selectionStore.clear();
    historyStore.commit();
    return true;
  },

  getSnapshots() {
    return getSnapshots();
  },

  restoreSnapshot(snapshotId: string) {
    const snapshot = getSnapshotById(snapshotId);
    if (!snapshot) return false;
    historyStore.begin();
    sceneStore.setElements(snapshot.elements);
    selectionStore.clear();
    historyStore.commit();
    return true;
  },

  insertMarkdownNote() {
    const point = getInsertionPoint();
    const element = createElement("markdown", {
      x: point.x,
      y: point.y,
      width: 340,
      height: 240,
    });
    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, element]);
    selectionStore.setElementIds([element.id]);
    historyStore.commit();
    return true;
  },

  insertDiagramFromCode(source: string) {
    const edges = parseDiagramEdges(source);
    if (edges.length === 0) return false;

    const names = Array.from(
      new Set(edges.flatMap((edge) => [edge.from, edge.to])),
    );
    const point = getInsertionPoint();
    const nodeByName = new Map<string, BoardElement>();
    const columns = Math.min(
      4,
      Math.max(2, Math.ceil(Math.sqrt(names.length))),
    );
    const nodeElements = names.map((name, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const element = createElement("rectangle", {
        x: point.x + column * 240,
        y: point.y + row * 150,
        width: 180,
        height: 84,
        style: {
          ...DEFAULT_ELEMENT_STYLE,
          strokeColor: "#93c5fd",
          backgroundColor: "#0f172a",
          fillStyle: "solid",
          cornerStyle: "rounded",
        },
      });
      const labeled = updateElement(element, { label: name });
      nodeByName.set(name, labeled);
      return labeled;
    });
    const arrows = edges
      .map((edge) => {
        const start = nodeByName.get(edge.from);
        const end = nodeByName.get(edge.to);
        return start && end ? createBoundArrow(start, end) : null;
      })
      .filter((element): element is BoardElement => Boolean(element));
    const elements = [...nodeElements, ...arrows];

    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, ...elements]);
    selectionStore.setElementIds(elements.map((element) => element.id));
    historyStore.commit();
    return true;
  },

  connectSelectionSmart() {
    const elements = getSelectedElements()
      .filter((element) => !element.locked && element.type !== "arrow")
      .sort((left, right) => {
        const leftBounds = getElementBounds(left);
        const rightBounds = getElementBounds(right);
        return leftBounds.x === rightBounds.x
          ? leftBounds.y - rightBounds.y
          : leftBounds.x - rightBounds.x;
      });
    if (elements.length < 2) return false;
    const arrows = elements
      .slice(0, -1)
      .map((element, index) => createBoundArrow(element, elements[index + 1]));

    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, ...arrows]);
    selectionStore.setElementIds(arrows.map((element) => element.id));
    historyStore.commit();
    return true;
  },

  insertBezierConnector() {
    const point = getInsertionPoint();
    const arrow = createElement("arrow", {
      x: point.x,
      y: point.y,
      width: 320,
      height: 120,
      routing: "curve",
      style: {
        ...DEFAULT_ELEMENT_STYLE,
        strokeColor: "#22c55e",
        fillStyle: "transparent",
        strokeWidth: 5,
      },
    });

    historyStore.begin();
    sceneStore.setElements([
      ...sceneStore.get().elements,
      updateElement(arrow, { label: "Bezier" }),
    ]);
    selectionStore.setElementIds([arrow.id]);
    historyStore.commit();
    return true;
  },

  addWaypointToSelectedArrow() {
    const arrow = getSelectedElements().find(
      (element) => element.type === "arrow",
    );
    if (!arrow || arrow.type !== "arrow") return false;
    if (arrow.routing !== "straight") return false;

    const patch = createWaypointInsertPatch(arrow);
    if (!patch) return false;

    historyStore.begin();
    sceneStore.updateById(arrow.id, (element) =>
      element.type === "arrow"
        ? updateElement(element, patch)
        : element,
    );
    historyStore.commit();
    return true;
  },

  clearSelectedArrowWaypoints() {
    const arrow = getSelectedElements().find(
      (element) => element.type === "arrow",
    );
    if (!arrow || arrow.type !== "arrow" || !arrow.waypoints?.length)
      return false;
    historyStore.begin();
    sceneStore.updateById(arrow.id, (element) =>
      element.type === "arrow"
        ? updateElement(element, {
            waypointBindings: undefined,
            waypoints: undefined,
          })
        : element,
    );
    historyStore.commit();
    return true;
  },

  setSelectedArrowCornerStyle(routeCornerStyle: ArrowCornerStyle) {
    const arrow = getSelectedElements().find(
      (element) => element.type === "arrow",
    );
    if (!arrow || arrow.type !== "arrow") return false;
    if (arrow.routing !== "straight") return false;
    historyStore.begin();
    sceneStore.updateById(arrow.id, (element) =>
      element.type === "arrow"
        ? updateElement(element, { routeCornerStyle })
        : element,
    );
    historyStore.commit();
    return true;
  },

  insertTableFromCsv(source: string) {
    const rows = parseCsvRows(source);
    if (rows.length === 0) return false;
    const columns = Math.max(...rows.map((row) => row.length));
    const cells = rows.flatMap((row) =>
      Array.from({ length: columns }, (_, index) => row[index] ?? ""),
    );
    const point = getInsertionPoint();
    const table = createElement("table", {
      x: point.x,
      y: point.y,
      width: Math.max(280, columns * 140),
      height: Math.max(120, rows.length * 48),
      rows: rows.length,
      columns,
      cells,
    });

    historyStore.begin();
    sceneStore.setElements([...sceneStore.get().elements, table]);
    selectionStore.setElementIds([table.id]);
    historyStore.commit();
    return true;
  },

  searchElements(query: string): ElementSearchResult[] {
    return searchElementsByText(sceneStore.get().elements, query);
  },

  focusElement(elementId: string) {
    const element = sceneStore
      .get()
      .elements.find((item) => item.id === elementId);
    if (!element) return false;
    selectionStore.setElementIds([element.id]);
    viewportStore.set(getViewportForElement(element, viewportStore.get().zoom));
    return true;
  },

  autoLayoutSelection(mode: "flow" | "grid" | "tree" = "flow") {
    const elements = getSelectedElements().filter(
      (element) =>
        !element.locked && element.type !== "arrow" && element.type !== "line",
    );
    if (elements.length < 2) return false;
    const targetById = getAutoLayoutTargets(elements, mode);
    if (!targetById) return false;

    historyStore.begin();
    sceneStore.updateAll((element) => {
      const target = targetById.get(element.id);
      return target ? updateElement(element, target) : element;
    });
    historyStore.commit();
    return true;
  },

  getFrames() {
    return getFrameSummaries(sceneStore.get().elements);
  },

  exportDrawToolFile() {
    const file = createDrawToolFile(sceneStore.get().elements, readSnapshots());
    downloadFile(file.blob, file.fileName);
    return true;
  },

  async importDrawToolFile(file: File) {
    const { scene, snapshots } = parseDrawToolFile(await file.text());

    historyStore.begin();
    sceneStore.setScene(scene);
    selectionStore.clear();
    historyStore.commit();

    if (snapshots) {
      writeSnapshots(snapshots);
    }

    return true;
  },

  runDiagramDiagnostics() {
    return getDiagramDiagnostics(sceneStore.get().elements);
  },

  applyBrandKit() {
    const brand = {
      strokeColor: "#22c55e",
      backgroundColor: "#052e16",
    };
    saveBrandKit(brand);
    const elements = getSelectedElements();
    if (elements.length === 0) return false;
    historyStore.begin();
    sceneStore.updateAll((element) =>
      elements.some((item) => item.id === element.id)
        ? updateElement(element, {
            style: {
              ...element.style,
              ...brand,
              fillStyle: "solid",
            },
          })
        : element,
    );
    historyStore.commit();
    return true;
  },
};

