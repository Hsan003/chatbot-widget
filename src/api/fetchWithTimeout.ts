/**
 * Fetch wrapper with built-in timeout and retry logic
 * 
 * Prevents widget from hanging on slow/dead backends
 */

export interface FetchOptions {
  timeout?: number; // milliseconds
  retries?: number;
  retryDelay?: number; // milliseconds
}

/**
 * Fetch with timeout and automatic retry
 * 
 * @param url - URL to fetch
 * @param options - RequestInit (fetch options) + timeout/retry config
 * @returns Response if successful
 * @throws Error if all retries exhausted or timeout exceeded
 * 
 * @example
 * const res = await fetchWithTimeout(url, {
 *   method: "POST",
 *   timeout: 10_000,
 *   retries: 1,
 * });
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit & FetchOptions
): Promise<Response> {
  const {
    timeout = 10_000,
    retries = 1,
    retryDelay = 1_000,
    ...fetchOpts
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeout);

      try {
        const res = await fetch(url, {
          ...fetchOpts,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return res;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err as Error;

      // Don't retry on the last attempt
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw (
    lastError || new Error("[ChatAssistant] Network request failed")
  );
}
