import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Video } from "lucide-react";
import * as api from "../services/api";
import type { EnrollmentsResponse } from "../services/api";
import { useAuth } from "../context/useAuth";

const MyEnrollments = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<EnrollmentsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .getMyEnrollments()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        // No enrollments yet or request failed; section just won't render details
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Not logged in, or still resolving auth: don't show this section at all.
  if (authLoading || !user) return null;

  // Backend returns tracks[] array; pick the first one (users can only be in one track).
  const enrolledTrack = data?.tracks?.[0] ?? null;

  return (
    // First section on the page, so it clears the fixed navbar.
    <section className="w-full bg-neutral-light px-6 pb-10 pt-26">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="mb-6 text-3xl font-extrabold text-primary-darker">
          My Track
        </h2>

        {loading ? (
          <div className="h-24 rounded-xl bg-gray-200 animate-pulse" />
        ) : enrolledTrack ? (
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-light-active bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-darker mb-1">
                {enrolledTrack.title}
              </h3>
              <p className="text-sm text-neutral-dark flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={16} /> {data?.courses.length ?? 0} course
                  {(data?.courses.length ?? 0) === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Video size={16} /> {data?.sessions.length ?? 0} session
                  {(data?.sessions.length ?? 0) === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <Link
              to={`/track/${enrolledTrack._id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-hover"
            >
              <GraduationCap size={18} />
              Go to Track
            </Link>
          </div>
        ) : user.pendingTrack ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-800">
            Your request to join a track is waiting for approval.{" "}
            <Link to={`/track/${user.pendingTrack}`} className="text-primary font-semibold hover:text-primary-hover">
              View track
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-neutral-dark">
            You haven't joined a track yet.{" "}
            <Link to="/#tracks" className="text-primary font-semibold hover:text-primary-hover">
              Browse tracks
            </Link>{" "}
            to get started.
          </div>
        )}
      </div>
    </section>
  );
};

export default MyEnrollments;
