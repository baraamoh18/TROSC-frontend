import { useEffect, useState } from "react";
import type { FC } from "react";
import { Star, UserCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../services/api";
import type { Review } from "../services/api";
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
  }
> = {
  track: { load: api.getTrackReviews, submit: api.submitTrackReview },
  course: { load: api.getCourseReviews, submit: api.submitCourseReview },
  session: { load: api.getSessionReviews, submit: api.submitSessionReview },
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

const ReviewCard = ({ review }: { review: Review }) => {
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
          <span className="text-xs text-gray-400 ml-auto">{date}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
      </div>
    </div>
  );
};

/** Rating + written review form and review list for a track, course or session. */
const FeedbackPanel: FC<FeedbackPanelProps> = ({ subject, subjectId }) => {
  const { user } = useAuth();
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
      setReviews((prev) => [res.data.review, ...prev]);
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
      {/* Submit form */}
      <div className="bg-gray-100 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Feedback Matters
        </h2>
        <p className="text-gray-700 mb-6 max-w-2xl">
          Help us make this {subject} even better.
          <br />
          Tell us what you liked, what was hard, and what you want to learn next.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-stretch">
          <div className="flex-1 w-full">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={submitting}
              className="w-full h-32 md:h-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white disabled:opacity-60"
              placeholder={
                user
                  ? "Tell us your feedback..."
                  : "Sign in to leave a review..."
              }
            />
          </div>

          <div className="flex flex-col items-center justify-center min-w-[200px] w-full md:w-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Rate the {subject}
            </h3>
            <StarRating
              value={rating}
              hover={hover}
              onRate={setRating}
              onHover={setHover}
              onLeave={() => setHover(0)}
              disabled={submitting}
            />
            <p className="mt-2 mb-6 text-sm text-gray-500">
              {rating > 0
                ? ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]
                : "Tap a star to rate"}
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !user}
              title={!user ? "Sign in to leave a review" : undefined}
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </div>
      </div>

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
          <p className="text-gray-500 text-sm">
            No reviews yet — be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
