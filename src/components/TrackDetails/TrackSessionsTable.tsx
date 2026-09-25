import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, Loader2, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendSession, SessionCatalogItem } from "../../services/api";

interface TrackSessionsTableProps {
  sessions: BackendSession[];
  catalogSessions?: SessionCatalogItem[];
  canWatch: boolean;
  isEnrolled: boolean;
  onWatched?: (sessionId: string) => void;
}

const formatDate = (date?: string): string =>
  date ? new Date(date).toLocaleDateString() : "TBA";

const formatDuration = (duration?: number): string =>
  duration ? `${duration} min` : "—";

const isFullSession = (
  session: BackendSession | SessionCatalogItem,
): session is BackendSession => "instructor" in session;

const TrackSessionsTable: React.FC<TrackSessionsTableProps> = ({
  sessions,
  catalogSessions = [],
  canWatch,
  isEnrolled,
  onWatched,
}) => {
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);
  const rows = canWatch ? sessions : catalogSessions;

  const markWatched = async (sessionId: string) => {
    setUpdatingSessionId(sessionId);
    try {
      await api.markSessionWatched(sessionId);
      onWatched?.(sessionId);
      toast.success("Session marked as watched.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update progress.");
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const renderTitle = (session: BackendSession | SessionCatalogItem) =>
    canWatch && isFullSession(session) ? (
      <Link
        to={`/sessions/${session._id}`}
        className="font-semibold text-gray-900 hover:text-primary transition-colors"
      >
        {session.title}
      </Link>
    ) : (
      <span className="font-semibold text-gray-900">{session.title}</span>
    );

  const renderActions = (session: BackendSession | SessionCatalogItem) => (
    <>
      {canWatch && isFullSession(session) && (session.url || session.embedUrl) && (
        <Link
          to={`/sessions/${session._id}`}
          className="mt-2 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-1.5 px-3 rounded"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Watch session
        </Link>
      )}
      {!canWatch && (
        <p className="mt-2 text-xs font-medium text-gray-500">Sign in to watch</p>
      )}
      {isEnrolled && isFullSession(session) && (
        <button
          type="button"
          disabled={session.myProgress?.status === "watched" || updatingSessionId === session._id}
          onClick={() => markWatched(session._id)}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary disabled:text-green-700 disabled:cursor-default"
        >
          {updatingSessionId === session._id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : session.myProgress?.status === "watched" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {session.myProgress?.status === "watched" ? "Watched" : "Mark as watched"}
        </button>
      )}
    </>
  );

  const instructorName = (session: BackendSession | SessionCatalogItem) =>
    isFullSession(session) ? session.instructor?.name ?? "TBA" : "—";

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h2>
      {rows.length === 0 ? (
        <p className="text-gray-600 text-sm">No sessions available yet.</p>
      ) : (
        <>
          {/* Cards on small screens */}
          <ol className="space-y-3 md:hidden">
            {rows.map((session, index) => (
              <li
                key={session._id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {renderTitle(session)}
                    {session.description && (
                      <p className="mt-1 text-sm text-gray-700">{session.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {instructorName(session)} · {formatDate(session.startDate)} ·{" "}
                      {formatDuration(session.duration)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4">{renderActions(session)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Table from md up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th scope="col" className="py-3 px-4 text-center font-bold text-gray-900 w-12">#</th>
                  <th scope="col" className="py-3 px-4 text-left font-bold text-gray-900">Title</th>
                  <th scope="col" className="py-3 px-4 text-left font-bold text-gray-900">Description</th>
                  <th scope="col" className="py-3 px-4 text-left font-bold text-gray-900">Instructor</th>
                  <th scope="col" className="py-3 px-4 text-left font-bold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((session, index) => (
                  <tr
                    key={session._id}
                    className={index !== rows.length - 1 ? "border-b border-gray-300" : ""}
                  >
                    <td className="py-4 px-4 font-bold text-center align-top">{index + 1}</td>
                    <td className="py-4 px-4 text-sm align-top w-1/5">{renderTitle(session)}</td>
                    <td className="py-4 px-4 text-sm text-gray-700 align-top w-2/5">
                      {session.description}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-800 align-top">
                      {instructorName(session)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-800 align-top">
                      <div>{formatDate(session.startDate)}</div>
                      <div className="text-xs text-gray-500">{formatDuration(session.duration)}</div>
                      {renderActions(session)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackSessionsTable;
