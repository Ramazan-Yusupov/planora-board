export const CARD_STICKERS = [
  { emoji: "🚀", label: "Запуск" },
  { emoji: "✨", label: "Идея" },
  { emoji: "🎯", label: "Цель" },
  { emoji: "🧠", label: "Фокус" },
  { emoji: "📝", label: "Заметка" },
  { emoji: "📚", label: "Учёба" },
  { emoji: "💼", label: "Работа" },
  { emoji: "🎨", label: "Дизайн" },
  { emoji: "🛠️", label: "Разработка" },
  { emoji: "📅", label: "План" },
  { emoji: "⏰", label: "Срок" },
  { emoji: "🔥", label: "Приоритет" },
  { emoji: "💡", label: "Озарение" },
  { emoji: "🌱", label: "Рост" },
  { emoji: "🏆", label: "Результат" },
  { emoji: "🎉", label: "Готово" },
] as const;

const MAX_STICKER_CODE_POINTS = 32;

export function getRandomCardSticker(random = Math.random): string {
  const index = Math.floor(random() * CARD_STICKERS.length);

  return CARD_STICKERS[index]?.emoji ?? "✨";
}

export function normalizeCardSticker(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return Array.from(normalizedValue)
    .slice(0, MAX_STICKER_CODE_POINTS)
    .join("");
}
