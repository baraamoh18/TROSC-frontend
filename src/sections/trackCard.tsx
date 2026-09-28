import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { TrackItem } from "../data/tracksData";

const TrackCard = ({ track }: { track: TrackItem }) => {
  return (
    <div className="group relative w-full bg-white rounded-xl overflow-hidden shadow-md transition-[box-shadow,translate] duration-300 hover:shadow-xl motion-safe:hover:-translate-y-1 flex flex-col">
      <div className="h-48 overflow-hidden">
      {track.imageUrl ? (
        <img loading="lazy"
          src={track.imageUrl}
          alt={track.title}
          className="w-full h-48 object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23e2e8f0'/%3E%3Ctext x='300' y='200' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='18' fill='%23718096'%3EImage not found%3C/text%3E%3C/svg%3E";
          }}
        />
      ) : (
        <div
          className="w-full h-48 flex items-center justify-center transition-transform duration-500 motion-safe:group-hover:scale-105"
          style={{ background: track.gradient }}
        >
          <span className="text-white text-5xl font-black opacity-40 select-none">
            {track.title[0]}
          </span>
        </div>
      )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{track.title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-1">
          {track.description}
        </p>
        {/* The link covers the whole card. */}
        <Link
          to={`/track/${track.id}`}
          className="inline-flex min-h-6 items-center gap-1 text-primary-dark font-semibold text-sm w-fit after:absolute after:inset-0 group-hover:text-primary"
        >
          View track
          <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default TrackCard;
