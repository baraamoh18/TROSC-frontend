import { useEffect, useState } from "react";
import type { FC } from "react";
import { Star, UserCircle, Loader2, Trash2, MessageSquare } from "lucide-react";
import EmptyState from "./EmptyState";
import toast from "react-hot-toast";
import * as api from "../services/api";
import type { Review } from "../services/api";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ApiError } from "../services/api";
import { isDefaultPhoto } from "../utils/photoUtils";

export type FeedbackSubject = "track" | "course" | "session";

interface FeedbackPanelProps {
  subject: FeedbackSubject;
  subjectId: string;
}

const REVIEW_API: Record<
  FeedbackSubject,
  {
    load: (id: string) => Promise<api.ReviewsResponse>;
    submit: (id: string, payload: api.ReviewPayload) => Promise<{ data: { review: Review } }>;
    /** Absent for tracks: the API has no track-review delete endpoint. */
    remove?: (id: string, reviewId: string) => Promise<void>;
  }
> = {
  track: { load: api.getTrackReviews, submit: api.submitTrackReview },
  course: { load: api.getCourseReviews, submit: api.submitCourseReview, remove: api.deleteCourseReview },
  session: { load: api.getSessionReviews, submit: api.submitSessionReview, remove: api.deleteSessionReview },
};

const StarRating = ({
  value,
  hover,
  onRate,
  onHover,
  onLeave,
  disabled,
}: {
  value: number;
  hover: number;
  onRate: (v: number) => void;
  onHover: (v: number) => void;
  onLeave: () => void;
  disabled?: boolean;
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={disabled}
        className="focus:outline-none transition-colors disabled:cursor-not-allowed"
        onClick={() => onRate(star)}
        onMouseEnter={() => onHover(star)}
        onMouseLeave={onLeave}
        aria-label={`Rate ${star} out of 5 stars`}
      >
        <Star
          className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-150 ${
            star <= (hover || value)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      </button>
    ))}
  </div>
);

const ReviewCard = ({ review, onDelete }: { review: Review; onDelete?: () => Promise<void> }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
      {!isDefaultPhoto(review.user.photo) ? (
        <img loading="lazy"
          src={review.user.photo}
          alt={review.user.name}
          className="h-10 w-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <UserCircle size={40} className="text-neutral shrink-0" strokeWidth={1} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {review.user.name}
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-auto">{date}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
        {onDelete && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1 font-semibold text-neutral-dark hover:text-primary-dark"
              >
                <Trash2 size={12} />
                Delete my review
              </button>
            ) : (
              <>
                <span className="font-semibold text-primary-dark">Delete this review?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await onDelete();
                    } finally {
                      setDeleting(false);
                      setConfirming(false);
                    }
                  }}
                  className="rounded-lg bg-primary-dark px-3 py-1 font-bold text-white disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-neutral-light-active bg-white px-3 py-1 font-bold text-neutral-dark"
                >
                  No
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Rating + written review form and review list for a track, course or session. */
const FeedbackPanel: FC<FeedbackPanelProps> = ({ subject, subjectId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Load existing reviews
  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;
    REVIEW_API[subject]
      .load(subjectId)
      .then((res) => {
        if (!cancelled) setReviews(res.data.reviews);
      })
      .catch(() => {
        // Reviews unavailable — show empty state
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject, subjectId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Sign in to leave a review.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (text.trim().length === 0) {
      toast.error("Please write your feedback.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await REVIEW_API[subject].submit(subjectId, {
        rating,
        content: text.trim(),
      });
      toast.success("Thanks for your feedback!");
      // The submit response returns `user` as a bare id; fill in the
      // reviewer so the new card shows a name and can be deleted.
      const created = res.data.review;
      const withUser: Review =
        typeof created.user === "object" && created.user
          ? created
          : { ...created, user: { _id: user._id, name: user.name, photo: user.photo } };
      setReviews((prev) => [withUser, ...prev]);
      setText("");
      setRating(0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Sign in to leave a review.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Failed to submit feedback.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Signed out: no form they can't use, just a way in */}
      {!user ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-700">Sign in to rate and review this {subject}.</p>
          <Link
            to="/signin"
            state={{ from: location }}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        </div>
      ) : (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-primary-darker">Review this {subject}</h2>
        <p className="mb-6 max-w-2xl text-gray-700">
          Tell us what you liked, what was hard, and what you want to learn next.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-stretch">
          <div className="flex-1 w-full">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={submitting}
              aria-label={`Your review of this ${subject}`}
              className="w-full h-32 md:h-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white disabled:opacity-60"
              placeholder={
                user
                  ? "Tell us your feedback..."
                  : "Sign in to leave a review..."
              }
            />
          </div>

          <div className="flex flex-col items-center justify-center min-w-[200px] w-full md:w-auto">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Your rating</h3>
            <StarRating
              value={rating}
              hover={hover}
              onRate={setRating}
              onHover={setHover}
              onLeave={() => setHover(0)}
              disabled={submitting}
            />
            <p className="mt-2 mb-6 text-sm text-gray-600">
              {rating > 0
                ? ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]
                : "Tap a star to rate"}
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !user}
              title={!user ? "Sign in to leave a review" : undefined}
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit review"
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Reviews list */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h3>

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            message={user ? "No reviews yet. Be the first to share one." : "No reviews yet."}
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const remove = REVIEW_API[subject].remove;
              const isMine = !!user && r.user?._id === user._id;
              return (
                <ReviewCard
                  key={r._id}
                  review={r}
                  onDelete={
                    remove && isMine
                      ? async () => {
                          try {
                            await remove(subjectId, r._id);
                            setReviews((prev) => prev.filter((x) => x._id !== r._id));
                            toast.success("Review deleted.");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Couldn't delete review.");
                          }
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
