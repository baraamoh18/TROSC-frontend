import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ExternalLink, Paperclip, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendCourse, BackendSession } from "../../services/api";
import EmptyState from "../EmptyState";
import ConfirmAction from "./ConfirmAction";
import SessionForm from "./SessionForm";
import { cardCls, errorMessage, formatDateTime, primaryBtn, smallBtn } from "./studioUi";

interface StudioSessionsProps {
  trackId: string;
  sessions: BackendSession[];
  /** Sessions the current user owns that aren't in any track. */
  looseSessions: BackendSession[];
  courses: BackendCourse[];
  onChanged: () => void;
}

const byDate = (a: BackendSession, b: BackendSession) =>
  (a.startDate ? Date.parse(a.startDate) : Infinity) - (b.startDate ? Date.parse(b.startDate) : Infinity);

const StudioSessions = ({ trackId, sessions, looseSessions, courses, onChanged }: StudioSessionsProps) => {
  const [editing, setEditing] = useState<BackendSession | "new" | null>(null);
  const sorted = useMemo(() => [...sessions].sort(byDate), [sessions]);
  const courseTitle = (id?: string) => courses.find((c) => c._id === id)?.title;

  const run = async (call: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await call();
      toast.success(success);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, failure));
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {sessions.length} session{sessions.length === 1 ? "" : "s"} in this track
        </p>
        <button type="button" className={primaryBtn} onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden="true" />
          New session
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={CalendarClock} message="This track has no sessions yet. Create the first one." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((s) => (
            <li key={s._id} className={`${cardCls} p-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/sessions/${s._id}`} className="font-bold text-gray-900 hover:text-primary">
                      {s.title}
                    </Link>
                    {!s.published && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Draft</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {[
                      formatDateTime(s.startDate),
                      s.duration ? `${s.duration} min` : "",
                      courseTitle(s.course) ? `Course: ${courseTitle(s.course)}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                        <ExternalLink size={12} aria-hidden="true" />
                        Video link
                      </a>
                    ) : (
                      <span className="font-semibold text-amber-800">No video link yet</span>
                    )}
                    {(s.resources?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip size={12} aria-hidden="true" />
                        {s.resources!.length} material{s.resources!.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <button type="button" className={`${smallBtn} text-gray-800 hover:bg-gray-100`} onClick={() => setEditing(s)}>
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </button>
                  <ConfirmAction
                    label="Remove from track"
                    confirmLabel="Click to remove"
                    danger={false}
                    onConfirm={() =>
                      run(() => api.detachSessionFromTrack(trackId, s._id), "Session removed from the track.", "Couldn't remove it.")
                    }
                  />
                  <ConfirmAction
                    label="Delete"
                    confirmLabel="Click to delete"
                    onConfirm={() => run(() => api.deleteSession(s._id), "Session deleted.", "Couldn't delete it.")}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {looseSessions.length > 0 && (
        <section className="mt-10" aria-labelledby="loose-sessions">
          <h3 id="loose-sessions" className="mb-1 font-bold text-gray-900">Not in a track</h3>
          <p className="mb-4 text-sm text-gray-600">Your sessions that no track includes yet. Students can't find these.</p>
          <ul className="space-y-2">
            {looseSessions.map((s) => (
              <li key={s._id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                <span className="font-semibold text-gray-900">{s.title}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`${smallBtn} text-primary hover:bg-primary-light`}
                    onClick={() =>
                      run(() => api.attachSessionToTrack(trackId, s._id), "Session added to the track.", "Couldn't add it.")
                    }
                  >
                    <Plus size={13} aria-hidden="true" />
                    Add to this track
                  </button>
                  <ConfirmAction
                    label="Delete"
                    confirmLabel="Click to delete"
                    onConfirm={() => run(() => api.deleteSession(s._id), "Session deleted.", "Couldn't delete it.")}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <SessionForm
          trackId={trackId}
          courses={courses}
          session={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
};

export default StudioSessions;
