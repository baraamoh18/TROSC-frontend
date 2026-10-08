import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { AssignmentPayload, BackendAssignment, BackendCourse, BackendSession } from "../../services/api";
import Modal from "../Modal";
import { hostListLabel, linkProblem, useTrustedHosts } from "../../utils/trustedHosts";
import { errorMessage, fromLocalInput, inputCls, labelCls, primaryBtn, secondaryBtn, toLocalInput } from "./studioUi";

interface AssignmentFormProps {
  courses: BackendCourse[];
  sessions: BackendSession[];
  /** Omit to create a new assignment. */
  assignment?: BackendAssignment;
  onClose: () => void;
  onSaved: () => void;
}

const AssignmentForm = ({ courses, sessions, assignment, onClose, onSaved }: AssignmentFormProps) => {
  const editing = !!assignment;
  const hosts = useTrustedHosts();
  // "course:<id>" or "session:<id>"; fixed once the assignment exists.
  const [target, setTarget] = useState(courses[0] ? `course:${courses[0]._id}` : sessions[0] ? `session:${sessions[0]._id}` : "");
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [description, setDescription] = useState(assignment?.description ?? "");
  const [deadline, setDeadline] = useState(toLocalInput(assignment?.deadline));
  const [attachments, setAttachments] = useState((assignment?.attachments ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const links = attachments
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!editing && !target) next.target = "Add a course or session to this track first.";
    if (title.trim().length < 3) next.title = "Use at least 3 characters.";
    if (description.trim().length < 10) next.description = "Use at least 10 characters.";
    if (!deadline) next.deadline = "Choose a deadline.";
    const badLink = links.map((l) => linkProblem(l, hosts)).find(Boolean);
    if (badLink) next.attachments = badLink;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: AssignmentPayload = {
      title: title.trim(),
      description: description.trim(),
      deadline: fromLocalInput(deadline)!,
      attachments: links,
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updateAssignment(assignment._id, payload);
        toast.success("Assignment saved.");
      } else {
        const [kind, id] = target.split(":");
        await api.createAssignment(kind === "course" ? { course: id } : { session: id }, payload);
        toast.success("Assignment created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the assignment."));
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`a-${key}-error`} className="mt-1 text-xs font-medium text-danger-ink">
        {errors[key]}
      </p>
    ) : null;
  const describedBy = (key: string) => (errors[key] ? `a-${key}-error` : undefined);

  return (
    <Modal onClose={onClose} labelledBy="assignment-form-title" className="flex max-h-[90vh] max-w-xl flex-col">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col" noValidate>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="assignment-form-title" className="text-lg font-bold text-gray-900">
            {editing ? "Edit assignment" : "New assignment"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {!editing && (
            <div>
              <label htmlFor="a-target" className={labelCls}>Belongs to</label>
              <select
                id="a-target"
                className={inputCls}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                aria-invalid={!!errors.target}
                aria-describedby={describedBy("target")}
              >
                {courses.length > 0 && (
                  <optgroup label="Courses">
                    {courses.map((c) => (
                      <option key={c._id} value={`course:${c._id}`}>{c.title}</option>
                    ))}
                  </optgroup>
                )}
                {sessions.length > 0 && (
                  <optgroup label="Sessions">
                    {sessions.map((s) => (
                      <option key={s._id} value={`session:${s._id}`}>{s.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-600">This can't be changed after the assignment is created.</p>
              {fieldError("target")}
            </div>
          )}

          <div>
            <label htmlFor="a-title" className={labelCls}>Title</label>
            <input
              id="a-title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={describedBy("title")}
            />
            {fieldError("title")}
          </div>

          <div>
            <label htmlFor="a-desc" className={labelCls}>Instructions</label>
            <textarea
              id="a-desc"
              rows={5}
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
              aria-describedby={describedBy("description")}
            />
            {fieldError("description")}
          </div>

          <div>
            <label htmlFor="a-deadline" className={labelCls}>Deadline</label>
            <input
              id="a-deadline"
              type="datetime-local"
              className={inputCls}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={!!errors.deadline}
              aria-describedby={describedBy("deadline")}
            />
            {fieldError("deadline")}
          </div>

          <div>
            <label htmlFor="a-attachments" className={labelCls}>Attachment links (optional)</label>
            <textarea
              id="a-attachments"
              rows={3}
              placeholder={"One link per line, e.g.\nhttps://drive.google.com/..."}
              className={inputCls}
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              aria-invalid={!!errors.attachments}
              aria-describedby={[describedBy("attachments"), "a-hosts"].filter(Boolean).join(" ")}
            />
            {fieldError("attachments")}
            <p id="a-hosts" className="mt-1 text-xs text-gray-600">
              Links must start with https:// and be on one of these hosts: {hostListLabel(hosts)}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryBtn} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {editing ? "Save changes" : "Create assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentForm;
