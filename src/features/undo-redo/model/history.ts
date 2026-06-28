export type HistoryState<T> = Readonly<{
  past: readonly T[];
  future: readonly T[];
}>;

export const HISTORY_LIMIT = 50;

export function createHistory<T>(): HistoryState<T> {
  return { past: [], future: [] };
}

export function pushHistory<T>(
  state: HistoryState<T>,
  snapshot: T,
  limit = HISTORY_LIMIT,
): HistoryState<T> {
  const past = [...state.past, snapshot];

  return {
    past: past.slice(Math.max(0, past.length - limit)),
    future: [],
  };
}

export function takeUndo<T>(
  state: HistoryState<T>,
  current: T,
): Readonly<{ state: HistoryState<T>; snapshot: T | null }> {
  const snapshot = state.past.at(-1);

  if (!snapshot) {
    return { state, snapshot: null };
  }

  return {
    state: {
      past: state.past.slice(0, -1),
      future: [current, ...state.future].slice(0, HISTORY_LIMIT),
    },
    snapshot,
  };
}

export function takeRedo<T>(
  state: HistoryState<T>,
  current: T,
): Readonly<{ state: HistoryState<T>; snapshot: T | null }> {
  const snapshot = state.future.at(0);

  if (!snapshot) {
    return { state, snapshot: null };
  }

  return {
    state: {
      past: [...state.past, current].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
    },
    snapshot,
  };
}
