import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Clock,
  FileText,
  Lock,
  UserCircle,
  Video,
} from "lucide-react";
import * as api from "../services/api";
import { ApiError } from "../services/api";
import type { BackendSession } from "../services/api";
import ProgressToggle from "../components/Session/ProgressToggle";
import FeedbackPanel from "../components/FeedbackPanel";
import { useAuth } from "../context/useAuth";
import usePageTitle from "../hooks/usePageTitle";

const LEVEL_BADGE: Record<BackendSession["level"], string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

const SessionViewerPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();

  const [session, setSession] = useState<BackendSession | null>(null);
  const [loading, setLoading] = useState(true);
  /** Set when the server refuses access (403/404) — renders the locked state. */
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setErrorStatus(null);
    api
      .getSession(sessionId)
      .then((res) => {
        if (!cancelled) setSession(res.data.session);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) setErrorStatus(err.status);
        setSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  usePageTitle(session?.title);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-light pt-24 pb-20">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-6 h-8 w-2/3 animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  // The API returns drafts to members too; only staff should see them.
  const hiddenDraft =
    !!session && session.published === false && user?.role !== "admin" && user?.role !== "instructor";

  if (!session || hiddenDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-light pt-16">
        <div className="px-4 text-center">
          <h1 className="mb-3 text-3xl font-bold text-neutral-darker">
            {errorStatus === 403
              ? "This session is locked"
              : "Session not found"}
          </h1>
          <p className="mb-6 text-neutral-dark">
            {errorStatus === 403
              ? "Join the track this session belongs to in order to watch it."
              : "It may have been removed, or the link is incorrect."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // The API may return a bare id or a populated track doc here.
  const firstTrack = session.tracks?.[0];
  const trackId = typeof firstTrack === "string" ? firstTrack : firstTrack?._id;
  // The API returns myProgress only to enrolled callers; track and direct
  // session membership are checked too in case it's missing.
  const sessionTrackIds = (session.tracks ?? []).map((t) => (typeof t === "string" ? t : t._id));
  const canTrackProgress =
    !!session.myProgress ||
    (!!user?.enrolledTrack && sessionTrackIds.includes(user.enrolledTrack)) ||
    !!user?.enrolledSessions?.includes(session._id);
  const isStaff = user?.role === "admin" || user?.role === "instructor";
  // The API strips url/embedUrl for callers without access, so no link here
  // means "members only" unless the session is public or the caller is staff.
  const isLocked =
    !session.embedUrl && !session.url && session.access !== "public" && !canTrackProgress && !isStaff;
  const dateLabel = session.startDate
    ? new Date(session.startDate).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "TBA";

  return (
    <div className="min-h-screen bg-neutral-light pt-24 pb-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-dark">
          <Link
            to={trackId ? `/track/${trackId}` : "/dashboard"}
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {trackId ? "Back to track" : "Back to dashboard"}
          </Link>
        </div>

        {/* Video player */}
        {session.embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md">
            <iframe
              src={session.embedUrl}
              title={session.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : session.url ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-neutral-light-active bg-white p-6 shadow-sm">
            <p className="flex items-center gap-2 font-bold text-neutral-darker">
              <Video size={20} className="text-primary" />
              This session's content is hosted externally.
            </p>
            <a
              href={session.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Open session content
            </a>
          </div>
        ) : isLocked ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-neutral-light-active px-6 text-center">
            <Lock size={28} className="text-neutral-dark" aria-hidden="true" />
            <p className="font-bold text-neutral-darker">This session is for track members</p>
            <p className="max-w-sm text-sm text-neutral-dark">
              {user
                ? "Join the track to watch the recording and track your progress."
                : "Sign in and join the track to watch the recording."}
            </p>
            {user ? (
              trackId && (
                <Link
                  to={`/track/${trackId}`}
                  className="rounded-lg bg-primary-dark px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark-hover"
                >
                  View the track
                </Link>
              )
            ) : (
              <Link
                to="/signin"
                state={{ from: { pathname: `/sessions/${session._id}` } }}
                className="rounded-lg bg-primary-dark px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark-hover"
              >
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-neutral-light-active text-neutral-dark">
            The recording hasn't been published yet.
          </div>
        )}

        {/* Title & meta */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_BADGE[session.level]}`}
            >
              {session.level}
            </span>
            {session.duration ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-dark">
                <Clock size={14} />
                {session.duration} min
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-dark">
              <CalendarDays size={14} />
              {dateLabel}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-neutral-darker sm:text-3xl">
            {session.title}
          </h1>

          {session.instructor && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-dark">
              <UserCircle size={22} className="text-primary" />
              <span>
                Instructor:{" "}
                <span className="font-semibold text-neutral-darker">
                  {session.instructor.name}
                </span>
              </span>
            </div>
          )}

          {session.description && (
            <p className="mt-4 whitespace-pre-line text-base leading-7 text-neutral-dark">
              {session.description}
            </p>
          )}

          {/* Progress tracking (members only; staff don't track progress) */}
          {(canTrackProgress || !isStaff) && (
          <div className="mt-6 border-t border-neutral-light-active pt-6">
            {canTrackProgress ? (
              <div className="flex flex-wrap items-center gap-4">
                <ProgressToggle
                  sessionId={session._id}
                  initialWatched={session.myProgress?.status === "watched"}
                  watchedAt={session.myProgress?.watchedAt}
                  onWatched={(watchedAt) =>
                    setSession((prev) =>
                      prev ? { ...prev, myProgress: { status: "watched", watchedAt } } : prev,
                    )
                  }
                />
                <span className="text-sm text-neutral-dark">
                  Mark sessions as watched to track your progress in the track
                  page.
                </span>
              </div>
            ) : (
              <p className="text-sm text-neutral-dark">
                Join the track to track your progress on this session.
              </p>
            )}
          </div>
          )}
        </div>

        {/* Resources */}
        {(session.resources?.length ?? 0) > 0 && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-neutral-darker">
              <FileText size={20} className="text-primary" />
              Session resources
            </h2>
            <ul className="space-y-2">
              {(session.resources ?? []).map((resource, idx) => (
                <li key={idx}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover"
                  >
                    <BarChart3 size={15} className="shrink-0" />
                    <span className="truncate">{resource.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6">
          <FeedbackPanel subject="session" subjectId={session._id} />
        </div>
      </div>
    </div>
  );
};

export default SessionViewerPage;
