/** Normalized error shape for HTTP and persistence adapters. */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) return error;
  return new ApiError(error instanceof Error ? error.message : "Unexpected request error");
}

