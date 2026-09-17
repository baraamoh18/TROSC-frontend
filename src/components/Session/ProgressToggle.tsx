import { useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";

interface ProgressToggleProps {
  sessionId: string;
  initialWatched: boolean;
  /** Notifies the parent so it can sync its own session list state. */
  onWatched?: () => void;
}

/**
 * Marks a session as watched via PUT /sessions/:id/progress.
 * The backend has no "unwatch" action, so once watched the control
 * renders as a completed state.
 */
const ProgressToggle = ({
  sessionId,
  initialWatched,
  onWatched,
}: ProgressToggleProps) => {
  const [watched, setWatched] = useState(initialWatched);
  const [marking, setMarking] = useState(false);

  const handleMarkWatched = async () => {
    if (watched || marking) return;
    setMarking(true);
    try {
      await api.markSessionWatched(sessionId);
      setWatched(true);
      onWatched?.();
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
      className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
        watched
          ? "cursor-default bg-emerald-100 text-emerald-700"
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
      {watched ? "Watched" : marking ? "Marking..." : "Mark as watched"}
    </button>
  );
};

export default ProgressToggle;
