import type { AuthUser, BackendCourse, BackendSession } from "../services/api";

/**
 * Shared rules for content that lives outside a track, so the Explore page,
 * course and session pages, dashboard and Studio all agree.
 */

const trackIds = (s: BackendSession) => (s.tracks ?? []).map((t) => (typeof t === "string" ? t : t._id));

/** A course that doesn't belong to any track. */
export const isStandaloneCourse = (c: BackendCourse) => !c.track;

/** A session outside every track and course. */
export const isStandaloneSession = (s: BackendSession) =>
  !!s.isStandalone || (trackIds(s).length === 0 && !s.course);

/** Published, public and standalone: anyone signed in can join it. */
export const isOpenSession = (s: BackendSession) => s.published && s.access === "public" && isStandaloneSession(s);

/** Published, public and standalone: anyone signed in can enroll straight away. */
export const isOpenCourse = (c: BackendCourse) => c.published && c.access === "public" && isStandaloneCourse(c);

export const isStaffUser = (user?: AuthUser | null) => user?.role === "admin" || user?.role === "instructor";

/**
 * Whether a signed-in student may enroll in a course directly:
 * public courses always, track-only courses once they're in its track.
 */
export const canSelfEnrollInCourse = (c: BackendCourse, user?: AuthUser | null) => {
  if (!user) return false;
  if (c.access === "public") return true;
  if (c.access === "track-only") return !!c.track && user.enrolledTrack === c.track._id;
  return false;
};
