const AI_MAX_ATTEMPTS = 3;
const AI_RETRY_DELAYS_MS = [500, 1500];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function extractStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const record = error as Record<string, unknown>;
  const response = record.response && typeof record.response === "object"
    ? record.response as Record<string, unknown>
    : undefined;
  const cause = record.cause && typeof record.cause === "object"
    ? record.cause as Record<string, unknown>
    : undefined;

  for (const value of [record.status, record.statusCode, response?.status, response?.statusCode, cause?.status, cause?.statusCode]) {
    if (typeof value === "number") return value;
  }

  return undefined;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isRetryableAiError(error: unknown): boolean {
  const status = extractStatus(error);
  if (status !== undefined) return isRetryableStatus(status);

  const message = errorMessage(error).toLowerCase();
  if (
    message.includes("is required")
    || message.includes("unauthorized")
    || message.includes("forbidden")
    || message.includes("invalid api key")
    || message.includes("invalid_api_key")
  ) {
    return false;
  }

  return true;
}

function wrapRetryError(operation: string, attempts: number, error: unknown): Error {
  const wrapped = new Error(
    `${operation} failed after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${errorMessage(error)}`,
    { cause: error instanceof Error ? error : undefined },
  );
  const status = extractStatus(error);
  if (status !== undefined) {
    Object.assign(wrapped, { status });
  }
  return wrapped;
}

export async function withAiRetries<T>(
  operation: string,
  task: (attempt: number) => Promise<T>,
  maxAttempts = AI_MAX_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableAiError(error)) {
        throw wrapRetryError(operation, attempt, error);
      }

      const delayMs = AI_RETRY_DELAYS_MS[Math.min(attempt - 1, AI_RETRY_DELAYS_MS.length - 1)]
        ?? AI_RETRY_DELAYS_MS[AI_RETRY_DELAYS_MS.length - 1]
        ?? 1000;
      await delay(delayMs);
    }
  }

  throw wrapRetryError(operation, maxAttempts, lastError);
}