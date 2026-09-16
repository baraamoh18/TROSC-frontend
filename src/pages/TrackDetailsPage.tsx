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
} from "../services/api";
import TrackHero from "../components/TrackDetails/TrackHero";
import TrackTabs from "../components/TrackDetails/TrackTabs";
import TrackOverview from "../components/TrackDetails/TrackOverview";
import TrackSessionsSummary from "../components/TrackDetails/TrackSessionsSummary";
import TrackWeeklyTasks from "../components/TrackDetails/TrackWeeklyTasks";
import TrackSessionsTable from "../components/TrackDetails/TrackSessionsTable";
import TrackAssignments from "../components/TrackDetails/TrackAssignments";
import TrackCourses from "../components/TrackDetails/TrackCourses";
import TrackLearningPath from "../components/TrackDetails/TrackLearningPath";
import TrackResources from "../components/TrackDetails/TrackResources";
import TrackSchedule from "../components/TrackDetails/TrackSchedule";
import TrackCertificate from "../components/TrackDetails/TrackCertificate";
import TrackFeedback from "../components/TrackDetails/TrackFeedback";
import Divider from "../components/Divider";
import ComingSoonNotice from "../components/ComingSoonNotice";

const BACKEND_PLACEHOLDER = "https://placehold.co/800x400?text=Trosc+Track";

/** Returns true only for valid 24-character hex MongoDB ObjectIds. */
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const TrackDetailsPage = () => {
  const { trackId } = useParams<{ trackId: string }>();

  // Guard: if the URL segment isn't a valid MongoDB ObjectId we know it won't
  // match anything in the database — show a clear message instead of firing
  // requests that will always 400/500.
  if (!trackId || !isValidObjectId(trackId)) {
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

  // ── State ────────────────────────────────────────────────────

  const [liveTrack, setLiveTrack] = useState<BackendTrack | null>(null);

  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [sessionsUnauthorized, setSessionsUnauthorized] = useState(false);

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
    if (!trackId) return;
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
  }, [trackId]);

  // Sessions (requires auth)
  useEffect(() => {
    if (!trackId) return;
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
  }, [trackId]);

  // Courses by track (public)
  useEffect(() => {
    if (!trackId) return;
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
  }, [trackId]);

  // Weekly tasks (requires auth)
  useEffect(() => {
    if (!trackId) return;
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
  }, [trackId]);

  // Assignments (requires auth)
  useEffect(() => {
    if (!trackId) return;
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
  }, [trackId]);

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
  // Recordings are sessions that have a primary URL (video/embed).
  const trackResources = useMemo(() => {
    const pdfs = sortedSessions.flatMap((s) =>
      s.resources.map((r) => r.title),
    );
    const recordings = sortedSessions
      .filter((s) => !!s.url)
      .map((s) => s.title);
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
  const handleAssignmentSubmission = (assignmentId: string, fileUrl: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === assignmentId
          ? {
              ...a,
              mySubmission: {
                student: "",
                file: fileUrl,
                submittedAt: new Date().toISOString(),
              },
            }
          : a,
      ),
    );
  };

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

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-4 py-2 border border-gray-300 rounded-full pl-10 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

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
            <div className="py-4">
              <Divider />
            </div>
            {sessionsUnauthorized ? (
              <ComingSoonNotice message="Sign in to view this track's sessions." />
            ) : (
              <TrackSessionsSummary sessions={sortedSessions.slice(0, 3)} />
            )}
          </section>

          <Divider />

          {/* Weekly Tasks */}
          <section id="weekly-tasks" className="scroll-mt-32">
            {weeklyTasksUnauthorized ? (
              <ComingSoonNotice message="Sign in to view weekly tasks." />
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

          {/* Courses */}
          <section id="courses" className="scroll-mt-32">
            <TrackCourses courses={courses} />
          </section>

          <Divider />

          {/* Sessions */}
          <section id="sessions" className="scroll-mt-32">
            {sessionsUnauthorized ? (
              <ComingSoonNotice message="Sign in to view this track's sessions." />
            ) : (
              <TrackSessionsTable sessions={sortedSessions} />
            )}
          </section>

          <Divider />

          {/* Assignments */}
          <section id="assignments" className="scroll-mt-32">
            {assignmentsUnauthorized ? (
              <ComingSoonNotice message="Sign in to view assignments." />
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
              <>
                <TrackAssignments
                  assignments={assignments}
                  onSubmissionUpdate={handleAssignmentSubmission}
                />
                <TrackLearningPath path={[]} />
              </>
            )}
          </section>

          <Divider />

          {/* Resources */}
          <section id="resources" className="scroll-mt-32">
            {trackResources.pdfs.length === 0 && trackResources.recordings.length === 0 ? (
              <ComingSoonNotice
                message="Track resources will appear here once sessions have attached materials."
                className="mb-6"
              />
            ) : null}
            <TrackResources resources={trackResources} />
          </section>

          {/* Schedule & Certificate */}
          <section id="schedule" className="scroll-mt-32">
            {scheduleItems.length === 0 && (
              <ComingSoonNotice
                message="Session dates will appear here once sessions have scheduled start dates."
                className="mb-6"
              />
            )}
            <TrackSchedule upcoming={scheduleItems} />
            <TrackCertificate
              certificate={{
                includes: [
                  "Your Name",
                  "Completion Date",
                  "Skill Level Achieved",
                  "Instructor Signature",
                ],
              }}
            />
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
