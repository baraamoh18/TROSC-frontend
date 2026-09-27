import { useState } from "react";
import { Calendar, GraduationCap, BarChart3, Users, Layers, LogOut, Settings } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendTrack } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { Link, useLocation } from "react-router-dom";

interface ScheduleSummary {
  nextSession: string;
  projectDeadline: string;
  finalExam: string;
}

interface TrackOverviewProps {
  trackId: string;
  track: BackendTrack | null;
  overview: string;
  scheduleSummary: ScheduleSummary;
  /** Number of courses actually listed on the page; track.courseCount can lag. */
  courseCount?: number;
}

const TrackOverview = ({
  trackId,
  track,
  overview,
  scheduleSummary,
  courseCount,
}: TrackOverviewProps) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [enrolling, setEnrolling] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Set right after a successful leave request; the track's pendingLeaves
  // covers later visits.
  const [leaveRequested, setLeaveRequested] = useState(false);

  const handleEnroll = async () => {
    if (!trackId) return;
    setEnrolling(true);
    try {
      const res = await api.enrollInTrack(trackId);
      toast.success(res.message);
      // The refreshed server state is the source of truth for unlocking
      // tasks/progress; do not grant access merely because a button was clicked.
      await refreshUser();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to enroll. Please try again.",
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleLeave = async () => {
    if (!trackId) return;
    setLeaving(true);
    try {
      const res = await api.leaveTrack(trackId);
      toast.success(res.message ?? "Leave request submitted.");
      setShowLeaveConfirm(false);
      setLeaveRequested(true);
      // Refresh user so enrolledTrack clears in context
      await refreshUser();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit leave request.",
      );
    } finally {
      setLeaving(false);
    }
  };

  const isEnrolled = !!user && user.enrolledTrack === trackId;
  const isPending = !!user && user.pendingTrack === trackId;
  const isLeavePending =
    isEnrolled && (leaveRequested || (!!user && !!track?.pendingLeaves?.includes(user._id)));

  const hasSchedule = Object.values(scheduleSummary).some((v) => v && v !== "TBA");

  const renderEnrollAction = () => {
    if (authLoading) {
      return (
        <button
          disabled
          className="w-full bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl cursor-not-allowed"
        >
          Loading...
        </button>
      );
    }

    if (!user) {
      return (
        <Link
          to="/signin"
          state={{ from: location }}
          className="block w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
        >
          Sign in to enroll
        </Link>
      );
    }

    // ── Staff: manage, never join or leave ─────────────────────
    if (user.role === "admin" || user.role === "instructor") {
      return (
        <Link
          to={user.role === "admin" ? "/admin" : "/instructor"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-darker px-4 py-3 font-bold text-white shadow-md transition-colors hover:bg-black"
        >
          <Settings size={17} aria-hidden="true" />
          Manage track
        </Link>
      );
    }

    // ── State 1: Approved & enrolled ──────────────────────────
    if (isEnrolled) {
      return (
        <div className="space-y-2">
          <div
            className="rounded-xl px-4 py-3 font-bold text-center text-white shadow-md flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-emerald-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            You're In!
          </div>
          {isLeavePending ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800">
              Leave requested, waiting for approval
            </p>
          ) : !showLeaveConfirm ? (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 py-2 transition-colors"
            >
              <LogOut size={15} />
              Leave this track
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm space-y-2">
              <p className="text-red-700 font-medium text-center">
                Leave this track? Your progress will be kept.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 text-xs"
                >
                  {leaving ? "Submitting..." : "Yes, leave"}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={leaving}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ── State 2: Pending approval ─────────────────────────────
    if (isPending) {
      return (
        <button
          disabled
          className="w-full bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 shadow-inner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 shrink-0 text-gray-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Waiting for Approval
        </button>
      );
    }

    // ── State 3: Not enrolled — default join button ────────────
    return (
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enrolling ? "Submitting..." : "Join the Track"}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
        <p className="text-gray-700 text-lg leading-relaxed">{overview}</p>
      </div>

      <div className="space-y-6">
        {renderEnrollAction()}

        {track && (
          <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-gray-700" />
              Track Info
            </h3>
            <ul className="space-y-3 text-sm text-gray-800">
              <li className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <span>Instructor: {track.instructor?.name ?? "TBA"}</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                <span className="capitalize">Level: {track.level}</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary shrink-0" />
                <span>Courses: {courseCount ?? track.courseCount}</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span>Students enrolled: {track.studentCount}</span>
              </li>
            </ul>
          </div>
        )}

        {hasSchedule && (
        <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-700" />
            Schedule
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col">
              <span className="font-semibold text-primary">
                Next Session:{" "}
                <span className="text-gray-600 font-normal">
                  {scheduleSummary.nextSession}
                </span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-primary">
                Project Deadline:{" "}
                <span className="text-gray-600 font-normal">
                  {scheduleSummary.projectDeadline}
                </span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-primary">
                Final Exam:{" "}
                <span className="text-gray-600 font-normal">
                  {scheduleSummary.finalExam}
                </span>
              </span>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default TrackOverview;
