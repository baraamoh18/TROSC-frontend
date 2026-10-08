import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarClock, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, BackendCourse, BackendSession } from "../../services/api";
import EmptyState from "../EmptyState";
import ConfirmAction from "./ConfirmAction";
import CourseForm from "./CourseForm";
import SessionForm from "./SessionForm";
import StudioAssignments from "./StudioAssignments";
import StudioGrading from "./StudioGrading";
import { cardCls, errorMessage, formatDateTime, primaryBtn, smallBtn } from "./studioUi";
import { isOpenCourse, isOpenSession } from "../../utils/catalog";

/** Everything here is the person's own, so they can change all of it. */
const canManageOwn = () => true;

const badgeCls = "rounded-full px-2 py-0.5 text-xs font-bold";

const courseBadge = (c: BackendCourse) => {
  if (!c.published) return <span className={`${badgeCls} bg-warning-tint text-warning-ink`}>Draft</span>;
  if (c.track) return <span className={`${badgeCls} bg-gray-100 text-gray-700`}>In {c.track.title}</span>;
  if (isOpenCourse(c)) return <span className={`${badgeCls} bg-success-soft text-success-ink`}>On Explore</span>;
  return <span className={`${badgeCls} bg-gray-100 text-gray-700`}>Not listed</span>;
};

const sessionBadge = (s: BackendSession, courses: BackendCourse[]) => {
  if (!s.published) return <span className={`${badgeCls} bg-warning-tint text-warning-ink`}>Draft</span>;
  if (isOpenSession(s)) return <span className={`${badgeCls} bg-success-soft text-success-ink`}>Open session</span>;
  if ((s.tracks?.length ?? 0) > 0) return <span className={`${badgeCls} bg-gray-100 text-gray-700`}>In a track</span>;
  const course = courses.find((c) => c._id === s.course);
  if (s.course) return <span className={`${badgeCls} bg-gray-100 text-gray-700`}>In {course?.title ?? "a course"}</span>;
  return <span className={`${badgeCls} bg-gray-100 text-gray-700`}>Not listed</span>;
};

/**
 * Courses and sessions the signed-in instructor runs themselves, with or
 * without a track: any instructor may create standalone ones.
 */
const StudioMine = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<BackendCourse | "new" | null>(null);
  const [editingSession, setEditingSession] = useState<BackendSession | "new" | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);

  // The skeleton shows on the first load only; refreshes keep the lists in place.
  const load = useCallback(async () => {
    const [c, s] = await Promise.allSettled([
      api.getCoursesByInstructor(userId),
      api.getSessionsByInstructor(userId),
    ]);
    const nextCourses = c.status === "fulfilled" ? c.value.data.courses : [];
    const nextSessions = s.status === "fulfilled" ? s.value.data.sessions : [];
    setCourses(nextCourses);
    setSessions(nextSessions);
    const lists = await Promise.allSettled([
      ...nextCourses.map((x) => api.getAssignmentsByCourse(x._id)),
      ...nextSessions.map((x) => api.getAssignmentsBySession(x._id)),
    ]);
    const byId = new Map<string, BackendAssignment>();
    lists.forEach((r) => {
      if (r.status === "fulfilled") r.value.data.assignments.forEach((a) => byId.set(a._id, a));
    });
    setAssignments([...byId.values()]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Grading opens below the list; bring it into view.
  useEffect(() => {
    if (gradingId) document.getElementById("mine-grading")?.scrollIntoView({ block: "start" });
  }, [gradingId]);

  const run = async (call: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await call();
      toast.success(success);
      load();
    } catch (err) {
      toast.error(errorMessage(err, failure));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const sectionHead = (id: string, title: string, note: string, action: ReactNode) => (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 id={id} className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{note}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );

  return (
    <div className="space-y-10">
      <section aria-labelledby="mine-courses">
        {sectionHead(
          "mine-courses",
          "Courses",
          "Courses you teach. Published public ones outside a track are listed on Explore.",
          <button type="button" className={primaryBtn} onClick={() => setEditingCourse("new")}>
            <Plus size={16} aria-hidden="true" />
            New course
          </button>,
        )}
        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} message="You don't teach any courses yet." />
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => (
              <li key={c._id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link to={`/courses/${c._id}`} className="font-semibold text-gray-900 hover:text-brand">
                    {c.title}
                  </Link>
                  {courseBadge(c)}
                  <span className="text-xs text-gray-600">
                    {c.studentCount ?? 0} student{c.studentCount === 1 ? "" : "s"}
                  </span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <button type="button" className={`${smallBtn} text-gray-800 hover:bg-gray-100`} onClick={() => setEditingCourse(c)}>
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </button>
                  <ConfirmAction
                    label="Delete"
                    confirmLabel="Click to delete"
                    onConfirm={() => run(() => api.deleteCourse(c._id), "Course deleted.", "Couldn't delete it.")}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mine-sessions">
        {sectionHead(
          "mine-sessions",
          "Sessions",
          "Sessions you run. Published public ones outside a track and course are open sessions, listed on Explore.",
          <button type="button" className={primaryBtn} onClick={() => setEditingSession("new")}>
            <Plus size={16} aria-hidden="true" />
            New session
          </button>,
        )}
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarClock} message="You don't run any sessions yet." />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s._id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link to={`/sessions/${s._id}`} className="font-semibold text-gray-900 hover:text-brand">
                    {s.title}
                  </Link>
                  {sessionBadge(s, courses)}
                  <span className="text-xs text-gray-600">{formatDateTime(s.startDate)}</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <button type="button" className={`${smallBtn} text-gray-800 hover:bg-gray-100`} onClick={() => setEditingSession(s)}>
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </button>
                  <ConfirmAction
                    label="Delete"
                    confirmLabel="Click to delete"
                    onConfirm={() => run(() => api.deleteSession(s._id), "Session deleted.", "Couldn't delete it.")}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mine-assignments">
        <h3 id="mine-assignments" className="mb-4 text-lg font-bold text-gray-900">Assignments</h3>
        <StudioAssignments
          assignments={assignments}
          courses={courses}
          sessions={sessions}
          canManage={canManageOwn}
          scope="your courses and sessions"
          onChanged={load}
          onGrade={setGradingId}
        />
      </section>

      {gradingId && (
        <section aria-labelledby="mine-grading">
          <h3 id="mine-grading" className="mb-4 text-lg font-bold text-gray-900">Grading</h3>
          <StudioGrading
            assignments={assignments}
            courses={courses}
            sessions={sessions}
            canManage={canManageOwn}
            selectedId={gradingId}
            onSelect={setGradingId}
            onGraded={load}
          />
        </section>
      )}

      {editingCourse && (
        <CourseForm
          course={editingCourse === "new" ? undefined : editingCourse}
          onClose={() => setEditingCourse(null)}
          onSaved={load}
        />
      )}
      {editingSession && (
        <SessionForm
          courses={courses}
          session={editingSession === "new" ? undefined : editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default StudioMine;
