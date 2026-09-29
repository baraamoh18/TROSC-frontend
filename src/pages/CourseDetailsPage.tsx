import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  Lock,
  Globe,
  UserCircle,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../services/api";
import { ApiError } from "../services/api";
import type { BackendCourse, BackendSession } from "../services/api";
import { canSelfEnrollInCourse, isStaffUser } from "../utils/catalog";
import { isDefaultPhoto } from "../utils/photoUtils";
import { useAuth } from "../context/useAuth";
import FeedbackPanel from "../components/FeedbackPanel";
import usePageTitle from "../hooks/usePageTitle";

const BACKEND_PLACEHOLDER = "https://placehold.co/800x400?text=Trosc+Course";

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const AccessBadge = ({ access }: { access: BackendCourse["access"] }) => {
  if (access === "public")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        <Globe className="h-3 w-3" />
        Public
      </span>
    );
  if (access === "private")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        <Lock className="h-3 w-3" />
        Private
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
      <Layers className="h-3 w-3" />
      Track only
    </span>
  );
};

const CourseDetailsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const hasValidId = !!courseId && isValidObjectId(courseId);

  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  // ── Fetch course (server decides what a requester may see) ──
  useEffect(() => {
    if (!hasValidId || !courseId || authLoading) return;
    let cancelled = false;
    setLoading(true);
    setErrorStatus(null);
    api
      .getCourse(courseId)
      .then((res) => {
        if (!cancelled) setCourse(res.data.course);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) setErrorStatus(err.status);
        setCourse(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, hasValidId, authLoading]);

  usePageTitle(course?.title);

  // The course's sessions, for signed-in viewers (the session list needs a sign-in).
  const [sessions, setSessions] = useState<BackendSession[] | null>(null);
  const sessionCount = course?.sessions?.length ?? 0;
  useEffect(() => {
    if (!user || !courseId || sessionCount === 0) return;
    let cancelled = false;
    api
      .getSessions(`course=${courseId}&limit=100`)
      .then((res) => {
        if (cancelled) return;
        // Only this course's sessions, drafts only for staff.
        const own = res.data.sessions.filter((s) => s.course === courseId);
        setSessions(isStaffUser(user) ? own : own.filter((s) => s.published));
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, courseId, sessionCount]);

  if (!hasValidId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-16">
        <div className="px-4 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Course not found
          </h1>
          <p className="mb-6 text-gray-600">
            This course doesn't exist yet or hasn't been published.
          </p>
          <Link
            to="/"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const refetchCourse = async () => {
    try {
      const res = await api.getCourse(courseId!);
      setCourse(res.data.course);
    } catch {
      // Keep showing the current data if a refresh fails
    }
  };

  const handleEnroll = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.enrollInCourse(courseId!);
      toast.success("You're enrolled in this course!");
      await refreshUser();
      await refetchCourse();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enroll in course.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.leaveCourse(courseId!);
      toast.success("You've left this course.");
      setConfirmingLeave(false);
      await refreshUser();
      await refetchCourse();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to leave course.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="h-72 animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-16">
        <div className="px-4 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            {errorStatus === 401
              ? "Sign in to view this course"
              : errorStatus === 403
                ? "This course is locked"
                : "Course not found"}
          </h1>
          <p className="mb-6 text-gray-600">
            {errorStatus === 401
              ? "Course details are available to signed-in members."
              : errorStatus === 403
                ? "This course is only open to its members."
                : "It may have been removed, or the link is incorrect."}
          </p>
          {errorStatus === 401 ? (
            <Link
              to="/signin"
              className="inline-block rounded-lg bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Sign In
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-block rounded-lg bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Back to Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  const heroImage =
    course.coverImage && course.coverImage !== BACKEND_PLACEHOLDER
      ? course.coverImage
      : null;
  const isEnrolled = !!user && (user.enrolledCourses ?? []).includes(course._id);

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 mt-2 text-sm font-semibold text-neutral-dark">
          <Link
            to={course.track ? `/track/${course.track._id}` : "/explore#courses"}
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {course.track ? `Back to ${course.track.title}` : "Back to courses"}
          </Link>
        </div>

        {/* Hero */}
        <div
          className="relative flex h-72 items-end overflow-hidden rounded-xl bg-cover bg-center md:h-96"
          style={
            heroImage ? { backgroundImage: `url(${heroImage})` } : undefined
          }
        >
          {!heroImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 w-full p-8 text-white">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">
                <BarChart3 className="h-3.5 w-3.5" />
                {course.level}
              </span>
              <AccessBadge access={course.access} />
            </div>
            <h1 className="mb-2 text-4xl font-bold md:text-5xl">
              {course.title}
            </h1>
            {course.instructor?.name && (
              <p className="text-lg font-medium">{course.instructor.name}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(() => {
            const sessionTotal = course.sessionCount ?? course.sessions?.length ?? 0;
            const stats: {
              icon: LucideIcon;
              value: string | number;
              label: string;
            }[] = [
              {
                icon: BookOpen,
                value: sessionTotal,
                label: `Session${sessionTotal === 1 ? "" : "s"}`,
              },
              ...(course.duration
                ? [
                    {
                      icon: Clock,
                      value: `${course.duration}h`,
                      label: "Duration",
                    },
                  ]
                : []),
              {
                icon: Users,
                value: course.studentCount ?? course.students?.length ?? 0,
                label: "Enrolled",
              },
              {
                icon: ListChecks,
                value: course.syllabus?.length ?? 0,
                label: "Topics",
              },
            ];
            return stats.map((stat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <span className="rounded-full bg-primary-light p-2.5 text-primary">
                  <stat.icon size={20} />
                </span>
                <div>
                  <p className="text-lg font-extrabold text-neutral-darker">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-neutral-dark">
                    {stat.label}
                  </p>
                </div>
              </div>
            ));
          })()}
        </div>

        <div className="mt-10 space-y-10">
          {/* Overview */}
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-2xl font-extrabold text-primary-darker">
              Overview
            </h2>
            <p className="whitespace-pre-line text-base leading-8 text-neutral-dark">
              {course.description || "No overview available yet."}
            </p>
            {course.track && (
              <Link
                to={`/track/${course.track._id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-light px-5 py-2.5 text-sm font-bold text-primary-dark transition-colors hover:bg-primary-light-active"
              >
                <GraduationCap size={16} />
                Part of the {course.track.title} track
              </Link>
            )}
          </section>

          {/* Syllabus */}
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold text-primary-darker">
              <ListChecks size={22} />
              Syllabus
            </h2>
            {(course.syllabus?.length ?? 0) === 0 ? (
              <p className="text-sm text-neutral-dark">
                The syllabus hasn't been published yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {(course.syllabus ?? []).map((item, idx) => (
                  <li
                    key={item._id ?? idx}
                    className="flex gap-4 rounded-xl border border-neutral-light-active p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-neutral-darker">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-sm leading-6 text-neutral-dark">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Attachments */}
          {(course.attachments?.length ?? 0) > 0 && (
            <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold text-primary-darker">
                <FileText size={22} />
                Materials
              </h2>
              <ul className="space-y-2">
                {(course.attachments ?? []).map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover"
                    >
                      <Link2 size={15} className="shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sessions (signed-in only; the session list needs a sign-in) */}
          {user && sessionCount > 0 && (
            <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold text-primary-darker">
                <Video className="h-6 w-6" />
                Sessions
              </h2>
              {sessions === null ? (
                <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-neutral-dark">No sessions have been published yet.</p>
              ) : (
                <ul className="divide-y divide-neutral-light-active">
                  {sessions.map((s) => (
                    <li key={s._id}>
                      <Link
                        to={`/sessions/${s._id}`}
                        className="flex items-center justify-between gap-3 py-3 font-semibold text-neutral-darker transition-colors hover:text-primary"
                      >
                        <span className="min-w-0 truncate">{s.title}</span>
                        <span className="shrink-0 text-xs font-semibold text-neutral-dark">
                          {s.startDate
                            ? new Date(s.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            : s.duration
                              ? `${s.duration} min`
                              : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Enrollment */}
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-2xl font-extrabold text-primary-darker">
              {isEnrolled ? "You're enrolled" : "Join this course"}
            </h2>

            {!user ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-neutral-dark">
                  Sign in to enroll in this course.
                </p>
                <Link
                  to="/signin"
                  state={{ from: location }}
                  className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  Sign In
                </Link>
              </div>
            ) : isEnrolled ? (
              <div className="flex flex-col items-start gap-3">
                {!confirmingLeave ? (
                  <>
                    <p className="text-sm text-neutral-dark">
                      {course.track
                        ? "This course is in your enrollments. You can find its sessions on your track page."
                        : "This course is in your enrollments. Its sessions are listed above."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {course.track && (
                        <Link
                          to={`/track/${course.track._id}`}
                          className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
                        >
                          Go to Track
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmingLeave(true)}
                        className="rounded-lg border-2 border-primary-dark bg-white px-8 py-3 text-base font-bold text-primary-dark transition-colors hover:bg-primary-light"
                      >
                        Leave course
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border-2 border-primary-light-active bg-primary-light p-5">
                    <p className="mb-3 text-sm font-semibold text-primary-darker">
                      Leave this course? You can re-enroll later while it's
                      open.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleLeave}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark-hover disabled:opacity-50"
                      >
                        {actionLoading && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                        Yes, leave
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingLeave(false)}
                        disabled={actionLoading}
                        className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-neutral-darker transition-colors hover:bg-neutral-light-active disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isStaffUser(user) ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-neutral-dark">
                  Staff don't enroll in courses. Manage this course's sessions and assignments in the Studio.
                </p>
                <Link
                  to="/studio"
                  className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  Open the Studio
                </Link>
              </div>
            ) : !canSelfEnrollInCourse(course, user) ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-neutral-dark">
                  {course.access === "private"
                    ? "This course is invite-only. Ask its instructor to add you."
                    : course.track
                      ? `This course is part of the ${course.track.title} track. Join the track to take it.`
                      : "This course isn't open for enrollment yet."}
                </p>
                {course.access !== "private" && course.track && (
                  <Link
                    to={`/track/${course.track._id}`}
                    className="rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
                  >
                    View the track
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-neutral-dark">
                  Enroll to get access to this course's sessions, assignments,
                  and progress tracking.
                </p>
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading && <Loader2 size={18} className="animate-spin" />}
                  {actionLoading ? "Enrolling..." : "Enroll in course"}
                </button>
              </div>
            )}

            {course.instructor && (
              <div className="mt-8 flex items-center gap-3 border-t border-neutral-light-active pt-6">
                {!isDefaultPhoto(course.instructor.photo) ? (
                  <img loading="lazy"
                    src={course.instructor.photo}
                    alt={course.instructor.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle size={40} className="shrink-0 text-neutral" strokeWidth={1} />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-dark">
                    Instructor
                  </p>
                  <p className="font-bold text-neutral-darker">
                    {course.instructor.name}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Reviews */}
          <FeedbackPanel subject="course" subjectId={course._id} />
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
