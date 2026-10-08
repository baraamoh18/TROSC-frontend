import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, Clock, Layers, Loader2, UserCircle, Video } from "lucide-react";
import * as api from "../services/api";
import type { BackendCourse, BackendSession } from "../services/api";
import type { TrackItem } from "../data/tracksData";
import TrackCard from "../sections/trackCard";
import Reveal from "../components/Reveal";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import { realImage, toTrackItem, trackGradient } from "../utils/trackVisuals";
import { isOpenCourse, isOpenSession } from "../utils/catalog";
import { smoothScrollToId } from "../utils/smoothScroll";
import { delay } from "../utils/motion";

const TRACK_PAGE_SIZE = 9;

const SECTIONS = [
  { id: "tracks", label: "Tracks" },
  { id: "courses", label: "Courses" },
  { id: "sessions", label: "Open sessions" },
];

const SectionHeading = ({ id, title, text }: { id: string; title: string; text: string }) => (
  <Reveal className="mb-8">
    <h2 id={`${id}-title`} className="text-3xl font-extrabold text-brand-darker">
      {title}
    </h2>
    <p className="mt-2 max-w-2xl text-neutral-dark">{text}</p>
  </Reveal>
);

const CardSkeletons = ({ count = 3, className = "h-72" }: { count?: number; className?: string }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, n) => (
      <div key={n} className={`${className} animate-pulse rounded-xl bg-gray-200`} />
    ))}
  </div>
);

const JoinedBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-xs font-bold text-success-ink">
    <CheckCircle2 size={13} aria-hidden="true" />
    {label}
  </span>
);

// ── Tracks ────────────────────────────────────────────────────

function TracksSection() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadPage = useCallback((pageNum: number) => {
    const first = pageNum === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    return api
      .getTracks(`published=true&limit=${TRACK_PAGE_SIZE}&page=${pageNum}`)
      .then((res) => {
        const items = res.data.tracks.map(toTrackItem);
        setTracks((prev) => (first ? items : [...prev, ...items]));
        setTotal(res.total);
        setPage(pageNum);
        setFailed(false);
      })
      .catch(() => {
        if (first) setFailed(true);
      })
      .finally(() => {
        if (first) setLoading(false);
        else setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  return (
    <section id="tracks" aria-labelledby="tracks-title" className="scroll-mt-20 bg-page px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="tracks"
          title="Tracks"
          text="A full program: courses, weekly sessions and an instructor who reviews your work. You can be in one track at a time."
        />
        {loading ? (
          <CardSkeletons />
        ) : failed ? (
          <EmptyState
            icon={Layers}
            message="We couldn't load the tracks."
            action={
              <button type="button" onClick={() => loadPage(1)} className="font-semibold text-brand hover:text-brand-hover">
                Try again
              </button>
            }
          />
        ) : tracks.length === 0 ? (
          <EmptyState icon={Layers} message="No tracks have been published yet." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track, i) => (
                <Reveal key={track.id} delay={(i % 3) * 100} className="flex">
                  <TrackCard track={track} />
                </Reveal>
              ))}
            </div>
            {tracks.length < total && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => loadPage(page + 1)}
                  disabled={loadingMore}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-light-active bg-surface px-6 font-bold text-neutral-darker transition-colors hover:border-primary hover:text-brand disabled:opacity-60"
                >
                  {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  Show more tracks ({total - tracks.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ── Courses on their own ──────────────────────────────────────

const CourseCard = ({ course, enrolled }: { course: BackendCourse; enrolled: boolean }) => {
  const cover = realImage(course.coverImage);
  const sessions = course.sessionCount ?? course.sessions?.length ?? 0;
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-surface shadow-md transition-[box-shadow,translate] duration-300 hover:shadow-xl motion-safe:hover:-translate-y-1 card-glow">
      <div className="h-40 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-40 w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-40 w-full items-center justify-center transition-transform duration-500 motion-safe:group-hover:scale-105"
            style={{ background: trackGradient(course._id) }}
          >
            <BookOpen size={40} className="text-white/50" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">{course.level}</span>
          {enrolled && <JoinedBadge label="Enrolled" />}
        </div>
        <h3 className="mb-2 text-lg font-bold text-neutral-darker">
          {/* The link covers the whole card. */}
          <Link to={`/courses/${course._id}`} className="after:absolute after:inset-0 group-hover:text-brand">
            {course.title}
          </Link>
        </h3>
        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-dark">{course.description}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-dark">
          <span className="inline-flex items-center gap-1">
            <Video size={14} aria-hidden="true" />
            {sessions} session{sessions === 1 ? "" : "s"}
          </span>
          {course.instructor?.name && (
            <span className="inline-flex items-center gap-1">
              <UserCircle size={14} aria-hidden="true" />
              {course.instructor.name}
            </span>
          )}
        </p>
      </div>
    </article>
  );
};

function CoursesSection() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<BackendCourse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getCourses("published=true&limit=100")
      .then((res) => {
        if (!cancelled) setCourses(res.data.courses.filter(isOpenCourse));
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 bg-page-alt px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="courses"
          title="Courses on their own"
          text="Take a single course without joining a track. Enroll and start straight away."
        />
        {courses === null ? (
          <CardSkeletons />
        ) : courses.length === 0 ? (
          <EmptyState icon={BookOpen} message="No standalone courses right now. Every course currently belongs to a track." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <Reveal key={c._id} delay={(i % 3) * 100} className="flex">
                <CourseCard course={c} enrolled={!!user?.enrolledCourses?.includes(c._id)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Open sessions ─────────────────────────────────────────────

/** Upcoming sessions first (soonest first), then undated, then past (newest first). */
const sessionOrder = (a: BackendSession, b: BackendSession) => {
  const now = Date.now();
  const rank = (s: BackendSession) => {
    if (!s.startDate) return [1, 0];
    const t = Date.parse(s.startDate);
    return t >= now ? [0, t] : [2, -t];
  };
  const [ra, ta] = rank(a);
  const [rb, tb] = rank(b);
  return ra - rb || ta - tb;
};

const SessionRow = ({ session, joined }: { session: BackendSession; joined: boolean }) => {
  const start = session.startDate ? new Date(session.startDate) : null;
  const upcoming = !!start && start.getTime() >= Date.now();
  return (
    <article className="group relative flex items-center gap-4 rounded-xl border border-neutral-light-active bg-surface p-4 shadow-sm transition-[box-shadow,translate] duration-300 hover:shadow-lg motion-safe:hover:-translate-y-0.5 sm:p-5 card-glow">
      <div
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg ${
          upcoming ? "bg-primary text-white" : "bg-primary-light text-brand-dark"
        }`}
        aria-hidden="true"
      >
        {start ? (
          <>
            <span className="text-xs font-bold uppercase">{start.toLocaleString(undefined, { month: "short" })}</span>
            <span className="text-2xl font-extrabold leading-none">{start.getDate()}</span>
          </>
        ) : (
          <Video size={24} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            {upcoming ? "Upcoming" : start ? "Recording" : session.level}
          </span>
          {joined && <JoinedBadge label="Joined" />}
        </div>
        <h3 className="font-bold text-neutral-darker">
          <Link to={`/sessions/${session._id}`} className="after:absolute after:inset-0 group-hover:text-brand">
            {session.title}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-dark">
          {start && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} aria-hidden="true" />
              {start.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          {session.duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden="true" />
              {session.duration} min
            </span>
          ) : null}
          {session.instructor?.name && (
            <span className="inline-flex items-center gap-1">
              <UserCircle size={14} aria-hidden="true" />
              {session.instructor.name}
            </span>
          )}
        </p>
      </div>
    </article>
  );
};

function SessionsSection() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState<BackendSession[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    setSessions(null);
    api
      .getSessions("access=public&published=true&limit=100")
      .then((res) => setSessions(res.data.sessions.filter(isOpenSession).sort(sessionOrder)))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    // The session list needs a signed-in user.
    if (user) load();
  }, [user, load]);

  let body;
  if (authLoading) {
    body = <CardSkeletons count={2} className="h-24" />;
  } else if (!user) {
    body = (
      <EmptyState
        icon={Video}
        message="Sign in to see the open sessions you can join."
        action={
          <Link
            to="/signin"
            state={{ from: { pathname: location.pathname, hash: "#sessions" } }}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        }
      />
    );
  } else if (failed) {
    body = (
      <EmptyState
        icon={Video}
        message="We couldn't load the open sessions."
        action={
          <button type="button" onClick={load} className="font-semibold text-brand hover:text-brand-hover">
            Try again
          </button>
        }
      />
    );
  } else if (sessions === null) {
    body = <CardSkeletons count={2} className="h-24" />;
  } else if (sessions.length === 0) {
    body = <EmptyState icon={Video} message="No open sessions right now. New ones will show up here." />;
  } else {
    body = (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sessions.map((s, i) => (
          <Reveal key={s._id} delay={(i % 2) * 80}>
            <SessionRow session={s} joined={!!user.enrolledSessions?.includes(s._id)} />
          </Reveal>
        ))}
      </div>
    );
  }

  return (
    <section id="sessions" aria-labelledby="sessions-title" className="scroll-mt-20 bg-page px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="sessions"
          title="Open sessions"
          text="One-off sessions anyone can join. No track or course needed."
        />
        {body}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

const ExplorePage = () => {
  usePageTitle("Explore");

  return (
    <div className="pt-16">
      <header className="bg-page-alt px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <p className="anim-rise mb-4 text-sm font-bold uppercase tracking-widest text-brand">Explore</p>
          <h1
            className="anim-rise max-w-3xl text-4xl font-extrabold leading-tight text-brand-darker sm:text-5xl"
            style={delay(80)}
          >
            Find what to learn next.
          </h1>
          <p
            className="anim-rise mt-5 max-w-2xl text-base leading-relaxed text-neutral-dark sm:text-lg"
            style={delay(160)}
          >
            Join a full track, or pick a single course or session on its own.
          </p>
          <nav
            aria-label="On this page"
            className="anim-rise mt-8 flex flex-wrap gap-2"
            style={delay(240)}
          >
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollToId(s.id);
                  window.history.replaceState(null, "", `#${s.id}`);
                }}
                className="inline-flex min-h-11 items-center rounded-lg border border-neutral-light-active bg-surface px-5 text-sm font-bold text-neutral-darker transition-colors hover:border-primary hover:text-brand"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <TracksSection />
      <CoursesSection />
      <SessionsSection />
    </div>
  );
};

export default ExplorePage;
