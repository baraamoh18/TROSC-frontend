import { useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";

interface ProgressToggleProps {
  sessionId: string;
  initialWatched: boolean;
  /** ISO date from myProgress.watchedAt, shown next to "Watched" */
  watchedAt?: string | null;
  /** Notifies the parent with the server's watchedAt. */
  onWatched?: (watchedAt: string) => void;
}

/**
 * Marks a session as watched via PUT /sessions/:id/progress.
 * The backend has no "unwatch" action, so once watched the control
 * renders as a completed state.
 */
const ProgressToggle = ({
  sessionId,
  initialWatched,
  watchedAt,
  onWatched,
}: ProgressToggleProps) => {
  const [watched, setWatched] = useState(initialWatched);
  const [marking, setMarking] = useState(false);

  const handleMarkWatched = async () => {
    if (watched || marking) return;
    setMarking(true);
    try {
      const res = await api.markSessionWatched(sessionId);
      setWatched(true);
      onWatched?.(res.data?.myProgress?.watchedAt ?? new Date().toISOString());
      toast.success("Session marked as watched.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update progress.",
      );
    } finally {
      setMarking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMarkWatched}
      disabled={watched || marking}
      className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors ${
        watched
          ? "cursor-default bg-success-tint text-success-ink"
          : "bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-60"
      }`}
    >
      {marking ? (
        <Loader2 size={16} className="animate-spin" />
      ) : watched ? (
        <Check size={16} />
      ) : (
        <Circle size={16} />
      )}
      {watched
        ? watchedAt
          ? `Watched · ${new Date(watchedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`
          : "Watched"
        : marking
          ? "Marking..."
          : "Mark as watched"}
    </button>
  );
};

export default ProgressToggle;
