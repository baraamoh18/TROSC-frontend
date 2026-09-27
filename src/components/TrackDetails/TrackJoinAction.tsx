import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, Settings } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";

/**
 * The track page's only membership call to action, shown in the hero:
 * sign in, join, waiting, member, or manage for staff.
 */
const TrackJoinAction = ({ trackId }: { trackId: string }) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await api.enrollInTrack(trackId);
      toast.success(res.message);
      // The refreshed server state is the source of truth for unlocking
      // tasks/progress; do not grant access merely because a button was clicked.
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (authLoading) return null;

  const buttonCls =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
  const badgeCls =
    "inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm";

  if (!user) {
    return (
      <Link to="/signin" state={{ from: location }} className={buttonCls}>
        Sign in to join
      </Link>
    );
  }

  if (user.role === "admin" || user.role === "instructor") {
    return (
      <Link
        to={`/studio?track=${trackId}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
      >
        <Settings size={17} aria-hidden="true" />
        Manage track
      </Link>
    );
  }

  if (user.enrolledTrack === trackId) {
    return (
      <span className={badgeCls}>
        <CheckCircle2 size={16} className="text-emerald-300" aria-hidden="true" />
        You're a member of this track
      </span>
    );
  }

  if (user.pendingTrack === trackId) {
    return (
      <span className={badgeCls}>
        <Clock size={16} aria-hidden="true" />
        Join request sent, waiting for approval
      </span>
    );
  }

  return (
    <button type="button" onClick={handleEnroll} disabled={enrolling} className={buttonCls}>
      {enrolling && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
      {enrolling ? "Sending request..." : "Join the track"}
    </button>
  );
};

export default TrackJoinAction;
