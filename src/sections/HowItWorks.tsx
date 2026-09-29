import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Compass, Send, CalendarCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "../components/Reveal";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
  details?: string[];
}

const STEPS: Step[] = [
  {
    icon: Compass,
    title: "Pick a track",
    text: "Browse the tracks and choose the field you want to grow in.",
  },
  {
    icon: Send,
    title: "Request to join",
    text: "Send a join request from the track page. The track's instructor reviews it and lets you in.",
    details: ["One track at a time"],
  },
  {
    icon: CalendarCheck,
    title: "Learn every week",
    text: "Attend sessions, catch up on recordings and tick off your weekly tasks as you go.",
    details: ["Sessions", "Recordings", "Weekly tasks"],
  },
  {
    icon: ClipboardCheck,
    title: "Get your work reviewed",
    text: "Submit your assignments and get a grade and written feedback from your instructor.",
    details: ["Assignments", "Grades", "Feedback"],
  },
];

// A step lights up once its marker passes this point of the viewport.
const TRIGGER = 0.6;

/**
 * Fills the journey line as the list scrolls past, and returns how many steps
 * it has reached. The line is styled directly so scrolling doesn't re-render.
 */
function useJourneyProgress(
  listRef: RefObject<HTMLOListElement | null>,
  fillRef: RefObject<HTMLSpanElement | null>,
  disabled: boolean,
) {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    if (disabled) return;
    const list = listRef.current;
    const fill = fillRef.current;
    if (!list || !fill) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * TRIGGER;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (line - rect.top) / rect.height));
      fill.style.transform = `scaleY(${progress})`;
      const markers = list.querySelectorAll<HTMLElement>("[data-step-marker]");
      let count = 0;
      markers.forEach((m) => {
        if (m.getBoundingClientRect().top < line) count += 1;
      });
      setReached(count);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [listRef, fillRef, disabled]);

  // Without motion the whole journey is shown as complete.
  return disabled ? STEPS.length : reached;
}

const HowItWorks = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const reached = useJourneyProgress(listRef, fillRef, reduceMotion);

  return (
    <section id="how-it-works" className="w-full bg-neutral-light px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal className="self-start lg:sticky lg:top-28">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="text-3xl font-extrabold leading-tight text-primary-darker md:text-4xl">
            From your first click to your first reviewed assignment.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-dark">
            Every track runs the same way, so you always know what comes next.
          </p>
          <Link
            to="/explore"
            className="group mt-8 inline-flex min-h-11 items-center gap-2 font-bold text-primary transition-colors hover:text-primary-hover"
          >
            Find your track
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform duration-300 motion-safe:group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        <ol ref={listRef} className="relative space-y-6">
          {/* The journey line, filling in red as you scroll */}
          <span
            aria-hidden="true"
            className="absolute bottom-10 left-6 top-10 w-0.5 -translate-x-1/2 bg-neutral-light-active"
          />
          <span
            ref={fillRef}
            aria-hidden="true"
            className="absolute bottom-10 left-6 top-10 w-0.5 origin-top -translate-x-1/2 bg-primary"
            style={reduceMotion ? undefined : { transform: "scaleY(0)" }}
          />

          {STEPS.map((step, i) => {
            const done = i < reached;
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative flex gap-5">
                <span
                  data-step-marker=""
                  className={`relative z-10 mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                    done
                      ? "border-primary bg-primary text-white"
                      : "border-neutral-light-active bg-white text-neutral-dark"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>

                <Reveal delay={80} className="min-w-0 flex-1">
                  <div
                    className={`rounded-xl border bg-white p-6 transition-[border-color,box-shadow] duration-500 ${
                      done ? "border-primary-light-active shadow-md" : "border-neutral-light-active shadow-sm"
                    }`}
                  >
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                      Step {i + 1}
                    </p>
                    <h3 className="mb-2 text-xl font-bold text-neutral-darker">{step.title}</h3>
                    <p className="leading-relaxed text-neutral-dark">{step.text}</p>
                    {step.details && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {step.details.map((d) => (
                        <li
                          key={d}
                          className="rounded-md bg-neutral-light px-2.5 py-1 text-xs font-semibold text-neutral-darker"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
