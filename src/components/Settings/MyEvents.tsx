import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import * as api from "../../services/api";
import type { BackendEvent } from "../../services/api";
import SectionError from "./SectionError";

const PLACEHOLDER_IMAGE = "https://placehold.co/800x400?text=Trosc+Event";

/** Events the signed-in person has RSVP'd to. */
const MyEvents = () => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .getMyEvents()
      .then((res) => {
        if (!cancelled) setEvents(res.data?.events || []);
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
      <div className="space-y-4">
        {[1, 2].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }
  if (error) return <SectionError what="your events" onRetry={load} />;
  if (events.length === 0) {
    return (
      <p className="text-center text-neutral-dark">
        You haven't RSVP'd to any events yet.{" "}
        <Link to="/#events" className="font-semibold text-primary hover:text-primary-hover">
          Browse events
        </Link>{" "}
        to find something you like.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {events.map((event) => (
        <li key={event._id}>
          <Link
            to={`/events/${event._id}`}
            className="flex flex-col gap-4 rounded-xl border border-neutral-light-active p-4 transition-colors hover:bg-neutral-light sm:flex-row sm:items-center"
          >
            <img
              loading="lazy"
              src={event.coverImage || PLACEHOLDER_IMAGE}
              alt=""
              className="h-24 w-full shrink-0 rounded-lg object-cover sm:w-40"
            />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-neutral-darker">{event.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                <CalendarCheck size={16} aria-hidden="true" />
                {new Date(event.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                {event.locationType === "offline" && event.locationAddress
                  ? ` · ${event.locationAddress}`
                  : event.locationType === "online"
                    ? " · Online"
                    : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default MyEvents;
