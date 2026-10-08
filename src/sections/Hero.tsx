import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronDown } from "lucide-react";
import TeamPic from "../../assets/teamwork.webp";
import TeamPic2 from "../../assets/teamwork2.webp";
import * as api from "../services/api";
import type { BackendEvent } from "../services/api";
import { useAuth } from "../context/useAuth";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { smoothScrollToId } from "../utils/smoothScroll";
import { delay } from "../utils/motion";

const HEADLINE = ["Not", "just", "a", "team.", "A", "family", "of"];

const AREAS = ["Frontend & UI/UX", "Backend", "Mobile", "Cyber Security", "AI", "3D"];

// Both photos have the logo and social icons printed along the top and
// bottom edges; the 16:9 frame crops them out at every width.
const PHOTOS = [
  { src: TeamPic, alt: "TROSC members together at a team meetup" },
  { src: TeamPic2, alt: "A group selfie of TROSC members" },
];
const PHOTO_INTERVAL = 6000;

/** The soonest upcoming event, or null when there is none. */
function useNextEvent() {
  const [event, setEvent] = useState<BackendEvent | null>(null);
  useEffect(() => {
    let cancelled = false;
    const now = encodeURIComponent(new Date().toISOString());
    api
      .getEvents(`sort=date&limit=1&date[gte]=${now}`)
      .then((res) => {
        if (!cancelled) setEvent(res.data.events[0] ?? null);
      })
      .catch(() => {
        // No card; the hero works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return event;
}

function Hero() {
  const { user } = useAuth();
  const reduceMotion = usePrefersReducedMotion();
  const nextEvent = useNextEvent();
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setPhoto((p) => (p + 1) % PHOTOS.length), PHOTO_INTERVAL);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const wordDelay = (i: number) => delay(80 + i * 70);
  const afterHeadline = 80 + (HEADLINE.length + 1) * 70;

  return (
    <section className="relative overflow-hidden bg-page-alt pt-16">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-14 lg:pt-20">
        <div>
          <p
            className="anim-rise mb-5 text-sm font-bold uppercase tracking-widest text-brand"
            style={delay(0)}
          >
            Student-led tech team
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.1] text-brand-darker sm:text-5xl lg:text-6xl">
            {HEADLINE.map((word, i) => (
              <span key={i}>
                <span className="anim-rise inline-block" style={wordDelay(i)}>
                  {word}
                </span>{" "}
              </span>
            ))}
            <span className="anim-rise relative isolate inline-block text-brand" style={wordDelay(HEADLINE.length)}>
              growth.
              <span
                aria-hidden="true"
                className="anim-draw absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.22em] rounded-sm bg-primary-light-active"
                style={delay(afterHeadline + 150)}
              />
            </span>
          </h1>

          <p
            className="anim-rise mt-6 max-w-xl text-base leading-relaxed text-neutral-dark sm:text-lg"
            style={delay(afterHeadline)}
          >
            TROSC is a student-led team from the Faculty of Computers and Information. We run
            learning tracks with live sessions, weekly tasks and instructors who review your work.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Our tracks cover">
            {AREAS.map((area, i) => (
              <li
                key={area}
                className="anim-rise rounded-md border border-neutral-light-active bg-neutral-light px-3 py-1.5 text-sm font-semibold text-neutral-darker"
                style={delay(afterHeadline + 100 + i * 60)}
              >
                {area}
              </li>
            ))}
          </ul>

          <div
            className="anim-rise mt-8 flex flex-wrap items-center gap-3"
            style={delay(afterHeadline + 200 + AREAS.length * 60)}
          >
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-7 text-base font-bold text-white shadow-md transition-colors hover:bg-primary-hover"
            >
              {user ? "Go to my dashboard" : "Join our family"}
              <ArrowRight
                size={18}
                aria-hidden="true"
                className="transition-transform duration-300 motion-safe:group-hover:translate-x-1"
              />
            </Link>
            <Link
              to="/explore"
              className="inline-flex min-h-12 items-center rounded-lg border border-neutral-light-active bg-surface px-7 text-base font-bold text-neutral-darker transition-colors hover:border-primary hover:text-brand"
            >
              Explore tracks and courses
            </Link>
          </div>
        </div>

        {/* Photo: red offset block behind a cropped, cross-fading frame */}
        <div className="anim-rise relative mx-auto w-full max-w-2xl pb-8 lg:pb-0" style={delay(200)}>
          <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-primary lg:translate-x-4 lg:translate-y-4"
          />
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-light-active shadow-xl">
            {PHOTOS.map((p, i) => (
              <img
                key={p.src}
                src={p.src}
                alt={p.alt}
                aria-hidden={i !== photo}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
                  i === photo ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          </div>

          {nextEvent && (
            <Link
              to={`/events/${nextEvent._id}`}
              className="anim-rise group absolute -bottom-2 left-4 flex max-w-[85%] items-center gap-3 rounded-xl border border-neutral-light-active bg-surface p-3 pr-4 shadow-lg transition-shadow hover:shadow-xl sm:left-6 lg:-bottom-8"
              style={delay(900)}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-brand">
                <CalendarDays size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-neutral-dark">Next event</span>
                <span className="block truncate font-bold text-neutral-darker group-hover:text-brand">
                  {nextEvent.title}
                </span>
                <span className="block text-xs font-semibold text-brand">
                  {new Date(nextEvent.date).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex justify-center pb-8 lg:pb-10">
        <button
          type="button"
          onClick={() => smoothScrollToId("how-it-works")}
          aria-label="Scroll to how it works"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-dark transition-colors hover:text-brand"
        >
          <ChevronDown size={24} aria-hidden="true" className="anim-nudge" />
        </button>
      </div>
    </section>
  );
}

export default Hero;
