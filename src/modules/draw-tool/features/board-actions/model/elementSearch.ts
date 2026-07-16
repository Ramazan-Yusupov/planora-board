import type { BoardElement } from "@/modules/draw-tool/entities/element";

export type ElementSearchResult = {
  id: string;
  label: string;
  meta: string;
};

function getElementText(element: BoardElement) {
  const tags = element.tags?.join(" ") ?? "";
  const metadata = element.metadata
    ? Object.entries(element.metadata)
        .map(([key, value]) => `${key} ${value}`)
        .join(" ")
    : "";
  const suffix = `${tags} ${metadata}`.trim();
  const withMeta = (value: string) => `${value}\n${suffix}`.trim();

  if ("label" in element && element.label) return withMeta(element.label);
  if (element.type === "frame") return withMeta(element.name);
  if (element.type === "embed") return withMeta(element.title ?? element.url);
  if (element.type === "markdown")
    return withMeta(`${element.title}\n${element.content}`);
  if (
    element.type === "text" ||
    element.type === "sticky" ||
    element.type === "callout"
  )
    return withMeta(element.text);
  if (element.type === "table") return withMeta(element.cells.join("\n"));
  if (element.type === "code" && "kind" in element)
    return withMeta(`${element.title}\n${element.body.join("\n")}`);
  if (element.type === "code")
    return withMeta(`${element.title}\n${element.language}\n${element.code}`);
  if (element.type === "image") return withMeta(element.name);
  return withMeta(element.type);
}

export function searchElementsByText(
  elements: BoardElement[],
  query: string,
): ElementSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return elements
    .map((element) => {
      const text = getElementText(element);
      return {
        element,
        text,
      };
    })
    .filter((item) => item.text.toLowerCase().includes(normalizedQuery))
    .slice(0, 24)
    .map(({ element, text }) => ({
      id: element.id,
      label: text.split("\n").find(Boolean)?.slice(0, 80) || element.type,
      meta: `${element.type} · ${element.id}`,
    }));
}

