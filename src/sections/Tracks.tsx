import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TrackCard from "./trackCard";
import Reveal from "../components/Reveal";
import { toTrackItem } from "../utils/trackVisuals";
import * as api from "../services/api";
import type { TrackItem } from "../data/tracksData";

const TrackSkeleton = () => (
  <div className="bg-gray-100 rounded-xl overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);


// ── Tracks section ────────────────────────────────────────────

const Tracks = () => {
  // null = still loading, [] = loaded but empty, [...] = has tracks
  const [tracks, setTracks] = useState<TrackItem[] | null>(null);

  // Landing page shows first 3 published tracks
  useEffect(() => {
    let cancelled = false;
    api
      .getTracks("published=true&limit=3")
      .then((res) => {
        if (cancelled) return;
        setTracks(res.data.tracks.map(toTrackItem));
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = tracks === null;
  const featured = tracks ?? [];

  return (
    <div className="bg-neutral-light px-6 py-16 w-full flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
            Our Tracks
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            [1, 2, 3].map((n) => <TrackSkeleton key={n} />)
          ) : featured.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No tracks have been published yet.</p>
            </div>
          ) : (
            featured.map((track, i) => (
              <Reveal key={track.id} delay={i * 120} className="flex">
                <TrackCard track={track} />
              </Reveal>
            ))
          )}
        </div>

        {/* Only show the Explore link when there are tracks to browse */}
        {!loading && featured.length > 0 && (
          <div className="text-center">
            <Link
              to="/explore"
              className="inline-flex min-h-12 items-center py-3 px-10 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-300 shadow-md"
            >
              See all tracks and courses
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};

export default Tracks;
