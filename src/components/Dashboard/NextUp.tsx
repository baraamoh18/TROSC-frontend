import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, Circle, ClipboardList, ListChecks, Pin, X } from "lucide-react";
import * as api from "../../services/api";
import type { AuthUser, BackendAnnouncement, BackendAssignment, BackendSession, WeeklyTask } from "../../services/api";
import { TaskItemRow } from "../TrackDetails/TrackWeeklyTasks";
import { isDefaultPhoto } from "../../utils/photoUtils";

interface NextUpProps {
  user: AuthUser;
  /** The student's track, if they're in one. */
  trackId: string | null;
  /** Open sessions they joined outside a track. */
  ownSessions: BackendSession[];
}

const cardCls = "rounded-xl border border-neutral-light-active bg-white p-5 shadow-sm";
const cardTitle = "mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-dark";

const DAY = 24 * 60 * 60 * 1000;

/** "today", "tomorrow", "in 3 days" or "in 2 weeks". */
const fromNow = (iso: string) => {
  const days = Math.floor((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const hideKey = (userId: string) => `trosc:first-week-hidden:${userId}`;
const readHidden = (userId: string) => {
  try {
    return localStorage.getItem(hideKey(userId)) === "1";
  } catch {
    return false;
  }
};

/**
 * The student's home: the next session, assignments due, this week's tasks,
 * pinned announcements, and a getting-started checklist for new members.
 */
const NextUp = ({ user, trackId, ownSessions }: NextUpProps) => {
  const [trackSessions, setTrackSessions] = useState<BackendSession[]>([]);
  const [watchedAny, setWatchedAny] = useState<boolean | null>(null);
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [pinned, setPinned] = useState<BackendAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklistHidden, setChecklistHidden] = useState(() => readHidden(user._id));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWatchedAny(null);
    const track = trackId
      ? Promise.allSettled([
          api.getSessionsByTrack(trackId),
          api.getAssignmentsByTrack(trackId),
          api.getWeeklyTasksByTrack(trackId),
        ])
      : Promise.resolve(null);
    Promise.all([track, api.getFeed().catch(() => null)]).then(async ([t, feed]) => {
      if (cancelled) return;
      const sessions = t?.[0].status === "fulfilled" ? t[0].value.data.sessions.filter((s) => s.published) : [];
      setTrackSessions(sessions);
      setAssignments(t?.[1].status === "fulfilled" ? t[1].value.data.assignments : []);
      setTasks(t?.[2].status === "fulfilled" ? [...t[2].value.data.weeklyTasks].sort((a, b) => a.week - b.week) : []);
      setPinned((feed?.data.announcements ?? []).filter((a) => a.isPinned).slice(0, 2));
      setLoading(false);
      // Watched status lives only on each session's detail; ask about the ones that already started.
      const started = [...sessions, ...ownSessions].filter((s) => !s.startDate || Date.parse(s.startDate) <= Date.now());
      const details = await Promise.allSettled(started.slice(0, 10).map((s) => api.getSession(s._id)));
      if (!cancelled) {
        setWatchedAny(details.some((d) => d.status === "fulfilled" && d.value.data.session.myProgress?.status === "watched"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [trackId, ownSessions]);

  const now = Date.now();
  // Sessions that started in the last two hours still count: they may be running now.
  const nextSession = [...trackSessions, ...ownSessions]
    .filter((s) => s.startDate && Date.parse(s.startDate) > now - 2 * 60 * 60 * 1000)
    .sort((a, b) => Date.parse(a.startDate!) - Date.parse(b.startDate!))[0];
  const due = assignments
    .filter((a) => !a.mySubmission && Date.parse(a.deadline) > now)
    .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
  const overdue = assignments.filter((a) => !a.mySubmission && Date.parse(a.deadline) <= now).length;
  // "This week" is the first week that still has something left to do.
  const week = tasks.find((t) => t.items.some((i) => !i.done)) ?? null;
  const allTasksDone = tasks.length > 0 && !week;

  const steps = [
    { label: "Add a profile photo", done: !isDefaultPhoto(user.photo), to: "/settings" },
    {
      label: user.pendingTrack && !trackId ? "Join a track (request sent)" : "Join a track",
      done: !!trackId || !!user.pendingTrack,
      to: "/explore",
    },
    { label: "Watch your first session", done: !!watchedAny, to: trackId ? `/track/${trackId}?tab=sessions` : "/explore" },
    ...(assignments.length > 0
      ? [{ label: "Submit your first assignment", done: assignments.some((a) => a.mySubmission), to: `/track/${trackId}?tab=assignments` }]
      : []),
  ];
  const stepsLeft = steps.filter((s) => !s.done).length;
  // Wait for the watched check so a finished step doesn't flash as undone.
  const showChecklist = !loading && watchedAny !== null && !checklistHidden && stepsLeft > 0;

  const hideChecklist = () => {
    setChecklistHidden(true);
    try {
      localStorage.setItem(hideKey(user._id), "1");
    } catch {
      // Hidden for this visit only.
    }
  };

  const toggleItem = (taskId: string, itemId: string, done: boolean) =>
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, items: t.items.map((i) => (i._id === itemId ? { ...i, done } : i)) } : t)),
    );

  if (loading) {
    return (
      <section aria-label="Next up" className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
      </section>
    );
  }

  const linkCls = "font-semibold text-primary hover:text-primary-hover";

  return (
    <section aria-labelledby="next-up" className="mb-10">
      <h2 id="next-up" className="mb-4 text-2xl font-extrabold text-primary-darker">Next up</h2>

      {pinned.map((a) => (
        <div key={a._id} className="mb-4 flex gap-3 rounded-xl border border-primary/20 bg-primary-light/40 p-4">
          <Pin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-bold text-neutral-darker">{a.title}</p>
            <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-sm text-neutral-dark">{a.message}</p>
          </div>
        </div>
      ))}

      {showChecklist && (
        <div className={`${cardCls} mb-4`}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-neutral-darker">Getting started</p>
              <p className="text-sm text-neutral-dark">
                {steps.length - stepsLeft} of {steps.length} done
              </p>
            </div>
            <button
              type="button"
              onClick={hideChecklist}
              aria-label="Hide the getting started checklist"
              className="rounded-lg p-2 text-neutral-dark hover:bg-neutral-light"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.label}>
                {s.done ? (
                  <span className="flex min-h-10 items-center gap-2 text-sm text-neutral-dark line-through decoration-neutral">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
                    {s.label}
                    <span className="sr-only">(done)</span>
                  </span>
                ) : (
                  <Link to={s.to} className="flex min-h-10 items-center gap-2 text-sm font-semibold text-neutral-darker hover:text-primary">
                    <Circle size={18} className="shrink-0 text-neutral" aria-hidden="true" />
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className={cardCls}>
            <p className={cardTitle}>
              <CalendarClock size={16} aria-hidden="true" />
              Next session
            </p>
            {nextSession ? (
              <>
                <Link to={`/sessions/${nextSession._id}`} className="text-lg font-bold text-neutral-darker hover:text-primary">
                  {nextSession.title}
                </Link>
                <p className="mt-1 text-sm text-neutral-dark">
                  <span className="font-semibold text-primary">{fromNow(nextSession.startDate!)}</span>
                  {" · "}
                  {when(nextSession.startDate!)}
                  {nextSession.duration ? ` · ${nextSession.duration} min` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-neutral-dark">
                No sessions are scheduled.{" "}
                {trackId ? (
                  <Link to={`/track/${trackId}?tab=sessions`} className={linkCls}>
                    See all sessions
                  </Link>
                ) : (
                  <Link to="/explore#sessions" className={linkCls}>
                    Find an open session
                  </Link>
                )}
              </p>
            )}
          </div>

          {trackId && (
            <div className={cardCls}>
              <p className={cardTitle}>
                <ClipboardList size={16} aria-hidden="true" />
                Assignments due
              </p>
              {due.length === 0 && overdue === 0 ? (
                <p className="text-sm text-neutral-dark">Nothing due. You're all caught up.</p>
              ) : (
                <ul className="space-y-2">
                  {due.slice(0, 3).map((a) => (
                    <li key={a._id} className="flex items-baseline justify-between gap-3 text-sm">
                      <Link to={`/track/${trackId}?tab=assignments`} className="min-w-0 truncate font-semibold text-neutral-darker hover:text-primary">
                        {a.title}
                      </Link>
                      <span className="shrink-0 font-semibold text-primary">due {fromNow(a.deadline)}</span>
                    </li>
                  ))}
                  {overdue > 0 && (
                    <li className="text-sm font-semibold text-red-700">
                      {overdue} past the deadline and not submitted.{" "}
                      <Link to={`/track/${trackId}?tab=assignments`} className={linkCls}>
                        Open assignments
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        {trackId && (
          <div className={cardCls}>
            <p className={cardTitle}>
              <ListChecks size={16} aria-hidden="true" />
              {week ? `Week ${week.week}: ${week.title}` : "Weekly tasks"}
            </p>
            {week ? (
              <>
                <p className="mb-2 text-sm text-neutral-dark">
                  {week.items.filter((i) => i.done).length} of {week.items.length} done
                </p>
                <div>
                  {week.items.map((item) => (
                    <TaskItemRow
                      key={item._id}
                      item={item}
                      taskId={week._id}
                      onToggle={(itemId, done) => toggleItem(week._id, itemId, done)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-dark">
                {allTasksDone ? "Every weekly task is done. Nice work." : "No weekly tasks yet."}{" "}
                <Link to={`/track/${trackId}?tab=weekly-tasks`} className={linkCls}>
                  See all weeks
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NextUp;
