import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

function splitUtilityVariant(className) {
  let bracketDepth = 0;

  for (let index = className.length - 1; index >= 0; index -= 1) {
    const character = className[index];

    if (character === "]") {
      bracketDepth += 1;
    } else if (character === "[") {
      bracketDepth -= 1;
    } else if (character === ":" && bracketDepth === 0) {
      return {
        prefix: className.slice(0, index + 1),
        utility: className.slice(index + 1),
      };
    }
  }

  return { prefix: "", utility: className };
}

function getSpacingScaleClass(className) {
  const { prefix, utility } = splitUtilityVariant(className);
  const match =
    /^(?<important>!?)(?<negative>-?)(?<name>[a-z][a-z0-9-]*)-\[(?<value>(?:\d+(?:\.\d+)?|\.\d+))rem\]$/i.exec(
      utility,
    );

  if (!match?.groups) {
    return null;
  }

  const remValue = Number(match.groups.value);
  const spacingValue = remValue * 4;

  if (!Number.isInteger(spacingValue)) {
    return null;
  }

  return `${prefix}${match.groups.important}${match.groups.negative}${match.groups.name}-${spacingValue}`;
}

function getZIndexScaleClass(className) {
  const { prefix, utility } = splitUtilityVariant(className);
  const match =
    /^(?<important>!?)(?<negative>-?)z-\[(?<value>\d+)\]$/i.exec(utility);

  if (!match?.groups) {
    return null;
  }

  return `${prefix}${match.groups.important}${match.groups.negative}z-${match.groups.value}`;
}

function getGridRepeatScaleClass(className) {
  const { prefix, utility } = splitUtilityVariant(className);
  const match =
    /^(?<important>!?)grid-cols-\[repeat\((?<value>\d+),minmax\(0,1fr\)\)\]$/i.exec(
      utility,
    );

  if (!match?.groups) {
    return null;
  }

  return `${prefix}${match.groups.important}grid-cols-${match.groups.value}`;
}

function getNormalizedArbitraryClass(className) {
  if (!className.includes("[") || !className.includes("_/_")) {
    return null;
  }

  return className.replaceAll("_/_", "/");
}

function getModernTailwindClass(className) {
  return (
    getSpacingScaleClass(className) ??
    getZIndexScaleClass(className) ??
    getGridRepeatScaleClass(className) ??
    getNormalizedArbitraryClass(className)
  );
}

const tailwindModernClassPlugin = {
  rules: {
    "prefer-scale-class": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Prefer Tailwind scale classes over equivalent arbitrary values.",
        },
        fixable: "code",
        schema: [],
        messages: {
          preferSpacingScale:
            "The class `{{current}}` can be written as `{{replacement}}`.",
        },
      },
      create(context) {
        function checkStringNode(node, value) {
          if (typeof value !== "string" || !node.range) {
            return;
          }

          const contentStart = node.range[0] + 1;
          const classNamePattern = /\S+/g;
          let match;

          while ((match = classNamePattern.exec(value))) {
            const current = match[0];
            const replacement = getModernTailwindClass(current);

            if (!replacement || replacement === current) {
              continue;
            }

            context.report({
              node,
              messageId: "preferSpacingScale",
              data: { current, replacement },
              fix(fixer) {
                return fixer.replaceTextRange(
                  [
                    contentStart + match.index,
                    contentStart + match.index + current.length,
                  ],
                  replacement,
                );
              },
            });
          }
        }

        return {
          Literal(node) {
            checkStringNode(node, node.value);
          },
          JSXText(node) {
            checkStringNode(node, node.value);
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "tailwind-modern": tailwindModernClassPlugin,
    },
    rules: {
      "tailwind-modern/prefer-scale-class": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".codex/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
