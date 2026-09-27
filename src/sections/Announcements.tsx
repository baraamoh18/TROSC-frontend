import { useEffect, useState } from "react";
import { Pin, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import * as api from "../services/api";
import type { BackendAnnouncement } from "../services/api";

// ── Single announcement card ──────────────────────────────────

const AnnouncementCard = ({ ann }: { ann: BackendAnnouncement }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = ann.message.length > 160;

  const dateLabel = new Date(ann.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`rounded-xl border bg-white px-5 py-4 shadow-sm transition-all ${
        ann.isPinned
          ? "border-primary/30 ring-1 ring-primary/20"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 shrink-0 rounded-xl p-2 ${
            ann.isPinned ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
          }`}
        >
          {ann.isPinned ? (
            <Pin className="w-4 h-4" />
          ) : (
            <Megaphone className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">
              {ann.title}
            </h3>
            {ann.isPinned && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Pinned
              </span>
            )}
            <span className="ml-auto text-xs text-gray-500 shrink-0">
              {dateLabel}
            </span>
          </div>

          <p
            className={`text-sm text-gray-600 leading-relaxed ${
              !expanded && isLong ? "line-clamp-2" : ""
            }`}
          >
            {ann.message}
          </p>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Read more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Fetch public announcements — pinned first, then newest first
    api
      .getAnnouncements("audience=all&sort=-isPinned,-createdAt&limit=6")
      .then((res) => {
        if (!cancelled) setAnnouncements(res.data.announcements);
      })
      .catch(() => {
        // Keep empty array — section silently hides
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing until there is something to show: a skeleton that then
  // disappears would shift every section below it.
  if (loading || announcements.length === 0) return null;

  return (
    <section
      id="announcements"
      className="w-full bg-white px-6 py-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="mb-8 text-3xl font-extrabold text-primary-darker">
          Announcements
        </h2>

        <div className="space-y-4">
          {announcements.map((ann) => (
            <AnnouncementCard key={ann._id} ann={ann} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;
