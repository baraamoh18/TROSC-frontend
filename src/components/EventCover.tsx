import { CalendarDays } from "lucide-react";
import type { BackendEvent } from "../services/api";
import { realImage } from "../utils/trackVisuals";

/** Event cover image, or a brand-coloured block with the date when there is none. */
interface EventCoverProps {
  event: BackendEvent;
  className?: string;
  /** No corners or shadow, for covers that sit inside a card. */
  flush?: boolean;
}

const EventCover = ({ event, className = "", flush = false }: EventCoverProps) => {
  const src = realImage(event.coverImage);
  const frame = flush ? "" : "rounded-xl shadow-md";
  if (src) {
    return (
      <img loading="lazy" src={src} alt="" className={`w-full object-cover ${frame} ${className}`} />
    );
  }
  const date = new Date(event.date);
  return (
    <div
      aria-hidden="true"
      className={`flex w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary-dark to-primary-darker text-white ${frame} ${className}`}
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
