export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  maxBytes: number
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new ApiError("Request body is too large", 413);
  }

  if (!request.body) {
    throw new ApiError("Invalid JSON body", 400);
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new ApiError("Request body is too large", 413);
      }

      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Invalid request body", 400);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
}

export function jsonError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return { message: error.message, status: error.status };
  }

  return {
    message: error instanceof Error ? error.message : fallbackMessage,
    status: 500,
  };
}
