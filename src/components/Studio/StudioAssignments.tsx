import { useState } from "react";
import { ClipboardCheck, FileText, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, BackendCourse, BackendSession } from "../../services/api";
import EmptyState from "../EmptyState";
import AssignmentForm from "./AssignmentForm";
import ConfirmAction from "./ConfirmAction";
import { assignmentTarget, cardCls, errorMessage, formatDateTime, primaryBtn, smallBtn } from "./studioUi";

interface StudioAssignmentsProps {
  assignments: BackendAssignment[];
  courses: BackendCourse[];
  sessions: BackendSession[];
  onChanged: () => void;
  onGrade: (assignmentId: string) => void;
}

const StudioAssignments = ({ assignments, courses, sessions, onChanged, onGrade }: StudioAssignmentsProps) => {
  const [editing, setEditing] = useState<BackendAssignment | "new" | null>(null);
  const sorted = [...assignments].sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
  const canCreate = courses.length > 0 || sessions.length > 0;

  const remove = async (id: string) => {
    try {
      await api.deleteAssignment(id);
      toast.success("Assignment deleted.");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete it."));
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {assignments.length} assignment{assignments.length === 1 ? "" : "s"} in this track
        </p>
        <button
          type="button"
          className={primaryBtn}
          onClick={() => setEditing("new")}
          disabled={!canCreate}
          title={canCreate ? undefined : "Add a course or session first"}
        >
          <Plus size={16} aria-hidden="true" />
          New assignment
        </button>
      </div>

      {!canCreate && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Assignments belong to a course or a session. Add one to this track first.
        </p>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={FileText} message="No assignments in this track yet." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((a) => {
            const submitted = a.submissions?.length ?? 0;
            const ungraded = a.submissions?.filter((s) => s.grade == null).length ?? 0;
            const past = Date.parse(a.deadline) < Date.now();
            return (
              <li key={a._id} className={`${cardCls} p-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{a.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {[assignmentTarget(a, courses, sessions), `${past ? "Closed" : "Due"} ${formatDateTime(a.deadline)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {submitted} submission{submitted === 1 ? "" : "s"}
                      {ungraded > 0 && <span className="text-primary"> · {ungraded} to grade</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <button type="button" className={`${smallBtn} text-primary hover:bg-primary-light`} onClick={() => onGrade(a._id)}>
                      <ClipboardCheck size={13} aria-hidden="true" />
                      Grade
                    </button>
                    <button type="button" className={`${smallBtn} text-gray-800 hover:bg-gray-100`} onClick={() => setEditing(a)}>
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </button>
                    <ConfirmAction label="Delete" confirmLabel="Click to delete" onConfirm={() => remove(a._id)} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <AssignmentForm
          courses={courses}
          sessions={sessions}
          assignment={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
};

export default StudioAssignments;
