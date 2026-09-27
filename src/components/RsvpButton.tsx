import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck } from "lucide-react";
import * as api from "../services/api";
import { ApiError } from "../services/api";
import type { BackendEvent } from "../services/api";
import { useAuth } from "../context/useAuth";

interface RsvpButtonProps {
  event: BackendEvent;
  /** Lets the parent sync its own attendees state after a successful toggle. */
  onToggle?: (rsvped: boolean) => void;
}

/**
 * RSVP / Cancel-RSVP toggle for an event. Guests who click it are told to
 * sign in; the server remains authoritative about attendance.
 */
const RsvpButton = ({ event, onToggle }: RsvpButtonProps) => {
  const { user } = useAuth();
  const [rsvped, setRsvped] = useState(
    () => !!user && event.attendees.includes(user._id),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRsvped(!!user && event.attendees.includes(user._id));
  }, [user, event.attendees]);

  const handleRsvp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (rsvped) {
        await api.cancelRsvp(event._id);
        setRsvped(false);
        onToggle?.(false);
        toast.success("RSVP cancelled.");
      } else {
        await api.rsvpEvent(event._id);
        setRsvped(true);
        onToggle?.(true);
        toast.success("You're registered for this event!");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Sign in to RSVP for events.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRsvp}
      disabled={loading}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-7 py-2.5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        rsvped
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-primary text-white hover:bg-primary-hover"
      }`}
    >
      {!rsvped && <CalendarCheck size={18} />}
      {loading ? "..." : rsvped ? "Cancel RSVP" : "RSVP Now"}
    </button>
  );
};

export default RsvpButton;
