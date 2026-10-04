import { useState } from "react";
import { CalendarDays, GraduationCap, BarChart3, Users, Layers, LogOut, Clock } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendTrack } from "../../services/api";
import { useAuth } from "../../context/useAuth";

interface TrackOverviewProps {
  trackId: string;
  track: BackendTrack | null;
  overview: string;
  /** Formatted date of the next scheduled session, if any. */
  nextSession?: string;
  /** Number of courses actually listed on the page; track.courseCount can lag. */
  courseCount?: number;
}

const TrackOverview = ({ trackId, track, overview, nextSession, courseCount }: TrackOverviewProps) => {
  const { user, refreshUser } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Set right after a successful leave request; the track's isPendingLeave
  // covers later visits.
  const [leaveRequested, setLeaveRequested] = useState(false);

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await api.leaveTrack(trackId);
      toast.success(res.message ?? "Leave request submitted.");
      setShowLeaveConfirm(false);
      setLeaveRequested(true);
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit leave request.");
    } finally {
      setLeaving(false);
    }
  };

  const isEnrolled = !!user && user.enrolledTrack === trackId;
  const isLeavePending =
    isEnrolled &&
    (leaveRequested || !!track?.isPendingLeave || (!!user && !!track?.pendingLeaves?.includes(user._id)));

  const renderLeaveControl = () => {
    if (!isEnrolled) return null;
    if (isLeavePending) {
      return (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <Clock size={15} aria-hidden="true" />
          Leave requested, waiting for approval
        </p>
      );
    }
    if (!showLeaveConfirm) {
      return (
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
        >
          <LogOut size={15} aria-hidden="true" />
          Leave this track
        </button>
      );
    }
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
        <p className="text-center font-medium text-red-800">
          Leave this track? Your progress will be kept.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="min-h-10 flex-1 rounded-lg bg-red-700 px-3 font-bold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
          >
            {leaving ? "Submitting..." : "Yes, leave"}
          </button>
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(false)}
            disabled={leaving}
            className="min-h-10 flex-1 rounded-lg bg-white px-3 font-bold text-gray-800 ring-1 ring-gray-300 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const infoRows = track
    ? [
        { icon: GraduationCap, label: "Instructor", value: track.instructor?.name ?? "TBA" },
        { icon: BarChart3, label: "Level", value: track.level, capitalize: true },
        { icon: Layers, label: "Courses", value: String(courseCount ?? track.courseCount) },
        { icon: Users, label: "Students", value: String(track.studentCount) },
        ...(nextSession ? [{ icon: CalendarDays, label: "Next session", value: nextSession }] : []),
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <h2 className="mb-4 text-2xl font-bold text-primary-darker">About this track</h2>
        <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">{overview}</p>
      </div>

      <div className="space-y-4">
        {track && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Track info</h3>
            <dl className="space-y-3 text-sm">
              {infoRows.map(({ icon: Icon, label, value, capitalize }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {/* Inline so long values wrap under the label, not into a column. */}
                  <div className="min-w-0">
                    <dt className="inline text-gray-600">{label}: </dt>
                    <dd className={`inline font-medium text-gray-900 ${capitalize ? "capitalize" : ""}`}>
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        )}
        {renderLeaveControl()}
      </div>
    </div>
  );
};

export default TrackOverview;
