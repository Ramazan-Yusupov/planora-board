export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [className: string]: boolean | null | undefined };

function appendClassNames(value: ClassValue, output: string[]) {
  if (!value) {
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendClassNames(item, output));
    return;
  }

  Object.entries(value).forEach(([className, isEnabled]) => {
    if (isEnabled) {
      output.push(className);
    }
  });
}

/**
 * Combines conditional Tailwind class names without adding a runtime dependency.
 */
export function cn(...values: ClassValue[]) {
  const classNames: string[] = [];
  values.forEach((value) => appendClassNames(value, classNames));
  return classNames.join(" ");
}

