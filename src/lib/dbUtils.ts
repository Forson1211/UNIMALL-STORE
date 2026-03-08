/**
 * Utility: wrap a Supabase query with timeout + exponential backoff retry.
 * Falls back to a default value rather than crashing the UI.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  { retries = 3, baseDelay = 1000, timeoutMs = 8000 } = {}
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB_TIMEOUT")), timeoutMs)
        ),
      ]);
      return result;
    } catch (err: any) {
      const isLast = attempt === retries;
      const isTimeout = err?.message === "DB_TIMEOUT";
      const isNetwork =
        err?.message?.includes("Load failed") ||
        err?.message?.includes("NetworkError") ||
        err?.code === "";

      if (isLast || (!isTimeout && !isNetwork)) {
        console.warn(`[dbUtils] Giving up after ${attempt + 1} attempt(s):`, err?.message);
        return fallback;
      }

      const delay = baseDelay * 2 ** attempt;
      console.info(`[dbUtils] Attempt ${attempt + 1} failed (${err?.message}). Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return fallback;
}
