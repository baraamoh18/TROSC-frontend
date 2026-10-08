import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  Upload,
  Send,
  X,
  Loader2,
  Star,
  AlertCircle,
  FileText,
  Paperclip,
} from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, Submission } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import Modal from "../Modal";
import EmptyState from "../EmptyState";
import { hostListLabel, linkProblem, useTrustedHosts } from "../../utils/trustedHosts";

// ── Submission status badge ───────────────────────────────────

const SubmissionBadge = ({
  assignment,
}: {
  assignment: BackendAssignment;
}) => {
  const sub = assignment.mySubmission;

  if (!sub) {
    const isOverdue = new Date(assignment.deadline) < new Date();
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          isOverdue
            ? "bg-danger-tint text-danger-ink"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        <AlertCircle className="w-3 h-3" />
        {isOverdue ? "Overdue" : "Not submitted"}
      </span>
    );
  }

  if (sub.grade !== undefined && sub.grade !== null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-warning-tint text-warning-ink">
        <Star className="w-3 h-3" />
        Graded: {sub.grade}/100
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-success-tint text-success-ink">
      <CheckSquare className="w-3 h-3" />
      Submitted · awaiting grade
    </span>
  );
};

// ── Submit modal ──────────────────────────────────────────────

const SubmitModal = ({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: BackendAssignment;
  onClose: () => void;
  onSuccess: (assignmentId: string, submission: Submission) => void;
}) => {
  const [url, setUrl] = useState(assignment.mySubmission?.file ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hosts = useTrustedHosts();

  const handleSubmit = async () => {
    const value = url.trim();
    const problem = value ? linkProblem(value, hosts) : "Paste the full link to your work, starting with https://";
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await api.submitAssignmentLink(assignment._id, value);
      toast.success("Assignment submitted.");
      onSuccess(assignment._id, response.data.submission);
      onClose();
    } catch (err) {
      // Shown in the dialog so it doesn't vanish like a toast.
      setError(err instanceof Error ? err.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={() => {
        if (!submitting) onClose();
      }}
      labelledBy="submit-assignment-title"
      className="max-w-md p-6"
    >
        <div className="flex items-center justify-between mb-4">
          <h3 id="submit-assignment-title" className="text-lg font-bold text-gray-900">
            {assignment.mySubmission ? "Resubmit assignment" : "Submit assignment"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-1 font-medium">
          {assignment.title}
        </p>
        <p className="text-xs text-gray-600 mb-4">
          Deadline:{" "}
          {new Date(assignment.deadline).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {assignment.mySubmission?.grade != null && (
          <p className="mb-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
            Resubmitting clears your current grade and feedback until your
            instructor grades the new work.
          </p>
        )}

        <label htmlFor="submission-link" className="mb-1 block text-sm font-semibold text-gray-800">
          Link to your work
        </label>
        <input
          id="submission-link"
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "submission-link-hint submission-link-error" : "submission-link-hint"}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p id="submission-link-hint" className="mt-1 mb-4 text-xs text-gray-600">
          Make sure anyone with the link can view it. Allowed hosts: {hostListLabel(hosts)}.
        </p>
        {error && (
          <p id="submission-link-error" role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-ink">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
    </Modal>
  );
};

// ── Main component ────────────────────────────────────────────

interface TrackAssignmentsProps {
  assignments: BackendAssignment[];
  isEnrolled: boolean;
  onSubmissionUpdate?: (assignmentId: string, submission: Submission) => void;
  /** Leave the heading to the page around it. */
  hideHeading?: boolean;
}

const TrackAssignments: React.FC<TrackAssignmentsProps> = ({
  assignments,
  isEnrolled,
  onSubmissionUpdate,
  hideHeading = false,
}) => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] =
    useState<BackendAssignment | null>(null);

  if (assignments.length === 0) {
    return (
      <div>
        {!hideHeading && <h2 className="mb-6 text-2xl font-bold text-brand-darker">Assignments</h2>}
        <EmptyState icon={FileText} message="No assignments have been added to this track yet." />
      </div>
    );
  }

  return (
    <div>
      {!hideHeading && <h2 className="mb-6 text-2xl font-bold text-brand-darker">Assignments</h2>}

      <div className="space-y-4">
        {assignments.map((assignment, index) => {
          const deadline = new Date(assignment.deadline);
          const deadlineLabel = deadline.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const isOverdue = deadline < new Date();
          const hasSub = !!assignment.mySubmission;

          return (
            <div
              key={assignment._id}
              className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-gray-500">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {assignment.title}
                    </h3>
                    <SubmissionBadge assignment={assignment} />
                  </div>

                  {assignment.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className={isOverdue && !hasSub ? "text-danger-ink font-medium" : ""}>
                      Deadline: {deadlineLabel}
                    </span>
                  </div>

                  {(assignment.attachments?.length ?? 0) > 0 && (
                    <ul className="mt-2 space-y-1" aria-label={`Attachments for ${assignment.title}`}>
                      {assignment.attachments.map((url, i) => (
                        <li key={`${url}-${i}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-6 max-w-full items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
                          >
                            <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasSub && assignment.mySubmission?.file && (
                    <p className="mt-2 text-xs text-gray-600">
                      Your submission:{" "}
                      <a
                        href={assignment.mySubmission.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-semibold text-brand hover:text-brand-hover"
                      >
                        {assignment.mySubmission.file}
                      </a>
                    </p>
                  )}

                  {assignment.mySubmission?.feedback && (
                    <div className="mt-3 rounded-lg border-l-4 border-primary bg-neutral-light px-3 py-2">
                      <p className="text-xs font-semibold text-neutral-darker">Instructor feedback</p>
                      <p className="mt-0.5 whitespace-pre-line text-sm text-neutral-dark">
                        {assignment.mySubmission.feedback}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit / Resubmit button */}
                {user && isEnrolled && (
                  <button
                    onClick={() => setSelectedAssignment(assignment)}
                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                      hasSub
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-primary hover:bg-primary-hover text-white"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {hasSub ? "Resubmit" : "Submit"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedAssignment && (
        <SubmitModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={(id, submission) => {
            setSelectedAssignment(null);
            onSubmissionUpdate?.(id, submission);
          }}
        />
      )}
    </div>
  );
};

export default TrackAssignments;
