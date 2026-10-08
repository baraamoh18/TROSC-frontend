import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ExternalLink, Globe, MapPin, Paperclip } from "lucide-react";
import * as api from "../services/api";
import type { BackendEvent } from "../services/api";
import RsvpButton from "../components/RsvpButton";
import EventCover from "../components/EventCover";
import usePageTitle from "../hooks/usePageTitle";

const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    api
      .getEvent(eventId)
      .then((res) => {
        if (!cancelled) setEvent(res.data.event);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  usePageTitle(event?.title);

  if (loading) {
    return (
      <div className="min-h-screen bg-page pt-24 pb-20">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-6 h-8 w-2/3 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4 pt-16 text-center">
        <div>
          <h1 className="mb-3 text-3xl font-bold text-neutral-darker">Event not found</h1>
          <p className="mb-6 text-neutral-dark">It may have been removed, or the link is incorrect.</p>
          <Link
            to="/#events"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            See all events
          </Link>
        </div>
      </div>
    );
  }

  const start = new Date(event.date);
  const isUpcoming = start.getTime() > Date.now();
  const isOnline = event.locationType === "online";

  return (
    <div className="min-h-screen bg-page pt-24 pb-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        <Link
          to="/#events"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-dark transition-colors hover:text-brand"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All events
        </Link>

        <EventCover event={event} className="h-56 sm:h-72" />

        <article className="mt-6 rounded-xl bg-surface p-6 shadow-sm sm:p-8">
          {!isUpcoming && (
            <span className="mb-3 inline-block rounded-full bg-neutral-light-active px-3 py-1 text-xs font-bold text-neutral-dark">
              Past event
            </span>
          )}
          <h1 className="text-2xl font-extrabold text-neutral-darker sm:text-3xl">{event.title}</h1>

          <ul className="mt-4 space-y-2 text-sm text-neutral-dark">
            <li className="flex items-center gap-2">
              <CalendarDays size={16} className="shrink-0 text-brand" aria-hidden="true" />
              {start.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
            </li>
            <li className="flex items-center gap-2">
              {isOnline ? (
                <Globe size={16} className="shrink-0 text-brand" aria-hidden="true" />
              ) : (
                <MapPin size={16} className="shrink-0 text-brand" aria-hidden="true" />
              )}
              {isOnline ? "Online" : event.locationAddress || "Location to be announced"}
            </li>
          </ul>

          {event.description && (
            <p className="mt-6 whitespace-pre-line text-base leading-7 text-neutral-darker">
              {event.description}
            </p>
          )}

          {isUpcoming && (
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-neutral-light-active pt-6">
              <RsvpButton event={event} />
              {/* The meeting or map link only matters before the event starts. */}
              {event.locationLink && (
                <a
                  href={event.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-light-active px-4 py-2 text-sm font-bold text-neutral-darker transition-colors hover:bg-neutral-light"
                >
                  {isOnline ? "Join link" : "Open map"}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {(event.attachments?.length ?? 0) > 0 && (
            <div className="mt-8 border-t border-neutral-light-active pt-6">
              <h2 className="mb-3 text-lg font-bold text-neutral-darker">Materials</h2>
              <ul className="space-y-2">
                {event.attachments!.map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"
                    >
                      <Paperclip size={14} aria-hidden="true" />
                      Attachment {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default EventDetailsPage;
