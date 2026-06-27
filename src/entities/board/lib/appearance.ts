import {
  BOARD_BACKGROUND_OPTIONS,
  CARD_COLOR_OPTIONS,
  type BoardAppearance,
  type BoardBackgroundValue,
  type CardColorValue,
} from "../model/types";

export const DEFAULT_BOARD_APPEARANCE: BoardAppearance = {
  background: "midnight",
  cardColor: "slate",
};

export type CardSurface = {
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  chipBackgroundColor: string;
  borderColor: string;
};

export type ResolvedBoardAppearance = {
  backgroundColor: string;
  backgroundImage: string;
  canvasTextColor: string;
  canvasMutedTextColor: string;
  cardSurface: CardSurface;
};

function findBackground(value: BoardBackgroundValue) {
  return BOARD_BACKGROUND_OPTIONS.find((option) => option.value === value) ?? BOARD_BACKGROUND_OPTIONS[0];
}

function findCardColor(value: CardColorValue) {
  return CARD_COLOR_OPTIONS.find((option) => option.value === value) ?? CARD_COLOR_OPTIONS[0];
}

export function isHexColor(value: string | undefined): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}

function toRgb(color: string): { red: number; green: number; blue: number } {
  const normalized = color.replace("#", "");
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toRgba(color: string, opacity: number): string {
  const { red, green, blue } = toRgb(color);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function getReadableTextColor(backgroundColor: string): "#0f172a" | "#f8fafc" {
  const { red, green, blue } = toRgb(backgroundColor);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.62 ? "#0f172a" : "#f8fafc";
}

export function resolveBoardAppearance(appearance: BoardAppearance): ResolvedBoardAppearance {
  const backgroundOption = findBackground(appearance.background);
  const cardColorOption = findCardColor(appearance.cardColor);
  const backgroundColor =
    appearance.background === "custom" && isHexColor(appearance.customBackgroundColor)
      ? appearance.customBackgroundColor
      : backgroundOption.color;
  const cardBackgroundColor =
    appearance.cardColor === "custom" && isHexColor(appearance.customCardColor)
      ? appearance.customCardColor
      : cardColorOption.color;
  const canvasTextColor = getReadableTextColor(backgroundColor);
  const cardTextColor = getReadableTextColor(cardBackgroundColor);

  return {
    backgroundColor,
    backgroundImage: appearance.background === "custom" ? "none" : backgroundOption.backgroundImage,
    canvasTextColor,
    canvasMutedTextColor: toRgba(canvasTextColor, 0.74),
    cardSurface: {
      backgroundColor: cardBackgroundColor,
      textColor: cardTextColor,
      mutedTextColor: toRgba(cardTextColor, 0.68),
      chipBackgroundColor: toRgba(cardTextColor, 0.13),
      borderColor: toRgba(cardTextColor, 0.2),
    },
  };
}
