import { useCallback, useEffect, useState } from "react";
import { Activity, ClipboardList, LogIn, Star, UploadCloud, UserCheck } from "lucide-react";
import * as api from "../../services/api";
import type { ActivityLog } from "../../services/api";
import SectionError from "./SectionError";

const activityIcon = (action: string) => {
  const cls = "h-4 w-4";
  if (action.includes("login")) return <LogIn className={cls} />;
  if (action.includes("enroll")) return <UserCheck className={cls} />;
  if (action.includes("submit") || action.includes("assignment")) return <ClipboardList className={cls} />;
  if (action.includes("review")) return <Star className={cls} />;
  if (action.includes("upload") || action.includes("photo")) return <UploadCloud className={cls} />;
  return <Activity className={cls} />;
};

const formatRelative = (isoDate: string) => {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** The signed-in person's last few actions. */
const RecentActivity = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .getMyActivityLogs("limit=20")
      .then((res) => {
        if (!cancelled) setLogs(res.data?.logs || []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-12 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }
  if (error) return <SectionError what="your recent activity" onRetry={load} />;
  if (logs.length === 0) return <p className="text-center text-neutral-dark">No activity recorded yet.</p>;

  return (
    <ul className="divide-y divide-gray-100">
      {logs.map((log) => (
        <li key={log._id} className="flex items-center gap-3 py-3">
          <span className="shrink-0 rounded-full bg-primary/10 p-2 text-brand" aria-hidden="true">
            {activityIcon(log.action)}
          </span>
          <p className="min-w-0 flex-1 text-sm capitalize leading-snug text-gray-800">{log.action.replace(/_/g, " ")}</p>
          <span className="shrink-0 text-xs text-gray-500">{formatRelative(log.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
};

export default RecentActivity;
