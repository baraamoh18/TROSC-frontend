import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  Upload,
  ExternalLink,
  X,
  Loader2,
  Star,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment } from "../../services/api";
import { useAuth } from "../../context/useAuth";

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
            ? "bg-red-100 text-red-700"
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
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
        <Star className="w-3 h-3" />
        Graded: {sub.grade}/100
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
      <CheckSquare className="w-3 h-3" />
      Submitted
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
  onSuccess: (assignmentId: string, fileUrl: string) => void;
}) => {
  const [url, setUrl] = useState(assignment.mySubmission?.file ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a valid URL.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error("Please enter a valid URL (must start with http/https).");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitAssignment(assignment._id, { file: trimmed });
      toast.success("Assignment submitted!");
      onSuccess(assignment._id, trimmed);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {assignment.mySubmission ? "Resubmit Assignment" : "Submit Assignment"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-1 font-medium">
          {assignment.title}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Deadline:{" "}
          {new Date(assignment.deadline).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Submission URL
          <span className="text-gray-400 font-normal ml-1">
            (Google Drive, GitHub, etc.)
          </span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={16} />
                Submit
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────

interface TrackAssignmentsProps {
  assignments: BackendAssignment[];
  onSubmissionUpdate?: (assignmentId: string, fileUrl: string) => void;
}

const TrackAssignments: React.FC<TrackAssignmentsProps> = ({
  assignments,
  onSubmissionUpdate,
}) => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] =
    useState<BackendAssignment | null>(null);

  if (assignments.length === 0) {
    return (
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>
        <p className="text-gray-500 text-sm">
          No assignments have been added to this track yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignments</h2>

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
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-gray-400">
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
                    <span className={isOverdue && !hasSub ? "text-red-500 font-medium" : ""}>
                      Deadline: {deadlineLabel}
                    </span>
                  </div>

                  {/* Submitted file link */}
                  {hasSub && assignment.mySubmission?.file && (
                    <a
                      href={assignment.mySubmission.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary-hover font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View my submission
                    </a>
                  )}
                </div>

                {/* Submit / Resubmit button */}
                {user && (
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
          onSuccess={(id, fileUrl) => {
            setSelectedAssignment(null);
            onSubmissionUpdate?.(id, fileUrl);
          }}
        />
      )}
    </div>
  );
};

export default TrackAssignments;
