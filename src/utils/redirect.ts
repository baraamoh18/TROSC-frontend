/**
 * Reads the `from` location that ProtectedRoute stores in router state and
 * returns it as a path to send the user back to after signing in.
 * Only same-origin app paths are accepted; anything else yields `fallback`.
 */
export const getRedirectPath = (state: unknown, fallback: string): string => {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)?.from;
  const pathname = from?.pathname;
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return fallback;
  }
  const search = typeof from?.search === "string" ? from.search : "";
  const hash = typeof from?.hash === "string" ? from.hash : "";
  return `${pathname}${search}${hash}`;
};
