import React from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  UserPlus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { DashboardStats } from "../../services/api";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, accent = "#e83b3b" }) => (
  <div
    className="relative overflow-hidden rounded-2xl border border-neutral-light-active bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
  >
    {/* Faint accent circle */}
    <div
      className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10"
      style={{ background: accent }}
    />
    <div
      className="mb-4 inline-flex items-center justify-center rounded-xl p-2.5"
      style={{ background: `${accent}18`, color: accent }}
    >
      {icon}
    </div>
    <p className="text-2xl font-extrabold text-neutral-darker">{value}</p>
    <p className="mt-0.5 text-sm font-semibold text-neutral-dark">{label}</p>
    {sub && <p className="mt-1 text-xs text-neutral">{sub}</p>}
  </div>
);

interface StatsOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-light-active bg-white p-10 text-center text-neutral-dark">
        Could not load platform statistics.
      </div>
    );
  }

  const completionPct = `${Math.round(stats.avgCompletionRate ?? 0)}%`;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-darker">Platform Overview</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-light px-4 py-2 text-sm font-semibold text-neutral-dark transition-colors hover:bg-neutral-light-active"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users size={20} />}
          label="Total Users"
          value={stats.totalUsers}
          sub={`+${stats.newUsers} in last 24 h`}
          accent="#e83b3b"
        />
        <StatCard
          icon={<UserPlus size={20} />}
          label="New Users (24 h)"
          value={stats.newUsers}
          accent="#c0392b"
        />
        <StatCard
          icon={<GraduationCap size={20} />}
          label="Total Tracks"
          value={stats.totalTracks}
          accent="#ae2c2c"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Total Courses"
          value={stats.totalCourses}
          accent="#d35400"
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Total Events"
          value={stats.totalEvents}
          accent="#8e44ad"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Avg Completion"
          value={completionPct}
          sub="across all tracks"
          accent="#27ae60"
        />
      </div>

      {stats.createdAt && (
        <p className="mt-4 text-right text-xs text-neutral">
          Stats snapshot:{" "}
          {new Date(stats.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
};

export default StatsOverview;
