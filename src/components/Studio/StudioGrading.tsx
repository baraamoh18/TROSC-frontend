import { useEffect, useState } from "react";
import { ClipboardCheck, ExternalLink, Loader2, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, BackendCourse, BackendSession, Submission } from "../../services/api";
import EmptyState from "../EmptyState";
import { assignmentTarget, cardCls, errorMessage, formatDateTime, inputCls, labelCls, primaryBtn, refId } from "./studioUi";
import type { CanManage } from "./studioUi";
import { studentOf, visibleSubmissions } from "../../utils/gradingList";
import type { GradeFilter, GradeOrder } from "../../utils/gradingList";

interface StudioGradingProps {
  assignments: BackendAssignment[];
  courses: BackendCourse[];
  sessions: BackendSession[];
  canManage: CanManage;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Refresh track-level counts after a grade is saved. */
  onGraded: () => void;
}

type Filter = GradeFilter;
type Order = GradeOrder;

const GradeRow = ({ assignmentId, submission, onSaved }: { assignmentId: string; submission: Submission; onSaved: (s: Submission) => void }) => {
  const student = studentOf(submission);
  const [grade, setGrade] = useState(submission.grade != null ? String(submission.grade) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const graded = submission.grade != null;
  const dirty = grade !== (graded ? String(submission.grade) : "") || feedback !== (submission.feedback ?? "");
  const base = `grade-${student._id}`;

  const save = async () => {
    const n = Number(grade);
    if (grade.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      setError("Enter a grade from 0 to 100.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.gradeSubmission(assignmentId, student._id, {
        grade: n,
        ...(feedback.trim() ? { feedback: feedback.trim() } : {}),
      });
      toast.success(`Grade saved for ${student.name}.`);
      onSaved({ ...submission, grade: n, feedback: feedback.trim() || null });
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the grade."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`${cardCls} p-4`}>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 items-start gap-3 lg:w-64 lg:shrink-0">
          <UserCircle size={36} className="shrink-0 text-gray-400" strokeWidth={1.5} aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-900">{student.name}</p>
            {student.email && <p className="truncate text-xs text-gray-600">{student.email}</p>}
            <p className="mt-1 text-xs text-gray-600">Submitted {formatDateTime(submission.submittedAt)}</p>
            {submission.file || submission.hasFile ? (
              <a
                href={submission.file ?? api.submissionFileUrl(assignmentId, student._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Open submission
              </a>
            ) : (
              <p className="mt-2 text-xs font-semibold text-warning-ink">No link attached</p>
            )}
            <span
              className={`mt-2 block w-fit rounded-full px-2 py-0.5 text-xs font-bold ${
                graded ? "bg-success-tint text-success-ink" : "bg-primary-light text-brand-dark"
              }`}
            >
              {graded ? `Graded: ${submission.grade}/100` : "Needs a grade"}
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
          <div>
            <label htmlFor={`${base}-g`} className={labelCls}>Grade</label>
            <input
              id={`${base}-g`}
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              className={inputCls}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? `${base}-err` : `${base}-hint`}
            />
            <p id={`${base}-hint`} className="mt-1 text-xs text-gray-600">Out of 100</p>
          </div>
          <div>
            <label htmlFor={`${base}-f`} className={labelCls}>Feedback (optional)</label>
            <textarea
              id={`${base}-f`}
              rows={3}
              maxLength={2000}
              className={inputCls}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-gray-600">{feedback.length}/2000</p>
          </div>
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            {error && (
              <p id={`${base}-err`} className="text-xs font-medium text-danger-ink">
                {error}
              </p>
            )}
            <button type="button" className={primaryBtn} onClick={save} disabled={saving || !dirty}>
              {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {graded ? "Update grade" : "Save grade"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

const StudioGrading = ({ assignments: all, courses, sessions, canManage, selectedId, onSelect, onGraded }: StudioGradingProps) => {
  // Admins, track staff and the parent's instructor can read and grade submissions.
  const assignments = all.filter((a) => canManage(a.instructor));
  const [detail, setDetail] = useState<BackendAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("ungraded");
  const [studentQuery, setStudentQuery] = useState("");
  const [order, setOrder] = useState<Order>("newest");
  const activeId = selectedId && assignments.some((a) => a._id === selectedId) ? selectedId : assignments[0]?._id;

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    api
      .getAssignment(activeId)
      .then((res) => {
        if (!cancelled) setDetail(res.data.assignment);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetail(null);
        setLoadError(errorMessage(err, "Couldn't load submissions."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        message={
          all.length > 0
            ? "You can grade assignments in courses and sessions you manage. The ones in this track belong to someone else."
            : "There's nothing to grade yet. Create an assignment first."
        }
      />
    );
  }

  const submissions = detail?._id === activeId ? detail.submissions ?? [] : [];
  const counts = {
    all: submissions.length,
    ungraded: submissions.filter((s) => s.grade == null).length,
    graded: submissions.filter((s) => s.grade != null).length,
  };
  const needle = studentQuery.trim();
  const shown = visibleSubmissions(submissions, { filter, query: studentQuery, order });

  const handleSaved = (updated: Submission) => {
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            submissions: (prev.submissions ?? []).map((s) => (refId(s.student) === refId(updated.student) ? updated : s)),
          }
        : prev,
    );
    onGraded();
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "ungraded", label: "Needs a grade" },
    { id: "graded", label: "Graded" },
    { id: "all", label: "All" },
  ];

  return (
    <div>
      <div className="mb-5">
        <label htmlFor="grade-assignment" className={labelCls}>Assignment</label>
        <select
          id="grade-assignment"
          className={`${inputCls} max-w-xl`}
          value={activeId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {assignments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.title} ({assignmentTarget(a, courses, sessions)})
            </option>
          ))}
        </select>
        {detail?._id === activeId && (
          <p className="mt-2 text-sm text-gray-600">Deadline {formatDateTime(detail.deadline)}</p>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter submissions" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-9 rounded-lg px-3 text-sm font-bold transition-colors ${
                filter === f.id ? "bg-inverse text-on-inverse" : "bg-surface text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <label htmlFor="grade-search" className="sr-only">Find a student</label>
          <input
            id="grade-search"
            type="search"
            placeholder="Find a student…"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            className={`${inputCls} min-w-44 flex-1 sm:max-w-60`}
          />
          <label htmlFor="grade-order" className="sr-only">Sort submissions</label>
          <select
            id="grade-order"
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
            className={`${inputCls} w-auto`}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Student A to Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : loadError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">
          Couldn't load submissions: {loadError}
        </p>
      ) : submissions.length === 0 ? (
        <EmptyState icon={ClipboardCheck} message="No one has submitted this assignment yet." />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          message={
            needle
              ? `No submissions from a student matching "${needle}".`
              : filter === "ungraded"
                ? "Every submission is graded."
                : "No graded submissions yet."
          }
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((s) => (
            <GradeRow
              key={`${refId(s.student)}-${s.submittedAt}`}
              assignmentId={activeId!}
              submission={s}
              onSaved={handleSaved}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudioGrading;
