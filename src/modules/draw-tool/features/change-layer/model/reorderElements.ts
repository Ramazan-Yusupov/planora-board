import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { LayerAction } from "./types";

const ROOT_LAYER = "__root__";

type LayerGroup = {
  indexes: number[];
  elements: BoardElement[];
};

/**
 * Objects in a Frame are rendered inside that Frame. Therefore their stacking
 * order is only meaningful among their sibling objects in the same Frame.
 * Root objects share one root stacking context.
 */
function getLayerGroups(elements: BoardElement[]) {
  const elementIds = new Set(elements.map((element) => element.id));
  const groups = new Map<string, LayerGroup>();

  elements.forEach((element, index) => {
    const layerId =
      element.parentId && elementIds.has(element.parentId)
        ? element.parentId
        : ROOT_LAYER;

    const group = groups.get(layerId) ?? { indexes: [], elements: [] };
    group.indexes.push(index);
    group.elements.push(element);
    groups.set(layerId, group);
  });

  return groups;
}

function reorderGroup(
  elements: BoardElement[],
  selectedIds: ReadonlySet<string>,
  action: LayerAction,
) {
  const selected = elements.filter((element) => selectedIds.has(element.id));

  if (selected.length === 0 || selected.length === elements.length) {
    return elements;
  }

  if (action === "front") {
    return [
      ...elements.filter((element) => !selectedIds.has(element.id)),
      ...selected,
    ];
  }

  if (action === "back") {
    return [
      ...selected,
      ...elements.filter((element) => !selectedIds.has(element.id)),
    ];
  }

  const next = [...elements];

  if (action === "forward") {
    // Iterate right-to-left so a multi-selection moves as one block.
    for (let index = next.length - 2; index >= 0; index -= 1) {
      if (
        selectedIds.has(next[index].id) &&
        !selectedIds.has(next[index + 1].id)
      ) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
    }

    return next;
  }

  // Iterate left-to-right so a multi-selection moves as one block.
  for (let index = 1; index < next.length; index += 1) {
    if (
      selectedIds.has(next[index].id) &&
      !selectedIds.has(next[index - 1].id)
    ) {
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    }
  }

  return next;
}

function hasOrderChanged(
  before: BoardElement[],
  after: BoardElement[],
) {
  return before.some((element, index) => element.id !== after[index]?.id);
}

/**
 * Returns an updated scene order without moving an object out of its Frame.
 * It returns the original array when there is no possible move.
 */
export function reorderElementsByLayer(
  elements: BoardElement[],
  selectedIds: ReadonlySet<string>,
  action: LayerAction,
) {
  if (selectedIds.size === 0 || elements.length < 2) {
    return elements;
  }

  const next = [...elements];
  let changed = false;

  getLayerGroups(elements).forEach(({ indexes, elements: groupElements }) => {
    const reorderedGroup = reorderGroup(groupElements, selectedIds, action);

    if (!hasOrderChanged(groupElements, reorderedGroup)) {
      return;
    }

    changed = true;
    indexes.forEach((sceneIndex, groupIndex) => {
      next[sceneIndex] = reorderedGroup[groupIndex];
    });
  });

  return changed ? next : elements;
}

export function canChangeElementsLayer(
  elements: BoardElement[],
  selectedIds: ReadonlySet<string>,
  action: LayerAction,
) {
  return reorderElementsByLayer(elements, selectedIds, action) !== elements;
}

