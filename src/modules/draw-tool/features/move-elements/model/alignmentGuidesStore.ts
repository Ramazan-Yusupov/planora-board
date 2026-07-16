export type AlignmentGuide = {
  axis: "horizontal" | "vertical";
  coordinate: number;
  start: number;
  end: number;
};

export type AlignmentGuides = {
  horizontal: AlignmentGuide | null;
  vertical: AlignmentGuide | null;
};

type AlignmentGuideListener = () => void;

const EMPTY_GUIDES: AlignmentGuides = {
  horizontal: null,
  vertical: null,
};

let guides: AlignmentGuides = EMPTY_GUIDES;
const listeners = new Set<AlignmentGuideListener>();

function areEqual(
  first: AlignmentGuide | null,
  second: AlignmentGuide | null,
) {
  if (first === second) {
    return true;
  }

  if (!first || !second) {
    return false;
  }

  return (
    first.axis === second.axis &&
    first.coordinate === second.coordinate &&
    first.start === second.start &&
    first.end === second.end
  );
}

function isSameGuides(nextGuides: AlignmentGuides) {
  return (
    areEqual(guides.horizontal, nextGuides.horizontal) &&
    areEqual(guides.vertical, nextGuides.vertical)
  );
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const alignmentGuidesStore = {
  get() {
    return guides;
  },

  set(nextGuides: AlignmentGuides) {
    if (isSameGuides(nextGuides)) {
      return;
    }

    guides = nextGuides;
    notifyListeners();
  },

  clear() {
    this.set(EMPTY_GUIDES);
  },

  subscribe(listener: AlignmentGuideListener) {
    listeners.add(listener);

    return () => listeners.delete(listener);
  },
};

