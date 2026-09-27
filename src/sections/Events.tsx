import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import * as api from "../services/api";
import type { BackendEvent } from "../services/api";
import RsvpButton from "../components/RsvpButton";
import EventCover from "../components/EventCover";
import EmptyState from "../components/EmptyState";

const UPCOMING_LIMIT = 3;
const PAST_LIMIT = 3;

const locationLabel = (event: BackendEvent) =>
  event.locationType === "online"
    ? "Online"
    : event.locationType === "offline" && event.locationAddress
      ? event.locationAddress
      : "";

/** "Today", "Tomorrow", "In 5 days" for an upcoming date. */
const relativeDay = (date: Date) => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

const UpcomingEventCard: React.FC<{ event: BackendEvent }> = ({ event }) => {
  const start = new Date(event.date);
  const meta = [
    start.toLocaleString(undefined, {
      weekday: "short",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    locationLabel(event),
  ].filter(Boolean);

  return (
    <article className="grid grid-cols-1 items-center gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_320px] md:p-6">
      <div>
        <span className="mb-3 inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary-dark">
          {relativeDay(start)}
        </span>
        <h3 className="mb-2 text-2xl font-bold leading-snug text-neutral-darker">
          <Link to={`/events/${event._id}`} className="transition-colors hover:text-primary">
            {event.title}
          </Link>
        </h3>
        <p className="mb-3 text-sm font-semibold text-primary">{meta.join(" · ")}</p>
        {event.description && (
          <p className="mb-5 line-clamp-3 whitespace-pre-line text-base leading-7 text-neutral-dark">
            {event.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/events/${event._id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            View details
          </Link>
          <RsvpButton event={event} />
        </div>
      </div>
      <EventCover event={event} className="h-48 md:h-52" />
    </article>
  );
};

const PastEventCard: React.FC<{ event: BackendEvent }> = ({ event }) => (
  <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <EventCover event={event} flush className="h-36" />
    <div className="p-4">
      <p className="mb-1 text-xs font-semibold text-neutral-dark">
        {new Date(event.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <h4 className="font-bold leading-snug text-neutral-darker">
        {/* The link covers the whole card. */}
        <Link
          to={`/events/${event._id}`}
          className="after:absolute after:inset-0 group-hover:text-primary"
        >
          {event.title}
        </Link>
      </h4>
    </div>
  </article>
);

const Events: React.FC = () => {
  const [upcoming, setUpcoming] = useState<BackendEvent[]>([]);
  const [past, setPast] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const now = encodeURIComponent(new Date().toISOString());
    Promise.all([
      api.getEvents(`sort=date&limit=${UPCOMING_LIMIT}&date[gte]=${now}`),
      api.getEvents(`sort=-date&limit=${PAST_LIMIT}&date[lt]=${now}`),
    ])
      .then(([next, previous]) => {
        if (cancelled) return;
        setUpcoming(next.data.events);
        setPast(previous.data.events);
      })
      .catch(() => {
        // Keep empty lists; the section shows its empty state.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full bg-neutral-light px-6 py-14">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="mb-2 text-center text-4xl font-extrabold text-primary-darker">Events</h2>
        <p className="mb-10 text-center text-neutral-dark">
          Workshops, talks and meetups run by TROSC.
        </p>

        {loading ? (
          <div className="space-y-5">
            {[1, 2].map((n) => (
              <div key={n} className="h-56 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <div className="space-y-5">
                {upcoming.map((event) => (
                  <UpcomingEventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                message="No upcoming events right now. New ones are announced here first."
              />
            )}

            {past.length > 0 && (
              <div className="mt-12">
                <h3 className="mb-5 text-xl font-bold text-neutral-darker">Past events</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((event) => (
                    <PastEventCard key={event._id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Events;
