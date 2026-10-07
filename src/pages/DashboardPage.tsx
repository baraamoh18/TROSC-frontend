import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { GraduationCap, BookOpen, Video, Settings } from "lucide-react";
import * as api from "../services/api";
import type { EnrollmentsResponse } from "../services/api";
import { useAuth } from "../context/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import { isStandaloneCourse } from "../utils/catalog";
import NextUp from "../components/Dashboard/NextUp";
import SectionError from "../components/Settings/SectionError";

/**
 * The student home. Profile, events and activity live in Settings; staff
 * work from the Studio, so they're sent there.
 */
const DashboardPage = () => {
  usePageTitle("My Dashboard");
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [enrollments, setEnrollments] = useState<EnrollmentsResponse["data"] | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState(false);
  /** Ids of standalone sessions; enrollments don't say which sessions are in a track. */
  const [standaloneSessionIds, setStandaloneSessionIds] = useState<Set<string>>(new Set());

  // Returns a cancel function so the effect can ignore stale responses;
  // the Retry button calls it directly.
  const loadEnrollments = useCallback(() => {
    let cancelled = false;
    setEnrollmentsLoading(true);
    setEnrollmentsError(false);
    Promise.all([
      api.getMyEnrollments(),
      // If this fails, list no sessions rather than track sessions by mistake.
      api.getSessions("isStandalone=true&limit=100").catch(() => null),
    ])
      .then(([res, standalone]) => {
        if (cancelled) return;
        setEnrollments(res.data);
        setStandaloneSessionIds(new Set((standalone?.data.sessions ?? []).map((s) => s._id)));
      })
      .catch(() => {
        if (!cancelled) setEnrollmentsError(true);
      })
      .finally(() => {
        if (!cancelled) setEnrollmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const userId = user?._id;
  useEffect(() => {
    if (!userId || !isStudent) return;
    return loadEnrollments();
  }, [userId, isStudent, loadEnrollments]);

  // Kept stable so Next up doesn't reload on every render.
  const ownCourses = useMemo(
    () => (enrollments?.courses ?? []).filter((c) => c.published && isStandaloneCourse(c)),
    [enrollments],
  );
  const ownSessions = useMemo(
    () => (enrollments?.sessions ?? []).filter((s) => s.published && standaloneSessionIds.has(s._id)),
    [enrollments, standaloneSessionIds],
  );

  if (!user) return null;
  if (!isStudent) return <Navigate to="/studio" replace />;

  const firstName = user.name.trim().split(/\s+/)[0];
  const enrolledTrack = enrollments?.tracks?.[0] ?? null;
  const ready = !enrollmentsLoading && !enrollmentsError;

  return (
    <div className="min-h-screen bg-neutral-light pt-24 pb-20">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-primary-darker">Hi, {firstName}</h1>
          <Link
            to="/settings"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-neutral-dark hover:text-primary"
          >
            <Settings size={16} aria-hidden="true" />
            Profile and settings
          </Link>
        </div>

        {ready && <NextUp user={user} trackId={enrolledTrack?._id ?? null} ownCourses={ownCourses} ownSessions={ownSessions} />}

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-extrabold text-primary-darker">My Track</h2>
          {enrollmentsLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ) : enrollmentsError ? (
            <SectionError what="your track" onRetry={loadEnrollments} />
          ) : enrolledTrack ? (
            <div className="flex flex-col gap-4 rounded-xl border border-neutral-light-active bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="mb-1 text-xl font-bold text-neutral-darker">{enrolledTrack.title}</h3>
                <p className="flex flex-wrap gap-4 text-sm text-neutral-dark">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={16} aria-hidden="true" /> {enrollments!.courses?.length || 0} course
                    {(enrollments!.courses?.length || 0) === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video size={16} aria-hidden="true" /> {enrollments!.sessions?.length || 0} session
                    {(enrollments!.sessions?.length || 0) === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
              <Link
                to={`/track/${enrolledTrack._id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                <GraduationCap size={18} aria-hidden="true" />
                Go to Track
              </Link>
            </div>
          ) : user.pendingTrack ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-800">
              Your request to join a track is waiting for approval.{" "}
              <Link to={`/track/${user.pendingTrack}`} className="font-semibold text-primary hover:text-primary-hover">
                View track
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-light-active bg-white p-6 text-center text-neutral-dark">
              You haven't joined a track yet.{" "}
              <Link to="/explore" className="font-semibold text-primary hover:text-primary-hover">
                Browse tracks
              </Link>{" "}
              to get started.
            </div>
          )}
        </section>

        {ready && (
          <section>
            <h2 className="mb-1 text-2xl font-extrabold text-primary-darker">On their own</h2>
            <p className="mb-4 text-sm text-neutral-dark">Courses and open sessions you joined outside a track.</p>
            {ownCourses.length + ownSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-light-active bg-white p-6 text-center text-neutral-dark">
                Nothing here yet.{" "}
                <Link to="/explore#courses" className="font-semibold text-primary hover:text-primary-hover">
                  Find a course or open session
                </Link>
                .
              </div>
            ) : (
              <ul className="divide-y divide-neutral-light-active overflow-hidden rounded-xl border border-neutral-light-active bg-white shadow-sm">
                {ownCourses.map((c) => (
                  <li key={c._id}>
                    <Link
                      to={`/courses/${c._id}`}
                      className="flex items-center gap-3 px-5 py-4 font-semibold text-neutral-darker transition-colors hover:bg-neutral-light hover:text-primary"
                    >
                      <BookOpen size={18} className="shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{c.title}</span>
                      <span className="text-xs font-semibold text-neutral-dark">Course</span>
                    </Link>
                  </li>
                ))}
                {ownSessions.map((sess) => (
                  <li key={sess._id}>
                    <Link
                      to={`/sessions/${sess._id}`}
                      className="flex items-center gap-3 px-5 py-4 font-semibold text-neutral-darker transition-colors hover:bg-neutral-light hover:text-primary"
                    >
                      <Video size={18} className="shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{sess.title}</span>
                      <span className="text-xs font-semibold text-neutral-dark">Session</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
