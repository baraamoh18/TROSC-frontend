import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
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
import { panelId, tabId } from "../components/TrackDetails/tabIds";
import type { TrackTab } from "../components/TrackDetails/TrackTabs";
import TrackJoinAction from "../components/TrackDetails/TrackJoinAction";
import TrackOverview from "../components/TrackDetails/TrackOverview";
import TrackWeeklyTasks from "../components/TrackDetails/TrackWeeklyTasks";
import TrackSessionsTable from "../components/TrackDetails/TrackSessionsTable";
import TrackAssignments from "../components/TrackDetails/TrackAssignments";
import TrackCourses from "../components/TrackDetails/TrackCourses";
import FeedbackPanel from "../components/FeedbackPanel";
import EmptyState from "../components/EmptyState";
import { trackCoverImage, trackGradient } from "../utils/trackVisuals";
import usePageTitle from "../hooks/usePageTitle";

/** Returns true only for valid 24-character hex MongoDB ObjectIds. */
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const TrackDetailsPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
        if (cancelled) return;
        // The track list sends raw progress entries; pick out the caller's own.
        setSessions(
          res.data.sessions.map((s) => {
            if (s.myProgress) return s;
            const mine = s.progress?.find((p) => p.student === user._id);
            return mine ? { ...s, myProgress: { status: mine.status, watchedAt: mine.watchedAt } } : s;
          }),
        );
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

  // Members and staff get the full session list with watch links; everyone
  // else sees the public catalog with a "members only" note.
  const canWatchSessions =
    !!user &&
    (user.enrolledTrack === trackId || user.role === "admin" || user.role === "instructor");

  const nextSessionLabel = useMemo(() => {
    const now = Date.now();
    const dates = (canWatchSessions ? sortedSessions : sessionCatalog)
      .map((s) => (s.startDate ? new Date(s.startDate).getTime() : NaN))
      .filter((t) => t > now)
      .sort((a, b) => a - b);
    return dates.length
      ? new Date(dates[0]).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : undefined;
  }, [sortedSessions, sessionCatalog, canWatchSessions]);

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
  const isStaff = !!user && (user.role === "admin" || user.role === "instructor");

  // ── Tabs ─────────────────────────────────────────────────────

  const tabs: TrackTab[] = [
    { id: "overview", name: "Overview" },
    { id: "courses", name: "Courses", count: courses.length },
    {
      id: "sessions",
      name: "Sessions",
      count: canWatchSessions ? sessions.length : sessionCatalog.length,
    },
    { id: "weekly-tasks", name: "Weekly tasks" },
    { id: "assignments", name: "Assignments" },
    { id: "reviews", name: "Reviews" },
  ];
  // ?tab= keeps the open tab shareable; old #section links still open their tab.
  // (Not the hash itself: useScrollToHash scrolls on every hash change.)
  const requestedTab =
    new URLSearchParams(location.search).get("tab") ?? location.hash.replace("#", "");
  const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : "overview";
  const selectTab = (id: string) =>
    navigate(
      // Keep ?tab=overview while an old #section hash is present, or the hash wins again.
      { search: id === "overview" && !location.hash ? "" : `?tab=${id}`, hash: location.hash },
      { replace: true, preventScrollReset: true },
    );

  // ── Hero values ───────────────────────────────────────────────

  const heroTitle = liveTrack?.title ?? "Track";
  usePageTitle(liveTrack?.title);
  const heroSubtitle = liveTrack?.description ?? "";
  const heroImage = trackCoverImage(liveTrack?.coverImage);

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
            className="inline-block bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Browse Tracks
          </Link>
        </div>
      </div>
    );
  }

  // Members-only tabs explain how to get in instead of showing nothing.
  const lockedState = (what: string) => {
    if (authLoading) return null;
    if (!user) {
      return (
        <EmptyState
          icon={Lock}
          message={`Sign in and join this track to see its ${what}.`}
          action={
            <Link
              to="/signin"
              state={{ from: location }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          }
        />
      );
    }
    if (isStaff) {
      return (
        <EmptyState
          icon={Lock}
          message={`Members see their ${what} here. You can manage them from your dashboard.`}
          action={
            <Link
              to={user.role === "admin" ? "/admin" : "/instructor"}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
            >
              Open dashboard
            </Link>
          }
        />
      );
    }
    return <EmptyState icon={Lock} message={`Join this track to see its ${what}.`} />;
  };

  const sectionHeading = (title: string) => (
    <h2 className="mb-6 text-2xl font-bold text-primary-darker">{title}</h2>
  );

  const skeleton = (count: number, height: string) => (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, n) => (
        <div key={n} className={`${height} animate-pulse rounded-xl bg-gray-200`} />
      ))}
    </div>
  );

  const renderPanel = () => {
    switch (activeTab) {
      case "courses":
        return <TrackCourses courses={courses} />;
      case "sessions":
        if (authLoading) return skeleton(3, "h-16");
        return canWatchSessions && !sessionsUnauthorized ? (
          <TrackSessionsTable
            sessions={sortedSessions}
            canWatch
            signedIn
            isEnrolled={isEnrolled}
            onWatched={handleSessionWatched}
          />
        ) : (
          <TrackSessionsTable
            sessions={[]}
            catalogSessions={sessionCatalog}
            canWatch={false}
            signedIn={!!user}
            isEnrolled={false}
          />
        );
      case "weekly-tasks":
        if (!isEnrolled || weeklyTasksUnauthorized) {
          return (
            <>
              {sectionHeading("Weekly tasks")}
              {lockedState("weekly tasks")}
            </>
          );
        }
        return weeklyTasksLoading ? (
          <>
            {sectionHeading("Weekly tasks")}
            {skeleton(3, "h-16")}
          </>
        ) : (
          <TrackWeeklyTasks tasks={weeklyTasks} />
        );
      case "assignments":
        if (!isEnrolled || assignmentsUnauthorized) {
          return (
            <>
              {sectionHeading("Assignments")}
              {lockedState("assignments")}
            </>
          );
        }
        return assignmentsLoading ? (
          <>
            {sectionHeading("Assignments")}
            {skeleton(2, "h-24")}
          </>
        ) : (
          <TrackAssignments
            assignments={assignments}
            isEnrolled={isEnrolled}
            onSubmissionUpdate={handleAssignmentSubmission}
          />
        );
      case "reviews":
        return <FeedbackPanel subject="track" subjectId={trackId ?? ""} />;
      default:
        return (
          <TrackOverview
            trackId={trackId ?? ""}
            track={liveTrack}
            overview={heroSubtitle || "No overview available yet."}
            nextSession={nextSessionLabel}
            courseCount={courses.length}
          />
        );
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-16">
      <TrackHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={heroImage}
        gradient={trackGradient(trackId ?? "")}
        action={liveTrack ? <TrackJoinAction trackId={trackId ?? ""} /> : null}
        level={liveTrack?.level}
        studentCount={liveTrack?.studentCount}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <TrackTabs tabs={tabs} active={activeTab} onChange={selectTab} />

        <div
          role="tabpanel"
          id={panelId(activeTab)}
          aria-labelledby={tabId(activeTab)}
          tabIndex={0}
          className="mt-8 focus:outline-none"
        >
          {renderPanel()}
        </div>
      </div>
    </div>
  );
};

export default TrackDetailsPage;
