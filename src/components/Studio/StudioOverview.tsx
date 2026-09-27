import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendTrack, DashboardStats } from "../../services/api";
import StatsOverview from "../Admin/StatsOverview";

/** Admin-only platform statistics, loaded when the section opens. */
const StudioOverview = ({ tracks }: { tracks: BackendTrack[] }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardLive();
      setStats(res.data ?? null);
    } catch {
      setStats(null);
      toast.error("Couldn't load platform stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return (
    <StatsOverview
      stats={stats}
      loading={loading}
      onRefresh={fetchStats}
      mostActiveTrackTitle={
        typeof stats?.mostActiveTrack === "string"
          ? tracks.find((t) => t._id === stats.mostActiveTrack)?.title
          : undefined
      }
    />
  );
};

export default StudioOverview;
