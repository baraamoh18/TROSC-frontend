import { useState } from "react";
import { ClipboardCheck, FileText, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendAssignment, BackendCourse, BackendSession } from "../../services/api";
import EmptyState from "../EmptyState";
import AssignmentForm from "./AssignmentForm";
import ConfirmAction from "./ConfirmAction";
import { assignmentTarget, cardCls, errorMessage, formatDateTime, ownerName, primaryBtn, smallBtn } from "./studioUi";
import type { CanManage } from "./studioUi";

interface StudioAssignmentsProps {
  assignments: BackendAssignment[];
  courses: BackendCourse[];
  sessions: BackendSession[];
  canManage: CanManage;
  onChanged: () => void;
  onGrade: (assignmentId: string) => void;
}

const StudioAssignments = ({ assignments, courses, sessions, canManage, onChanged, onGrade }: StudioAssignmentsProps) => {
  const [editing, setEditing] = useState<BackendAssignment | "new" | null>(null);
  const sorted = [...assignments].sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
  // Assignments can only be added to courses and sessions the person manages.
  const ownCourses = courses.filter((c) => canManage(c.instructor));
  const ownSessions = sessions.filter((s) => canManage(s.instructor));
  const canCreate = ownCourses.length > 0 || ownSessions.length > 0;

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
          title={canCreate ? undefined : "Create a session first"}
        >
          <Plus size={16} aria-hidden="true" />
          New assignment
        </button>
      </div>

      {!canCreate && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Assignments belong to a course or a session. Create a session in this track first, then add assignments to it.
        </p>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={FileText} message="No assignments in this track yet." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((a) => {
            // The API sends these counts only to people who manage the assignment.
            const submitted = a.submissionCount;
            const ungraded = a.ungradedCount ?? 0;
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
                    {canManage(a.instructor) ? (
                      submitted !== undefined && (
                        <p className="mt-1 text-xs font-semibold text-gray-700">
                          {submitted} submission{submitted === 1 ? "" : "s"}
                          {ungraded > 0 && <span className="text-primary"> · {ungraded} to grade</span>}
                        </p>
                      )
                    ) : (
                      <p className="mt-1 text-xs text-gray-600">
                        Belongs to {ownerName(a.instructor)}. Only they, this track's instructors or an admin can grade or change it.
                      </p>
                    )}
                  </div>
                  {canManage(a.instructor) && (
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
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <AssignmentForm
          courses={ownCourses}
          sessions={ownSessions}
          assignment={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
};

export default StudioAssignments;
