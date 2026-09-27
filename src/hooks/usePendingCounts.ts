import { useCallback, useEffect, useState } from "react";
import * as api from "../services/api";
import type { BackendTrack } from "../services/api";

/**
 * Pending join + leave requests per track, counted from the loaded lists.
 * `track.pendingStudents` can hold ids of deleted users, so its length
 * overstates what the approval panels show.
 */
export default function usePendingCounts(tracks: BackendTrack[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (tracks.length === 0) return;
    let cancelled = false;
    Promise.allSettled(tracks.map((t) => api.getTrackPending(t._id))).then((results) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          next[tracks[i]._id] =
            (r.value.data?.pendingStudents?.length ?? 0) + (r.value.data?.pendingLeaves?.length ?? 0);
        }
      });
      setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [tracks]);

  /** Call after loading or acting on one track's lists. */
  const setCount = useCallback((trackId: string, count: number) => {
    setCounts((prev) => ({ ...prev, [trackId]: count }));
  }, []);

  return { counts, setCount };
}
