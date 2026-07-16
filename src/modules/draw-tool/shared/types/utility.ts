/** Extracts a union of values from an object type. */
export type ValueOf<T> = T[keyof T];

/** Makes the listed keys optional while preserving the rest of the shape. */
export type PartialBy<T, Keys extends keyof T> = Omit<T, Keys> &
  Partial<Pick<T, Keys>>;

/** Makes the listed keys required while preserving the rest of the shape. */
export type RequiredBy<T, Keys extends keyof T> = Omit<T, Keys> &
  Required<Pick<T, Keys>>;

