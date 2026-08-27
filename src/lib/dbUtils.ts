/**
 * Utility: wrap a Supabase query with timeout + exponential backoff retry.
 * Falls back to a default value rather than crashing the UI.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  { retries = 1, baseDelay = 500, timeoutMs = 10000 } = {}
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let timerId: any = null;
    try {
      const result = await Promise.race([
        fn().finally(() => {
          if (timerId) clearTimeout(timerId);
        }),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error("DB_TIMEOUT")), timeoutMs);
        }),
      ]);
      return result;
    } catch (err: any) {
      if (timerId) clearTimeout(timerId);
      const isLast = attempt === retries;
      const isTimeout = err?.message === "DB_TIMEOUT";
      const isNetwork =
        err?.message?.includes("Load failed") ||
        err?.message?.includes("NetworkError") ||
        err?.name === "AbortError" ||
        err?.code === "";
      const isBadRequest =
        err?.status === 400 ||
        err?.statusCode === 400 ||
        err?.code === "PGRST100" ||
        err?.message?.includes("400");

      if (isLast || isBadRequest || (!isTimeout && !isNetwork)) {
        if (!isBadRequest && attempt > 0) {
          console.warn(`[dbUtils] Giving up after ${attempt + 1} attempt(s):`, err?.message || err);
        }
        return fallback;
      }

      const delay = baseDelay * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return fallback;
}
