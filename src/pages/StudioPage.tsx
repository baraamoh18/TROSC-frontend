import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StudioNav from "../components/Studio/StudioNav";
import Combobox from "../components/Combobox";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileText,
  FolderTree,
  History,
  Inbox,
  LayoutGrid,
  ListChecks,
  Megaphone,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as api from "../services/api";
import type { AuthUser, BackendAssignment, BackendCourse, BackendSession, BackendTrack } from "../services/api";
import { useAuth } from "../context/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import EmptyState from "../components/EmptyState";
import StudioRequests from "../components/Studio/StudioRequests";
import StudioSessions from "../components/Studio/StudioSessions";
import StudioAssignments from "../components/Studio/StudioAssignments";
import StudioGrading from "../components/Studio/StudioGrading";
import StudioWeeklyTasks from "../components/Studio/StudioWeeklyTasks";
import StudioOverview from "../components/Studio/StudioOverview";
import StudioMine from "../components/Studio/StudioMine";
import UserManagementTable from "../components/Admin/UserManagementTable";
import ContentManagement from "../components/Admin/ContentManagement";
import ActivityLogPanel from "../components/Admin/ActivityLogPanel";
import { inputCls, refId } from "../components/Studio/studioUi";
import type { CanManage } from "../components/Studio/studioUi";

type SectionId =
  | "requests"
  | "sessions"
  | "assignments"
  | "grading"
  | "weekly-tasks"
  | "mine"
  | "overview"
  | "users"
  | "catalog"
  | "events"
  | "announcements"
  | "activity";

interface SectionDef {
  id: SectionId;
  name: string;
  icon: LucideIcon;
  /**
   * "track" sections work on the picked track, "mine" on the person's own
   * courses and sessions, and "platform" ones are admin-only.
   */
  group: "track" | "mine" | "platform";
}

const SECTIONS: SectionDef[] = [
  { id: "requests", name: "Requests", icon: Inbox, group: "track" },
  { id: "sessions", name: "Sessions", icon: CalendarClock, group: "track" },
  { id: "assignments", name: "Assignments", icon: FileText, group: "track" },
  { id: "grading", name: "Grading", icon: ClipboardCheck, group: "track" },
  { id: "weekly-tasks", name: "Weekly tasks", icon: ListChecks, group: "track" },
  { id: "mine", name: "My courses & sessions", icon: BookOpen, group: "mine" },
  { id: "overview", name: "Overview", icon: BarChart3, group: "platform" },
  { id: "users", name: "Users", icon: Users, group: "platform" },
  { id: "catalog", name: "Tracks & courses", icon: FolderTree, group: "platform" },
  { id: "events", name: "Events", icon: CalendarDays, group: "platform" },
  { id: "announcements", name: "Announcements", icon: Megaphone, group: "platform" },
  { id: "activity", name: "Activity", icon: History, group: "platform" },
];

/** Assignments across the track. The track route is built for members, so fall
 *  back to the per-course and per-session lists if staff are refused. */
async function loadTrackAssignments(
  trackId: string,
  courses: BackendCourse[],
  sessions: BackendSession[],
): Promise<BackendAssignment[]> {
  try {
    return (await api.getAssignmentsByTrack(trackId)).data.assignments;
  } catch {
    const lists = await Promise.allSettled([
      ...courses.map((c) => api.getAssignmentsByCourse(c._id)),
      ...sessions.map((s) => api.getAssignmentsBySession(s._id)),
    ]);
    const byId = new Map<string, BackendAssignment>();
    lists.forEach((r) => {
      if (r.status === "fulfilled") r.value.data.assignments.forEach((a) => byId.set(a._id, a));
    });
    return [...byId.values()];
  }
}

const StudioPage = () => {
  usePageTitle("Studio");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const isStaff = !!user && (user.role === "admin" || user.role === "instructor");

  const [tracks, setTracks] = useState<BackendTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);

  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [looseSessions, setLooseSessions] = useState<BackendSession[]>([]);
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [pendingStudents, setPendingStudents] = useState<AuthUser[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<AuthUser[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);

  // ── Tracks this person can manage ────────────────────────────
  const fetchTracks = useCallback(async () => {
    if (!user || !isStaff) return;
    setTracksLoading(true);
    try {
      // Admins manage every track; instructors the ones they lead or co-instruct.
      // Both lists include the caller's drafts.
      const res = await api.getTracks(
        user.role === "admin" ? "limit=100&sort=-createdAt" : `instructor=${user._id}&limit=100&sort=-createdAt`,
      );
      setTracks(res.data?.tracks ?? []);
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  }, [user, isStaff]);

  useEffect(() => {
    if (!authLoading) fetchTracks();
  }, [authLoading, fetchTracks]);

  const requestedTrack = params.get("track");
  const trackId = tracks.some((t) => t._id === requestedTrack) ? requestedTrack! : tracks[0]?._id ?? null;
  const track = tracks.find((t) => t._id === trackId) ?? null;
  const isAdmin = user?.role === "admin";
  const available = SECTIONS.filter((s) => s.group !== "platform" || isAdmin);
  const requested = available.find((s) => s.id === params.get("section"));
  // Admins land on the platform overview, instructors on their requests, or
  // on their own courses and sessions when they have no track.
  const landing = isAdmin ? "overview" : !tracksLoading && tracks.length === 0 ? "mine" : "requests";
  const active = requested ?? available.find((s) => s.id === landing)!;
  const section = active.id;
  const isTrackSection = active.group === "track";
  // Lead and co-instructors manage everything in their track; others only their own items.
  const isTrackStaff =
    !!user &&
    !!track &&
    (refId(track.instructor) === user._id || (track.instructors ?? []).some((u) => u._id === user._id));
  const canManage: CanManage = (owner) => isAdmin || isTrackStaff || (!!user && refId(owner) === user._id);

  const setParam = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true },
    );

  // ── Track content ────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    if (!trackId) return;
    setPendingLoading(true);
    try {
      const res = await api.getTrackPending(trackId);
      setPendingStudents(res.data?.pendingStudents ?? []);
      setPendingLeaves(res.data?.pendingLeaves ?? []);
    } catch {
      setPendingStudents([]);
      setPendingLeaves([]);
    } finally {
      setPendingLoading(false);
    }
  }, [trackId]);

  const fetchContent = useCallback(async () => {
    if (!trackId || !user) return;
    setContentLoading(true);
    const [c, s, mine] = await Promise.allSettled([
      api.getCoursesByTrack(trackId),
      api.getSessionsByTrack(trackId),
      api.getSessionsByInstructor(user._id),
    ]);
    const nextCourses = c.status === "fulfilled" ? c.value.data.courses : [];
    const nextSessions = s.status === "fulfilled" ? s.value.data.sessions : [];
    setCourses(nextCourses);
    setSessions(nextSessions);
    setLooseSessions(
      mine.status === "fulfilled" ? mine.value.data.sessions.filter((x) => (x.tracks?.length ?? 0) === 0) : [],
    );
    setAssignments(await loadTrackAssignments(trackId, nextCourses, nextSessions));
    setContentLoading(false);
  }, [trackId, user]);

  useEffect(() => {
    fetchPending();
    fetchContent();
  }, [fetchPending, fetchContent]);

  const counts = useMemo<Partial<Record<SectionId, number>>>(
    () => ({
      requests: pendingStudents.length + pendingLeaves.length,
      grading: assignments.reduce((n, a) => n + (a.ungradedCount ?? 0), 0),
    }),
    [pendingStudents, pendingLeaves, assignments],
  );

  // ── Gates ────────────────────────────────────────────────────
  if (authLoading) return null;

  if (!user || !isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page pt-16">
        <div className="px-4 text-center">
          <ShieldAlert size={48} className="mx-auto mb-3 text-brand" aria-hidden="true" />
          <h1 className="mb-3 text-3xl font-bold text-neutral-darker">Restricted area</h1>
          <p className="text-neutral-dark">The Studio is for instructors and admins.</p>
          <button
            type="button"
            onClick={() => navigate(user ? "/dashboard" : "/signin")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            {user ? "Go to my dashboard" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (section) {
      case "overview":
        return <StudioOverview tracks={tracks} />;
      case "mine":
        return <StudioMine userId={user._id} />;
      case "users":
        return <UserManagementTable currentUserId={user._id} />;
      case "activity":
        return <ActivityLogPanel />;
      case "catalog":
        return (
          <ContentManagement
            tracks={tracks}
            tracksLoading={tracksLoading}
            onRefreshTracks={fetchTracks}
            panels={["tracks", "courses"]}
          />
        );
      case "events":
      case "announcements":
        return (
          <ContentManagement
            key={section}
            tracks={tracks}
            tracksLoading={tracksLoading}
            onRefreshTracks={fetchTracks}
            panels={[section]}
          />
        );
    }

    if (tracksLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;
    if (!trackId) {
      return (
        <EmptyState
          message={
            isAdmin
              ? "There are no tracks yet. Create one under Tracks & courses."
              : "You don't lead or co-instruct a track yet. Once an admin adds you to one, it shows up here."
          }
          action={
            <button
              type="button"
              onClick={() => setParam({ section: isAdmin ? "catalog" : "mine" })}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
            >
              {isAdmin ? "Open Tracks & courses" : "Open my courses & sessions"}
            </button>
          }
        />
      );
    }
    if (contentLoading && section !== "requests") {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      );
    }
    switch (section) {
      case "sessions":
        return (
          <StudioSessions
            trackId={trackId}
            sessions={sessions}
            looseSessions={looseSessions}
            courses={courses}
            canManage={canManage}
            onChanged={fetchContent}
          />
        );
      case "assignments":
        return (
          <StudioAssignments
            assignments={assignments}
            courses={courses}
            sessions={sessions}
            canManage={canManage}
            onChanged={fetchContent}
            onGrade={(id) => setParam({ section: "grading", assignment: id })}
          />
        );
      case "grading":
        return (
          <StudioGrading
            assignments={assignments}
            courses={courses}
            sessions={sessions}
            canManage={canManage}
            selectedId={params.get("assignment")}
            onSelect={(id) => setParam({ assignment: id })}
            onGraded={fetchContent}
          />
        );
      case "weekly-tasks":
        return <StudioWeeklyTasks key={trackId} courses={courses} canManage={canManage} />;
      default:
        return (
          <StudioRequests
            trackId={trackId}
            pendingStudents={pendingStudents}
            pendingLeaves={pendingLeaves}
            loading={pendingLoading}
            onChanged={async () => {
              await fetchPending();
              fetchTracks();
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-page pb-20 pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-brand-darker">
              <LayoutGrid size={28} aria-hidden="true" />
              Studio
            </h1>
            <p className="mt-1 text-neutral-dark">
              {isAdmin
                ? "Track content and grading, plus users, the catalog, events, announcements and activity."
                : "Your own courses and sessions, plus requests, sessions, assignments, grading and weekly tasks for the tracks you lead or co-instruct."}
            </p>
          </div>
          {isTrackSection && tracks.length > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-72 max-w-full">
                <label htmlFor="studio-track" className="mb-1 block text-sm font-semibold text-gray-800">Track</label>
                <Combobox
                  id="studio-track"
                  triggerClassName={inputCls}
                  value={trackId ?? ""}
                  onChange={(v) => v && setParam({ track: v, assignment: null })}
                  searchPlaceholder="Search tracks…"
                  options={tracks.map((t) => ({
                    value: t._id,
                    label: t.title,
                    hint: t.published === false ? "Draft" : undefined,
                  }))}
                />
              </div>
              {track && (
                <Link
                  to={`/track/${track._id}`}
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  View track page
                </Link>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[210px_1fr]">
            <nav aria-label="Studio sections" className="md:sticky md:top-24 md:self-start">
              <StudioNav
                sections={available}
                activeId={section}
                counts={counts}
                onSelect={(id) => setParam({ section: id })}
              />
            </nav>

            <div className="min-w-0">
              <h2 className="mb-5 text-2xl font-bold text-brand-darker">{active.name}</h2>
              {renderSection()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudioPage;
