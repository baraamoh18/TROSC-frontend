import React, { useRef, useState } from "react";
import {
  CheckSquare,
  Clock,
  Upload,
  X,
  Loader2,
  Star,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, Submission } from "../../services/api";
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
  onSuccess: (assignmentId: string, submission: Submission) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const ACCEPTED_FILES = ".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg";

  const selectFile = (candidate?: File) => {
    if (!candidate) return;
    if (candidate.size > MAX_FILE_SIZE) {
      toast.error("Choose a file smaller than 20 MB.");
      return;
    }
    setFile(candidate);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Choose a file to submit.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.uploadAssignmentSubmission(assignment._id, file);
      toast.success("Assignment submitted!");
      onSuccess(assignment._id, response.data.submission);
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

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILES}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
          className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
          }`}
        >
          <Upload className="mx-auto mb-2 h-5 w-5 text-primary" />
          {file ? (
            <>
              <p className="text-sm font-semibold text-gray-900 break-all">{file.name}</p>
              <p className="mt-1 text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
              <p className="mt-1 text-xs text-gray-500">PDF, Word, ZIP, PNG, or JPG · Maximum 20 MB</p>
            </>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Your file is uploaded securely. You will not be sent to Google Drive.
        </p>

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
  isEnrolled: boolean;
  onSubmissionUpdate?: (assignmentId: string, submission: Submission) => void;
}

const TrackAssignments: React.FC<TrackAssignmentsProps> = ({
  assignments,
  isEnrolled,
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

                  {hasSub && assignment.mySubmission?.fileName && (
                    <p className="mt-2 text-xs text-gray-500">
                      Submitted file: {assignment.mySubmission.fileName}
                    </p>
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
