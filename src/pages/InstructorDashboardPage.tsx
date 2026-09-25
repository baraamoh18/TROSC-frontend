import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GraduationCap, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as api from "../services/api";
import type { AuthUser, BackendTrack } from "../services/api";
import { useAuth } from "../context/useAuth";
import PendingApprovals from "../components/Instructor/PendingApprovals";
import usePageTitle from "../hooks/usePageTitle";

const InstructorDashboardPage = () => {
  usePageTitle("Instructor Dashboard");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isInstructor = !!user && user.role === "instructor";

  // Admins have their own dashboard — redirect them there.
  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const [tracks, setTracks] = useState<BackendTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const [pendingStudents, setPendingStudents] = useState<AuthUser[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<AuthUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tracks owned by the signed-in instructor.
  const fetchTracks = useCallback(async () => {
    if (!user || !isInstructor) return;
    setTracksLoading(true);
    try {
      const res = await api.getTracks("limit=100&sort=-createdAt");
      const all = res.data?.tracks ?? [];
      setTracks(all.filter((t) => t.instructor?._id === user._id));
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  }, [user, isInstructor]);

  useEffect(() => {
    if (authLoading) return;
    fetchTracks();
  }, [authLoading, fetchTracks]);

  // Pick the first track once the list arrives.
  useEffect(() => {
    if (!tracksLoading && tracks.length > 0) {
      setSelectedTrackId((prev) =>
        prev && tracks.some((t) => t._id === prev) ? prev : tracks[0]._id,
      );
    }
  }, [tracks, tracksLoading]);

  const fetchPending = useCallback(async (trackId: string) => {
    setPendingLoading(true);
    try {
      const res = await api.getTrackPending(trackId);
      setPendingStudents(res.data?.pendingStudents ?? []);
      setPendingLeaves(res.data?.pendingLeaves ?? []);
    } catch {
      setPendingStudents([]);
      setPendingLeaves([]);
      toast.error("Couldn't load pending requests.");
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTrackId) fetchPending(selectedTrackId);
  }, [selectedTrackId, fetchPending]);

  if (authLoading) return null;

  if (!user || !isInstructor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-light pt-16 font-family-poppins">
        <div className="px-4 text-center">
          <ShieldAlert size={48} className="mx-auto mb-3 text-primary" />
          <h1 className="mb-3 text-3xl font-bold text-neutral-darker">
            Restricted area
          </h1>
          <p className="text-neutral-dark">
            Only instructors can open this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const selectedTrack = tracks.find((t) => t._id === selectedTrackId);

  const handleApproveEnrollment = async (studentId: string) => {
    if (!selectedTrackId) return;
    setBusyId(studentId);
    try {
      await api.approveEnrollment(selectedTrackId, studentId);
      toast.success("Student approved and added to the track.");
      await fetchPending(selectedTrackId);
      fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectEnrollment = async (studentId: string) => {
    if (!selectedTrackId) return;
    setBusyId(studentId);
    try {
      await api.rejectEnrollment(selectedTrackId, studentId);
      toast.success("Enrollment request rejected.");
      await fetchPending(selectedTrackId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveLeave = async (studentId: string) => {
    if (!selectedTrackId) return;
    setBusyId(studentId);
    try {
      await api.approveLeave(selectedTrackId, studentId);
      toast.success("Leave request approved — student removed from track.");
      await fetchPending(selectedTrackId);
      fetchTracks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectLeave = async (studentId: string) => {
    if (!selectedTrackId) return;
    setBusyId(studentId);
    try {
      await api.rejectLeave(selectedTrackId, studentId);
      toast.success("Leave request rejected — student stays in the track.");
      await fetchPending(selectedTrackId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light pt-24 pb-20 font-family-poppins">
      <div className="mx-auto w-full max-w-4xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold text-primary-darker">
            <GraduationCap size={30} />
            Instructor Dashboard
          </h1>
          <p className="mt-1 text-neutral-dark">
            Review enrollment and leave requests for your tracks.
          </p>
        </div>

        {/* Track selector */}
        {tracksLoading ? (
          <div className="mb-8 h-12 w-2/3 animate-pulse rounded-full bg-gray-200" />
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-light-active bg-white p-10 text-center text-neutral-dark">
            You don't have any tracks assigned yet. Once a track is created with
            you as the instructor, requests will show up here.
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              {tracks.map((track) => {
                const isActive = track._id === selectedTrackId;
                return (
                  <button
                    key={track._id}
                    type="button"
                    onClick={() => setSelectedTrackId(track._id)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white text-neutral-dark hover:bg-neutral-light-active hover:text-neutral-darker"
                    }`}
                  >
                    {track.title}
                    {track.pendingStudents.length > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary-light text-primary-dark"
                        }`}
                      >
                        {track.pendingStudents.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedTrack && (
              <p className="mb-6 text-sm text-neutral-dark">
                Managing{" "}
                <span className="font-semibold text-neutral-darker">
                  {selectedTrack.title}
                </span>{" "}
                — {selectedTrack.studentCount} student
                {selectedTrack.studentCount === 1 ? "" : "s"} enrolled.
              </p>
            )}

            <div className="space-y-8">
              <PendingApprovals
                heading="Pending enrollment requests"
                people={pendingStudents}
                loading={pendingLoading}
                busyId={busyId}
                emptyMessage="No students are waiting to join this track."
                onApprove={handleApproveEnrollment}
                onReject={handleRejectEnrollment}
              />

              <PendingApprovals
                heading="Pending leave requests"
                people={pendingLeaves}
                loading={pendingLoading}
                busyId={busyId}
                approveLabel="Approve leave"
                rejectLabel="Reject leave"
                emptyMessage="No students have asked to leave this track."
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
