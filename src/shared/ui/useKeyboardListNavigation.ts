"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
} from "react";

type NavigationOrientation = "vertical" | "horizontal";

type UseKeyboardListNavigationOptions = Readonly<{
  count: number;
  getItemId?: (index: number) => string;
  isItemDisabled?: (index: number) => boolean;
  loop?: boolean;
  onClose?: () => void;
  onSelect: (index: number) => void;
  orientation?: NavigationOrientation;
  pageStep?: number;
}>;

type KeyboardNavigationEvent = Readonly<{
  key: string;
  preventDefault: () => void;
}>;

function getNextEnabledIndex(
  startIndex: number,
  direction: 1 | -1,
  count: number,
  isItemDisabled: (index: number) => boolean,
  loop: boolean,
) {
  if (count <= 0) {
    return -1;
  }

  let nextIndex = startIndex;

  for (let step = 0; step < count; step += 1) {
    nextIndex += direction;

    if (loop) {
      nextIndex = (nextIndex + count) % count;
    } else if (nextIndex < 0 || nextIndex >= count) {
      return startIndex >= 0 && startIndex < count ? startIndex : -1;
    }

    if (!isItemDisabled(nextIndex)) {
      return nextIndex;
    }
  }

  return -1;
}

function getBoundaryEnabledIndex(
  count: number,
  isItemDisabled: (index: number) => boolean,
  direction: 1 | -1,
) {
  const start = direction === 1 ? 0 : count - 1;

  for (let offset = 0; offset < count; offset += 1) {
    const index = start + offset * direction;

    if (!isItemDisabled(index)) {
      return index;
    }
  }

  return -1;
}

export function useKeyboardListNavigation({
  count,
  getItemId,
  isItemDisabled = () => false,
  loop = true,
  onClose,
  onSelect,
  orientation = "vertical",
  pageStep = 6,
}: UseKeyboardListNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(() =>
    getBoundaryEnabledIndex(count, isItemDisabled, 1),
  );
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const isVertical = orientation === "vertical";
  const firstEnabledIndex = useMemo(
    () => getBoundaryEnabledIndex(count, isItemDisabled, 1),
    [count, isItemDisabled],
  );
  const resolvedActiveIndex =
    activeIndex >= 0 && activeIndex < count && !isItemDisabled(activeIndex)
      ? activeIndex
      : firstEnabledIndex;
  const activeItemId = useMemo(
    () =>
      resolvedActiveIndex >= 0
        ? (getItemId?.(resolvedActiveIndex) ?? undefined)
        : undefined,
    [getItemId, resolvedActiveIndex],
  );

  useEffect(() => {
    itemRefs.current[resolvedActiveIndex]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [resolvedActiveIndex]);

  const moveBy = useCallback(
    (direction: 1 | -1, steps = 1) => {
      setActiveIndex((currentIndex) => {
        let nextIndex =
          currentIndex >= 0
            ? currentIndex
            : getBoundaryEnabledIndex(count, isItemDisabled, direction);

        for (let step = 0; step < steps; step += 1) {
          nextIndex = getNextEnabledIndex(
            nextIndex,
            direction,
            count,
            isItemDisabled,
            loop,
          );
        }

        return nextIndex;
      });
    },
    [count, isItemDisabled, loop],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardNavigationEvent) => {
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
      const previousKey = isVertical ? "ArrowUp" : "ArrowLeft";

      if (event.key === nextKey) {
        event.preventDefault();
        moveBy(1);
        return;
      }

      if (event.key === previousKey) {
        event.preventDefault();
        moveBy(-1);
        return;
      }

      if (event.key === "PageDown") {
        event.preventDefault();
        moveBy(1, pageStep);
        return;
      }

      if (event.key === "PageUp") {
        event.preventDefault();
        moveBy(-1, pageStep);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(getBoundaryEnabledIndex(count, isItemDisabled, 1));
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(getBoundaryEnabledIndex(count, isItemDisabled, -1));
        return;
      }

      if (event.key === "Enter") {
        if (
          resolvedActiveIndex < 0 ||
          isItemDisabled(resolvedActiveIndex)
        ) {
          return;
        }

        event.preventDefault();
        onSelect(resolvedActiveIndex);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    },
    [
      count,
      isItemDisabled,
      isVertical,
      moveBy,
      onClose,
      onSelect,
      pageStep,
      resolvedActiveIndex,
    ],
  );

  const getItemProps = useCallback(
    (index: number) => {
      const itemId = getItemId?.(index);
      const setItemRef: RefCallback<HTMLElement> = (element) => {
        itemRefs.current[index] = element;
      };

      return {
        "aria-selected": resolvedActiveIndex === index,
        id: itemId,
        ref: setItemRef,
        tabIndex: -1,
        onMouseEnter: () => {
          if (!isItemDisabled(index)) {
            setActiveIndex(index);
          }
        },
      };
    },
    [getItemId, isItemDisabled, resolvedActiveIndex],
  );

  return {
    activeIndex: resolvedActiveIndex,
    activeItemId,
    getItemProps,
    handleKeyDown,
    setActiveIndex,
  };
}
