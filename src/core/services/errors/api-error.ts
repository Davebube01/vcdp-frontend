export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ErrorResponse {
  detail: string | { msg: string; type: string }[];
}

export function handleApiError(error: any): never {
  if (error instanceof ApiError) {
    throw error;
  }

  const message = error.message || "An unexpected error occurred";
  throw new ApiError(message);
}
