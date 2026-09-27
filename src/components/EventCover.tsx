import { CalendarDays } from "lucide-react";
import type { BackendEvent } from "../services/api";
import { realImage } from "../utils/trackVisuals";

/** Event cover image, or a brand-coloured block with the date when there is none. */
const EventCover = ({ event, className = "" }: { event: BackendEvent; className?: string }) => {
  const src = realImage(event.coverImage);
  if (src) {
    return (
      <img loading="lazy" src={src} alt="" className={`w-full rounded-2xl object-cover shadow-md ${className}`} />
    );
  }
  const date = new Date(event.date);
  return (
    <div
      aria-hidden="true"
      className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-primary-dark to-primary-darker text-white shadow-md ${className}`}
    >
      <CalendarDays size={28} className="opacity-70" />
      <span className="text-sm font-semibold uppercase tracking-widest opacity-80">
        {date.toLocaleDateString(undefined, { month: "short" })}
      </span>
      <span className="text-5xl font-extrabold leading-none">{date.getDate()}</span>
    </div>
  );
};

export default EventCover;
