/** Common nullable and asynchronous state helpers shared across features. */
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: T | null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: T | null; error: Error };

