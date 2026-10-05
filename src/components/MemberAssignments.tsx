import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { AssignmentsResponse, BackendAssignment } from "../services/api";
import TrackAssignments from "./TrackDetails/TrackAssignments";

interface MemberAssignmentsProps {
  /** Reload when this changes, e.g. the course or session id. */
  loadKey: string;
  load: () => Promise<AssignmentsResponse>;
  /** Members can submit; everyone else only reads. */
  canSubmit: boolean;
  className?: string;
  /** Matches the page's other section headings. */
  headingClassName?: string;
}

/**
 * Assignments on a course or session page, for its members. Shows nothing
 * when there are none or the API refuses, so non-members see no empty box.
 */
const MemberAssignments = ({
  loadKey,
  load,
  canSubmit,
  className = "",
  headingClassName = "text-2xl font-extrabold text-primary-darker",
}: MemberAssignmentsProps) => {
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((res) => {
        if (!cancelled) {
          setAssignments([...res.data.assignments].sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)));
        }
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      });
    return () => {
      cancelled = true;
    };
    // `load` is rebuilt on every render; the key says when the data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  if (assignments.length === 0) return null;

  return (
    <section aria-labelledby={`assignments-${loadKey}`} className={`rounded-xl bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      <h2
        id={`assignments-${loadKey}`}
        className={`mb-4 flex items-center gap-2 ${headingClassName}`}
      >
        <ClipboardList className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        Assignments
      </h2>
      <TrackAssignments
        assignments={assignments}
        isEnrolled={canSubmit}
        hideHeading
        onSubmissionUpdate={(id, submission) =>
          setAssignments((prev) => prev.map((a) => (a._id === id ? { ...a, mySubmission: submission } : a)))
        }
      />
    </section>
  );
};

export default MemberAssignments;
