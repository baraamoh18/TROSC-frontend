import type { BackendAssignment, BackendCourse, BackendSession } from "../../services/api";

// Shared classes and helpers for the Studio sections.

export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export const labelCls = "mb-1 block text-sm font-semibold text-gray-800";

export const primaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";

export const smallBtn =
  "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const cardCls = "rounded-xl border border-gray-200 bg-white shadow-sm";

/** ISO date → value for <input type="datetime-local"> in the viewer's time zone. */
export const toLocalInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** <input type="datetime-local"> value → ISO string, or null when empty. */
export const fromLocalInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

export const formatDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "No date";

export const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

/** Populated user objects or bare ids, as the API returns either. */
export const refId = (ref: unknown): string | undefined =>
  typeof ref === "string" ? ref : (ref as { _id?: string } | null | undefined)?._id;

/** "Course: X" / "Session: Y" for an assignment's parent. */
export const assignmentTarget = (
  a: BackendAssignment,
  courses: BackendCourse[],
  sessions: BackendSession[],
): string => {
  const courseId = refId(a.course);
  if (courseId) return `Course: ${a.course?.title ?? courses.find((c) => c._id === courseId)?.title ?? "unknown"}`;
  const sessionId = refId(a.session);
  if (sessionId) return `Session: ${a.session?.title ?? sessions.find((s) => s._id === sessionId)?.title ?? "unknown"}`;
  return "";
};

/**
 * Whether the signed-in person may change an item, given its instructor.
 * The API allows admins, the track's lead and co-instructors, and the item's
 * own instructor; anyone else gets "You can only modify your own content".
 */
export type CanManage = (owner: unknown) => boolean;

export const ownerName = (owner: unknown): string =>
  (owner as { name?: string } | null | undefined)?.name ?? "another instructor";
