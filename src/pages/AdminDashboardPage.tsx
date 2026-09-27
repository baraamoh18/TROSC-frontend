import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shield, ShieldAlert, LayoutDashboard, GitBranch, Users, FolderEdit } from "lucide-react";
import * as api from "../services/api";
import type { AuthUser, BackendTrack, DashboardStats } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import PendingApprovals from "../components/Instructor/PendingApprovals";
import StatsOverview from "../components/Admin/StatsOverview";
import UserManagementTable from "../components/Admin/UserManagementTable";
import ContentManagement from "../components/Admin/ContentManagement";
import usePageTitle from "../hooks/usePageTitle";
import usePendingCounts from "../hooks/usePendingCounts";

type Tab = "overview" | "tracks" | "content" | "users";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "tracks", label: "Track Management", icon: <GitBranch size={16} /> },
  { id: "content", label: "Content", icon: <FolderEdit size={16} /> },
  { id: "users", label: "User Management", icon: <Users size={16} /> },
];

const AdminDashboardPage = () => {
  usePageTitle("Admin Dashboard");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!user && user.role === "admin";

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Stats ──────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.getDashboardLive();
      setStats(res.data ?? null);
    } catch {
      setStats(null);
      toast.error("Couldn't load platform stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Tracks ────────────────────────────────────────────────
  const [tracks, setTracks] = useState<BackendTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [pendingStudents, setPendingStudents] = useState<AuthUser[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<AuthUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { counts: pendingCounts, setCount: setPendingCount } = usePendingCounts(tracks);

  const fetchTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const res = await api.getTracks("limit=100&sort=-createdAt");
      setTracks(res.data?.tracks ?? []);
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async (trackId: string) => {
    setPendingLoading(true);
    try {
      const res = await api.getTrackPending(trackId);
      const students = res.data?.pendingStudents ?? [];
      const leaves = res.data?.pendingLeaves ?? [];
      setPendingStudents(students);
      setPendingLeaves(leaves);
      setPendingCount(trackId, students.length + leaves.length);
    } catch {
      setPendingStudents([]);
      setPendingLeaves([]);
      toast.error("Couldn't load pending requests.");
    } finally {
      setPendingLoading(false);
    }
  }, [setPendingCount]);

  // ── Bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    void fetchStats();
    void fetchTracks();
  }, [authLoading, isAdmin, fetchStats, fetchTracks]);

  useEffect(() => {
    if (!tracksLoading && tracks.length > 0) {
      setSelectedTrackId((prev) =>
        prev && tracks.some((t) => t._id === prev) ? prev : tracks[0]._id,
      );
    }
  }, [tracks, tracksLoading]);

  useEffect(() => {
    if (selectedTrackId) void fetchPending(selectedTrackId);
  }, [selectedTrackId, fetchPending]);

  // ── Auth guard ────────────────────────────────────────────
  if (authLoading) return null;

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-light pt-16">
        <div className="px-4 text-center">
          <ShieldAlert size={48} className="mx-auto mb-3 text-primary" />
          <h1 className="mb-3 text-3xl font-bold text-neutral-darker">Restricted area</h1>
          <p className="text-neutral-dark">Only admins can access this dashboard.</p>
          <button
            type="button"
            onClick={() => navigate(user?.role === "instructor" ? "/instructor" : user ? "/dashboard" : "/signin")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            {user?.role === "instructor"
              ? "Go to Instructor Dashboard"
              : user
                ? "Go to my dashboard"
                : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  // ── Track handlers ────────────────────────────────────────
  const selectedTrack = tracks.find((t) => t._id === selectedTrackId);

  const handleApproveEnrollment = async (studentId: string) => {
    if (!selectedTrackId) return;
    setBusyId(studentId);
    try {
      await api.approveEnrollment(selectedTrackId, studentId);
      toast.success("Student approved and added to the track.");
      await fetchPending(selectedTrackId);
      void fetchTracks();
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
      toast.success("Leave approved. The student was removed from the track.");
      await fetchPending(selectedTrackId);
      void fetchTracks();
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
      toast.success("Leave rejected. The student stays in the track.");
      await fetchPending(selectedTrackId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setBusyId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-light pt-24 pb-20">
      <div className="mx-auto w-full max-w-5xl px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold text-primary-darker">
            <Shield size={30} />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-neutral-dark">
            Users, tracks, content and platform statistics.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-light-active pb-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-neutral-dark hover:bg-neutral-light-active hover:text-neutral-darker"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <StatsOverview
            stats={stats}
            loading={statsLoading}
            onRefresh={fetchStats}
            mostActiveTrackTitle={
              typeof stats?.mostActiveTrack === "string"
                ? tracks.find((t) => t._id === stats.mostActiveTrack)?.title
                : undefined
            }
          />
        )}

        {activeTab === "tracks" && (
          <div>
            {tracksLoading ? (
              <div className="mb-8 h-12 w-2/3 animate-pulse rounded-full bg-gray-200" />
            ) : tracks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-light-active bg-white p-10 text-center text-neutral-dark">
                No tracks exist on the platform yet.
              </div>
            ) : (
              <>
                {/* Track pills */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {tracks.map((track) => {
                    const isActive = track._id === selectedTrackId;
                    return (
                      <button
                        key={track._id}
                        type="button"
                        onClick={() => setSelectedTrackId(track._id)}
                        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "bg-white text-neutral-dark hover:bg-neutral-light-active hover:text-neutral-darker"
                        }`}
                      >
                        {track.title}
                        {(pendingCounts[track._id] ?? 0) > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-primary-light text-primary-dark"
                            }`}
                          >
                            {pendingCounts[track._id]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedTrack && (
                  <div className="mb-6 rounded-xl border border-neutral-light-active bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-neutral-darker">
                          {selectedTrack.title}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-dark">
                          Instructor:{" "}
                          <span className="font-semibold">
                            {selectedTrack.instructor?.name ?? "Unassigned"}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <p className="text-xl font-extrabold text-primary-darker">
                            {selectedTrack.studentCount}
                          </p>
                          <p className="text-xs text-neutral-dark">Students</p>
                        </div>
                        <div>
                          <p className="text-xl font-extrabold text-primary-darker">
                            {selectedTrack.courseCount}
                          </p>
                          <p className="text-xs text-neutral-dark">Courses</p>
                        </div>
                        <div>
                          <p className="text-xl font-extrabold text-primary-darker">
                            {selectedTrack.sessionCount}
                          </p>
                          <p className="text-xs text-neutral-dark">Sessions</p>
                        </div>
                      </div>
                    </div>
                  </div>
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
        )}

        {activeTab === "content" && (
          <ContentManagement
            tracks={tracks}
            tracksLoading={tracksLoading}
            onRefreshTracks={fetchTracks}
          />
        )}

        {activeTab === "users" && <UserManagementTable currentUserId={user?._id} />}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
