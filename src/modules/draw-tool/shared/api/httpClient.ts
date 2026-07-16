import { ApiError, toApiError } from "./apiError";
import type { RequestOptions } from "./apiTypes";

/** Small JSON fetch wrapper that normalizes network and HTTP failures. */
export async function requestJson<T>(url: string, options: RequestOptions = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(response.statusText || "Request failed", response.status);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    throw toApiError(error);
  }
}

