"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type CSSProperties,
  type FocusEventHandler,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib";

import { useKeyboardListNavigation } from "./useKeyboardListNavigation";
import { useViewportMenuPosition } from "./useViewportMenuPosition";

type SelectOption = Readonly<{
  disabled?: boolean;
  label: ReactNode;
  text: string;
  value: string;
}>;

export type SelectProps = Readonly<{
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  menuClassName?: string;
  name?: string;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  value?: string;
}>;

function getOptionText(label: ReactNode): string {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }

  if (Array.isArray(label)) {
    return label.map(getOptionText).join("");
  }

  return "";
}

function getOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .filter((child) => child.type === "option")
    .map((child) => {
      const props = child.props as Readonly<{
        children?: ReactNode;
        disabled?: boolean;
        value?: string | number;
      }>;
      const label = props.children ?? props.value ?? "";

      return {
        disabled: props.disabled,
        label,
        text: getOptionText(label),
        value: String(props.value ?? getOptionText(label)),
      };
    });
}

export function Select({
  children,
  className,
  disabled = false,
  id,
  menuClassName,
  name,
  onBlur,
  onChange,
  onFocus,
  value,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuWidth, setMenuWidth] = useState(260);
  const options = useMemo(() => getOptions(children), [children]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex] ?? options[0];
  const selectValue = value ?? selectedOption?.value ?? "";
  const { isPositioned, style } = useViewportMenuPosition({
    anchorRef: buttonRef,
    gap: 5,
    maxHeight: 280,
    menuRef,
    placement: "auto",
    placementKey: `${isOpen}-${menuWidth}-${selectValue}`,
    width: menuWidth,
  });

  const close = useCallback(() => setIsOpen(false), []);
  const emitChange = useCallback(
    (nextValue: string) => {
      onChange?.({
        currentTarget: { value: nextValue },
        target: { value: nextValue },
      } as unknown as Parameters<NonNullable<typeof onChange>>[0]);
    },
    [onChange],
  );
  const selectOption = useCallback(
    (index: number) => {
      const option = options[index];

      if (!option || option.disabled) {
        return;
      }

      emitChange(option.value);
      close();
      buttonRef.current?.focus();
    },
    [close, emitChange, options],
  );
  const isOptionDisabled = useCallback(
    (index: number) => Boolean(options[index]?.disabled),
    [options],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown,
    setActiveIndex,
  } = useKeyboardListNavigation({
    count: options.length,
    getItemId: (index) => `${listboxId}-option-${index}`,
    isItemDisabled: isOptionDisabled,
    onClose: close,
    onSelect: selectOption,
  });
  const open = useCallback(() => {
    setMenuWidth(buttonRef.current?.getBoundingClientRect().width ?? 260);
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }, [selectedIndex, setActiveIndex]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        close();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [close, isOpen]);

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className={cn(
            "z-140 overflow-y-auto rounded-2xl border border-white/10 bg-panel/98 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl",
            !isPositioned && "pointer-events-none opacity-0",
            menuClassName,
          )}
          id={listboxId}
          role="listbox"
          style={style as CSSProperties}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              {...getItemProps(index)}
              aria-selected={option.value === selectValue}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                activeIndex === index
                  ? "bg-accent/20 text-text"
                  : "text-text-muted hover:bg-control hover:text-text",
                option.value === selectValue && "text-text",
                option.disabled && "cursor-not-allowed opacity-45",
              )}
              disabled={option.disabled}
              role="option"
              type="button"
              onClick={() => selectOption(index)}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === selectValue ? (
                <Check
                  aria-hidden="true"
                  className="shrink-0 text-accent"
                  size={16}
                />
              ) : null}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        aria-activedescendant={isOpen ? activeItemId : undefined}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-control/45 px-3 text-left text-sm text-text shadow-[inset_0_1px_0_rgb(255_255_255/3%)] transition-[background-color,border-color,box-shadow] focus:border-accent/70 focus:bg-control/70 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        disabled={disabled}
        id={selectId}
        role="combobox"
        type="button"
        onBlur={onBlur}
        onClick={() => {
          if (isOpen) {
            close();
            return;
          }

          open();
        }}
        onFocus={onFocus}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            open();
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? "Выберите значение"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "shrink-0 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
          size={16}
        />
      </button>
      {name ? <input name={name} type="hidden" value={selectValue} /> : null}
      {menu}
    </>
  );
}
