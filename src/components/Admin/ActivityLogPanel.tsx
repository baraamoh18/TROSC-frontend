import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, UserCircle, X } from "lucide-react";
import * as api from "../../services/api";
import type { ActivityLog, ActivitySummaryResponse } from "../../services/api";
import Modal from "../Modal";
import ConfirmAction from "../Studio/ConfirmAction";
import SectionError from "../Settings/SectionError";
import { cardCls, errorMessage, formatDateTime, inputCls, labelCls, secondaryBtn } from "../Studio/studioUi";
import { isDefaultPhoto } from "../../utils/photoUtils";
import { actionLabel, activityIcon, formatRelative } from "../../utils/activity";

const PAGE_SIZE = 20;
/** The API refuses bulk deletes of anything newer than this, to keep an audit trail. */
const MIN_CLEANUP_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type Range = "1" | "7" | "30" | "all";
const RANGES: { id: Range; label: string }[] = [
  { id: "1", label: "Last 24 hours" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

type Summary = ActivitySummaryResponse["data"];
type LogUser = Exclude<ActivityLog["user"], string | null>;

/**
 * Start of a range, fixed when the range is picked so paging stays consistent.
 * Wrapped in an object so a reload gets a new identity even for "all time".
 */
const spanFor = (range: Range): { from: string | null } => ({
  from: range === "all" ? null : new Date(Date.now() - Number(range) * DAY_MS).toISOString(),
});

const populatedUser = (log: ActivityLog): LogUser | null =>
  log.user && typeof log.user === "object" ? log.user : null;

/**
 * Page for a log's target, when there is one. Skipped for deletions; other
 * targets may also have been deleted since.
 */
const targetPath = (log: ActivityLog): string | null => {
  if (!log.targetId || log.action.startsWith("deleted")) return null;
  switch (log.targetModel) {
    case "Track":
      return `/track/${log.targetId}`;
    case "Course":
      return `/courses/${log.targetId}`;
    case "Event":
      return `/events/${log.targetId}`;
    case "Session":
      return `/sessions/${log.targetId}`;
    default:
      return null;
  }
};

const Avatar = ({ user, size = 36 }: { user: LogUser | null; size?: number }) =>
  user && !isDefaultPhoto(user.photo) ? (
    <img
      loading="lazy"
      src={user.photo}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  ) : (
    <UserCircle size={size} className="shrink-0 text-neutral" strokeWidth={1} aria-hidden="true" />
  );

// ── Detail dialog ─────────────────────────────────────────────

interface DetailProps {
  logId: string;
  onClose: () => void;
  onDeleted: () => void;
  onFilterUser: (user: LogUser) => void;
}

const LogDetail = ({ logId, onClose, onDeleted, onFilterUser }: DetailProps) => {
  const titleId = useId();
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getActivityLog(logId)
      .then((res) => !cancelled && setLog(res.data.activityLog))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [logId]);

  const handleDelete = async () => {
    try {
      await api.deleteActivityLog(logId);
      toast.success("Log entry deleted.");
      onDeleted();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the log entry."));
    }
  };

  const user = log ? populatedUser(log) : null;
  const path = log ? targetPath(log) : null;
  const metadata = log?.metadata ? Object.entries(log.metadata) : [];

  return (
    <Modal onClose={onClose} labelledBy={titleId} className="max-w-lg p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 id={titleId} className="text-lg font-bold text-neutral-darker">
          {log ? actionLabel(log.action) : "Log entry"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-neutral hover:bg-neutral-light"
        >
          <X size={18} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-neutral-dark">Couldn't load this log entry. It may have been deleted.</p>
      ) : !log ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-brand" aria-label="Loading" />
        </div>
      ) : (
        <>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-neutral-dark">By</dt>
              <dd className="mt-1 flex items-center gap-3">
                <Avatar user={user} />
                {user ? (
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-darker">{user.name}</p>
                    <p className="break-all text-xs text-neutral-dark">
                      {user.email} · {user.role}
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-dark">Deleted user</p>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-dark">When</dt>
              <dd className="mt-0.5 text-neutral-darker">{formatDateTime(log.createdAt)}</dd>
            </div>
            {log.targetModel && (
              <div>
                <dt className="font-semibold text-neutral-dark">Target</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-x-2 text-neutral-darker">
                  {log.targetModel}
                  {log.targetId && <code className="break-all text-xs text-neutral-dark">{log.targetId}</code>}
                  {path && (
                    <Link
                      to={path}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      Open
                    </Link>
                  )}
                </dd>
              </div>
            )}
            {metadata.length > 0 && (
              <div>
                <dt className="font-semibold text-neutral-dark">Details</dt>
                <dd className="mt-1 rounded-lg bg-neutral-light px-3 py-2">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    {metadata.map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="font-semibold text-neutral-dark">{key}</dt>
                        <dd className="break-all text-neutral-darker">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-light-active pt-4">
            {user ? (
              <button type="button" onClick={() => onFilterUser(user)} className={secondaryBtn}>
                Show only {user.name}'s activity
              </button>
            ) : (
              <span />
            )}
            <ConfirmAction label="Delete entry" confirmLabel="Confirm delete" onConfirm={handleDelete} />
          </div>
        </>
      )}
    </Modal>
  );
};

// ── Summary ───────────────────────────────────────────────────

interface SummaryProps {
  summary: Summary;
  action: string;
  userId: string | null;
  onAction: (action: string) => void;
  onUser: (user: { _id: string; name: string }) => void;
}

const SummaryCards = ({ summary, action, userId, onAction, onUser }: SummaryProps) => {
  const top = summary.byAction.slice(0, 6);
  const max = top[0]?.count ?? 1;
  const chip = (active: boolean) =>
    `w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-neutral-light ${active ? "bg-primary/10 ring-1 ring-primary/30" : ""}`;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr_1fr]">
      <div className={`${cardCls} p-5`}>
        <p className="text-3xl font-extrabold text-neutral-darker">{summary.totalActivities}</p>
        <p className="mt-0.5 text-sm font-semibold text-neutral-dark">
          {summary.totalActivities === 1 ? "activity" : "activities"}
        </p>
      </div>

      <div className={`${cardCls} p-4`}>
        <h3 className="mb-2 px-2 text-sm font-bold text-neutral-darker">Top actions</h3>
        {top.length === 0 ? (
          <p className="px-2 text-sm text-neutral-dark">Nothing recorded.</p>
        ) : (
          <ul className="space-y-0.5">
            {top.map((a) => (
              <li key={a.action}>
                <button
                  type="button"
                  aria-pressed={action === a.action}
                  onClick={() => onAction(action === a.action ? "" : a.action)}
                  className={chip(action === a.action)}
                >
                  <span className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-neutral-darker">{actionLabel(a.action)}</span>
                    <span className="font-semibold text-neutral-dark">{a.count}</span>
                  </span>
                  <span className="mt-1 block h-1.5 rounded-full bg-neutral-light" aria-hidden="true">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (a.count / max) * 100)}%` }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${cardCls} p-4`}>
        <h3 className="mb-2 px-2 text-sm font-bold text-neutral-darker">Most active</h3>
        {summary.mostActiveUsers.length === 0 ? (
          <p className="px-2 text-sm text-neutral-dark">Nobody yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {summary.mostActiveUsers.map((u) => (
              <li key={u.userId}>
                <button
                  type="button"
                  aria-pressed={userId === u.userId}
                  onClick={() => onUser({ _id: u.userId, name: u.name })}
                  className={`${chip(userId === u.userId)} flex items-center justify-between gap-3 text-sm`}
                >
                  <span className="truncate text-neutral-darker">{u.name}</span>
                  <span className="font-semibold text-neutral-dark">{u.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── Cleanup ───────────────────────────────────────────────────

const Cleanup = ({ onDeleted }: { onDeleted: () => void }) => {
  const [days, setDays] = useState(90);
  const [count, setCount] = useState<number | null>(null);
  const valid = Number.isInteger(days) && days >= MIN_CLEANUP_DAYS;

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(() => {
      const before = new Date(Date.now() - days * DAY_MS).toISOString();
      const params = new URLSearchParams({ limit: "1", "createdAt[lt]": before });
      api
        .getActivityLogs(params.toString())
        .then((res) => !cancelled && setCount(res.total))
        .catch(() => !cancelled && setCount(null));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [days, valid]);

  const handleDelete = async () => {
    try {
      const res = await api.deleteActivityLogs(days);
      toast.success(res.message || "Old logs deleted.");
      setCount(0);
      onDeleted();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete old logs."));
    }
  };

  return (
    <section className={`${cardCls} mt-8 p-5`} aria-labelledby="activity-cleanup">
      <h3 id="activity-cleanup" className="text-base font-bold text-neutral-darker">
        Clean up old logs
      </h3>
      <p className="mt-1 text-sm text-neutral-dark">
        Permanently delete entries older than a number of days. The minimum is {MIN_CLEANUP_DAYS} days, so recent
        activity is always kept.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label htmlFor="cleanup-days" className={labelCls}>
            Older than (days)
          </label>
          <input
            id="cleanup-days"
            type="number"
            min={MIN_CLEANUP_DAYS}
            step={1}
            value={Number.isNaN(days) ? "" : days}
            onChange={(e) => setDays(e.target.valueAsNumber)}
            className={inputCls}
          />
        </div>
        <ConfirmAction
          label={valid && count !== null ? `Delete ${count} ${count === 1 ? "entry" : "entries"}` : "Delete"}
          confirmLabel="Confirm permanent delete"
          disabled={!valid || !count}
          onConfirm={handleDelete}
        />
      </div>
      {!valid && (
        <p className="mt-2 text-xs text-danger-ink">Enter a whole number of at least {MIN_CLEANUP_DAYS}.</p>
      )}
    </section>
  );
};

// ── Panel ─────────────────────────────────────────────────────

/** Admin view of everyone's activity: summary, filterable log, and cleanup. */
const ActivityLogPanel = () => {
  const [range, setRange] = useState<Range>("7");
  const [action, setAction] = useState("");
  const [user, setUser] = useState<{ _id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [span, setSpan] = useState(() => spanFor("7"));

  useEffect(() => {
    let cancelled = false;
    setSummaryError(false);
    api
      .getActivitySummary(span.from ? { from: span.from } : undefined)
      .then((res) => !cancelled && setSummary(res.data))
      .catch(() => !cancelled && setSummaryError(true));
    return () => {
      cancelled = true;
    };
  }, [span]);

  const request = useRef(0);
  const loadLogs = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
    if (action) params.set("action", action);
    if (user) params.set("user", user._id);
    if (span.from) params.set("createdAt[gte]", span.from);
    try {
      const res = await api.getActivityLogs(params.toString());
      if (id !== request.current) return;
      setLogs(res.data.activityLogs);
      setTotal(res.total);
    } catch {
      if (id === request.current) setError(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [page, action, user, span]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // After a delete: reload both lists and move the range forward to now
  const reload = () => setSpan(spanFor(range));
  const filterAction = (a: string) => {
    setAction(a);
    setPage(1);
  };
  const filterUser = (u: { _id: string; name: string } | null) => {
    setUser(u);
    setPage(1);
  };

  // Actions seen in this range, plus the current filter in case it has none
  const actionOptions = useMemo(() => {
    const names = (summary?.byAction ?? []).map((a) => a.action);
    if (action && !names.includes(action)) names.push(action);
    return names.sort();
  }, [summary, action]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectCls =
    "rounded-lg border border-neutral-light-active bg-surface px-3 py-2.5 text-sm font-semibold text-neutral-darker focus:border-primary focus:outline-none";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label htmlFor="activity-range" className="sr-only">
          Time range
        </label>
        <select
          id="activity-range"
          value={range}
          onChange={(e) => {
            const next = e.target.value as Range;
            setRange(next);
            setSpan(spanFor(next));
            setPage(1);
          }}
          className={selectCls}
        >
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <label htmlFor="activity-action" className="sr-only">
          Action
        </label>
        <select
          id="activity-action"
          value={action}
          onChange={(e) => filterAction(e.target.value)}
          className={selectCls}
        >
          <option value="">All actions</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a)}
            </option>
          ))}
        </select>
        {user && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm font-semibold text-brand">
            {user.name}
            <button
              type="button"
              onClick={() => filterUser(null)}
              aria-label={`Stop filtering by ${user.name}`}
              className="rounded-full p-1 hover:bg-primary/20"
            >
              <X size={14} />
            </button>
          </span>
        )}
        <span className="text-sm text-neutral-dark sm:ml-auto">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      {summaryError ? (
        <div className="mb-6">
          <SectionError what="the activity summary" onRetry={reload} />
        </div>
      ) : summary ? (
        <SummaryCards
          summary={summary}
          action={action}
          userId={user?._id ?? null}
          onAction={filterAction}
          onUser={(u) => filterUser(user?._id === u._id ? null : u)}
        />
      ) : (
        <div className="mb-6 h-40 animate-pulse rounded-xl bg-gray-200" />
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <SectionError what="the activity log" onRetry={() => void loadLogs()} />
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-light-active bg-surface p-10 text-center text-sm text-neutral-dark">
          No activity matches these filters.
        </div>
      ) : (
        <ul className={`${cardCls} divide-y divide-gray-100`}>
          {logs.map((log) => {
            const Icon = activityIcon(log.action);
            const by = populatedUser(log);
            return (
              <li key={log._id}>
                <button
                  type="button"
                  onClick={() => setOpenId(log._id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-light/50"
                >
                  <span className="shrink-0 rounded-full bg-primary/10 p-2 text-brand" aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="font-semibold text-neutral-darker">{by?.name ?? "Deleted user"}</span>{" "}
                    <span className="text-neutral-dark">{actionLabel(log.action).toLowerCase()}</span>
                  </span>
                  <time
                    dateTime={log.createdAt}
                    title={formatDateTime(log.createdAt)}
                    className="shrink-0 text-xs text-neutral-dark"
                  >
                    {formatRelative(log.createdAt)}
                  </time>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-dark">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-surface px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-surface px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <Cleanup onDeleted={reload} />

      {openId && (
        <LogDetail
          logId={openId}
          onClose={() => setOpenId(null)}
          onDeleted={() => {
            setOpenId(null);
            reload();
          }}
          onFilterUser={(u) => {
            setOpenId(null);
            filterUser({ _id: u._id, name: u.name });
          }}
        />
      )}
    </div>
  );
};

export default ActivityLogPanel;
