export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: Error };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
};

