import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../services/api";
import { ApiError } from "../services/api";
import type {
  BackendTrack,
  BackendSession,
  BackendCourse,
  BackendAssignment,
  WeeklyTask,
  SessionCatalogItem,
  Submission,
} from "../services/api";
import { useAuth } from "../context/useAuth";
import TrackHero from "../components/TrackDetails/TrackHero";
import TrackTabs from "../components/TrackDetails/TrackTabs";
import TrackOverview from "../components/TrackDetails/TrackOverview";
import TrackWeeklyTasks from "../components/TrackDetails/TrackWeeklyTasks";
import TrackSessionsTable from "../components/TrackDetails/TrackSessionsTable";
import TrackAssignments from "../components/TrackDetails/TrackAssignments";
import TrackCourses from "../components/TrackDetails/TrackCourses";
import TrackResources from "../components/TrackDetails/TrackResources";
import TrackSchedule from "../components/TrackDetails/TrackSchedule";
import TrackFeedback from "../components/TrackDetails/TrackFeedback";
import Divider from "../components/Divider";
import ComingSoonNotice from "../components/ComingSoonNotice";

const BACKEND_PLACEHOLDER = "https://placehold.co/800x400?text=Trosc+Track";

/** Returns true only for valid 24-character hex MongoDB ObjectIds. */
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const TrackDetailsPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { user, loading: authLoading } = useAuth();
  const hasValidTrackId = !!trackId && isValidObjectId(trackId);

  // ── State ────────────────────────────────────────────────────

  const [liveTrack, setLiveTrack] = useState<BackendTrack | null>(null);

  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [sessionsUnauthorized, setSessionsUnauthorized] = useState(false);
  const [sessionCatalog, setSessionCatalog] = useState<SessionCatalogItem[]>([]);

  const [courses, setCourses] = useState<BackendCourse[]>([]);

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [weeklyTasksLoading, setWeeklyTasksLoading] = useState(true);
  const [weeklyTasksUnauthorized, setWeeklyTasksUnauthorized] = useState(false);

  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsUnauthorized, setAssignmentsUnauthorized] = useState(false);

  // ── Fetches ──────────────────────────────────────────────────

  // Track info (public)
  useEffect(() => {
    if (!hasValidTrackId || !trackId) return;
    let cancelled = false;
    api
      .getTrack(trackId)
      .then((res) => {
        if (!cancelled) setLiveTrack(res.data.track);
      })
      .catch(() => {
        // Invalid ID or network error — hero falls back to placeholders below
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId]);

  // Public catalog: names and schedule only. The API must never include media
  // URLs here, because this request is made for unauthenticated visitors too.
  useEffect(() => {
    if (!hasValidTrackId || !trackId) return;
    let cancelled = false;
    api
      .getSessionCatalogByTrack(trackId)
      .then((res) => {
        if (!cancelled) setSessionCatalog(res.data.sessions);
      })
      .catch(() => {
        if (!cancelled) setSessionCatalog([]);
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId]);

  // Video-capable session data is available to every authenticated user.
  useEffect(() => {
    if (!hasValidTrackId || !trackId || authLoading) return;
    if (!user) {
      setSessions([]);
      setSessionsUnauthorized(false);
      return;
    }
    setSessionsUnauthorized(false);
    let cancelled = false;
    api
      .getSessionsByTrack(trackId)
      .then((res) => {
        if (!cancelled) setSessions(res.data.sessions);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setSessionsUnauthorized(true);
        }
        setSessions([]);
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId, authLoading, user]);

  // Courses by track (public)
  useEffect(() => {
    if (!hasValidTrackId || !trackId) return;
    let cancelled = false;
    api
      .getCoursesByTrack(trackId)
      .then((res) => {
        if (!cancelled) setCourses(res.data.courses);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId]);

  // Tasks and submissions are deliberately fetched only for enrolled users.
  useEffect(() => {
    if (!hasValidTrackId || !trackId) return;
    if (authLoading) {
      setWeeklyTasksLoading(true);
      return;
    }
    if (!user || user.enrolledTrack !== trackId) {
      setWeeklyTasks([]);
      setWeeklyTasksLoading(false);
      return;
    }
    setWeeklyTasksLoading(true);
    setWeeklyTasksUnauthorized(false);
    let cancelled = false;
    api
      .getWeeklyTasksByTrack(trackId)
      .then((res) => {
        if (!cancelled) setWeeklyTasks(res.data.weeklyTasks);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setWeeklyTasksUnauthorized(true);
        }
        setWeeklyTasks([]);
      })
      .finally(() => {
        if (!cancelled) setWeeklyTasksLoading(false);
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId, authLoading, user]);

  // Assignments follow the same enrolled-only rule as weekly tasks.
  useEffect(() => {
    if (!hasValidTrackId || !trackId) return;
    if (authLoading) {
      setAssignmentsLoading(true);
      return;
    }
    if (!user || user.enrolledTrack !== trackId) {
      setAssignments([]);
      setAssignmentsLoading(false);
      return;
    }
    setAssignmentsLoading(true);
    setAssignmentsUnauthorized(false);
    let cancelled = false;
    api
      .getAssignmentsByTrack(trackId)
      .then((res) => {
        if (!cancelled) setAssignments(res.data.assignments);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setAssignmentsUnauthorized(true);
        }
        setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setAssignmentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [trackId, hasValidTrackId, authLoading, user]);

  // ── Derived data ─────────────────────────────────────────────

  // Sort sessions chronologically (soonest first) for display + scheduling.
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [sessions]);

  // PDFs come from each session's resources[] attachments;
  // Recordings are sessions that have a primary URL (video/embed) and link
  // to the session viewer, which handles access checks and progress.
  const trackResources = useMemo(() => {
    const pdfs = sortedSessions.flatMap((s) =>
      (s.resources ?? [])
        .filter((r) => !!r.url)
        .map((r) => ({ title: r.title, url: r.url })),
    );
    const recordings = sortedSessions
      .filter((s) => !!s.url)
      .map((s) => ({ sessionId: s._id, title: s.title }));
    return { pdfs, recordings };
  }, [sortedSessions]);

  // Derive schedule from sessions with a startDate
  const scheduleItems = useMemo(() => {
    return sortedSessions
      .filter((s) => !!s.startDate)
      .map((s) => ({
        date: new Date(s.startDate!).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        event: s.title,
        type: "session" as const,
      }));
  }, [sortedSessions]);

  const nextSessionLabel = useMemo(() => {
    const now = Date.now();
    const upcoming = sortedSessions.find(
      (s) => s.startDate && new Date(s.startDate).getTime() > now,
    );
    return upcoming?.startDate
      ? new Date(upcoming.startDate).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "TBA";
  }, [sortedSessions]);

  // Update a single assignment's mySubmission after a successful submit
  const handleAssignmentSubmission = (assignmentId: string, submission: Submission) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === assignmentId
          ? {
              ...a,
              mySubmission: submission,
            }
          : a,
      ),
    );
  };

  const handleSessionWatched = (sessionId: string) => {
    setSessions((previous) =>
      previous.map((session) =>
        session._id === sessionId
          ? {
              ...session,
              myProgress: { status: "watched", watchedAt: new Date().toISOString() },
            }
          : session,
      ),
    );
  };

  const isEnrolled = !!user && user.enrolledTrack === trackId;

  // ── Hero values ───────────────────────────────────────────────

  const heroTitle = liveTrack?.title ?? "Track";
  const heroSubtitle = liveTrack?.description ?? "";
  const heroImage =
    liveTrack && liveTrack.coverImage !== BACKEND_PLACEHOLDER
      ? liveTrack.coverImage
      : BACKEND_PLACEHOLDER;

  const scheduleSummary = {
    nextSession: nextSessionLabel,
    projectDeadline: "TBA",
    finalExam: "TBA",
  };

  // Keep the validation guard after all hooks so the hook order is stable.
  if (!hasValidTrackId) {
    return (
      <div className="bg-gray-50 min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Track not found</h1>
          <p className="text-gray-600 mb-6">
            This track doesn't exist yet or hasn't been published.
          </p>
          <Link
            to="/#tracks"
            className="inline-block bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-hover transition-colors"
          >
            Browse Tracks
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-16">
      <TrackHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={heroImage}
        level={liveTrack?.level}
        studentCount={liveTrack?.studentCount}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <TrackTabs />

        <div className="mt-8 space-y-16">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32">
            <TrackOverview
              trackId={trackId ?? ""}
              track={liveTrack}
              overview={heroSubtitle || "No overview available yet."}
              scheduleSummary={scheduleSummary}
              resourcesSummary={[]}
            />

          </section>

          <Divider />

          {/* Courses */}
          <section id="courses" className="scroll-mt-32">
            <TrackCourses courses={courses} />
          </section>

          <Divider />

          {/* Sessions */}
          <section id="sessions" className="scroll-mt-32">
            {!user && !authLoading ? (
              <TrackSessionsTable
                sessions={[]}
                catalogSessions={sessionCatalog}
                canWatch={false}
                isEnrolled={false}
              />
            ) : sessionsUnauthorized ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h2>
                <ComingSoonNotice message="Sign in to view this track's sessions." />
              </div>
            ) : (
              <TrackSessionsTable
                sessions={sortedSessions}
                canWatch={!!user}
                isEnrolled={isEnrolled}
                onWatched={handleSessionWatched}
              />
            )}
          </section>

          <Divider />

          {/* Resources */}
          <section id="resources" className="scroll-mt-32">
            {trackResources.pdfs.length === 0 && trackResources.recordings.length === 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{heroTitle} Resources</h2>
                <ComingSoonNotice message="Track resources will appear here once sessions have attached materials." />
              </div>
            ) : (
              <TrackResources resources={trackResources} trackTitle={heroTitle} />
            )}
          </section>

          <Divider />

          {/* Weekly Tasks */}
          <section id="weekly-tasks" className="scroll-mt-32">
            {!authLoading && !user ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Tasks</h2>
                <ComingSoonNotice message="Sign in and join this track to unlock weekly tasks." />
              </div>
            ) : !authLoading && user && !isEnrolled ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Tasks</h2>
                <ComingSoonNotice message="Join this track to unlock weekly tasks and progress tracking." />
              </div>
            ) : weeklyTasksUnauthorized ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Tasks</h2>
                <ComingSoonNotice message="Sign in to view weekly tasks." />
              </div>
            ) : weeklyTasksLoading ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Tasks</h2>
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <TrackWeeklyTasks tasks={weeklyTasks} />
            )}
          </section>

          <Divider />

          {/* Assignments */}
          <section id="assignments" className="scroll-mt-32">
            {!authLoading && !user ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>
                <ComingSoonNotice message="Sign in and join this track to unlock assignments." />
              </div>
            ) : !authLoading && user && !isEnrolled ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>
                <ComingSoonNotice message="Join this track to unlock assignments and secure submission." />
              </div>
            ) : assignmentsUnauthorized ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>
                <ComingSoonNotice message="Sign in to view assignments." />
              </div>
            ) : assignmentsLoading ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <TrackAssignments
                assignments={assignments}
                isEnrolled={isEnrolled}
                onSubmissionUpdate={handleAssignmentSubmission}
              />
            )}
          </section>

          {/* Schedule */}
          <section id="schedule" className="scroll-mt-32">
            {scheduleItems.length === 0 ? (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Sessions & Deadlines</h2>
                <ComingSoonNotice message="Session dates will appear here once sessions have scheduled start dates." />
              </div>
            ) : (
              <TrackSchedule upcoming={scheduleItems} />
            )}
          </section>

          {/* Feedback */}
          <section id="feedback" className="scroll-mt-32">
            <TrackFeedback trackId={trackId ?? ""} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailsPage;
