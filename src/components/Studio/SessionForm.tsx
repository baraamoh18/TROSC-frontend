import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendCourse, BackendSession, SessionPayload } from "../../services/api";
import Modal from "../Modal";
import { useAuth } from "../../context/useAuth";
import useStaffUsers from "../../hooks/useStaffUsers";
import { hostListLabel, linkProblem, useTrustedHosts } from "../../utils/trustedHosts";
import {
  errorMessage,
  fromLocalInput,
  inputCls,
  labelCls,
  primaryBtn,
  refId,
  secondaryBtn,
  smallBtn,
  toLocalInput,
} from "./studioUi";

interface SessionFormProps {
  trackId: string;
  courses: BackendCourse[];
  /** Omit to create a new session. */
  session?: BackendSession;
  onClose: () => void;
  onSaved: () => void;
}

const SessionForm = ({ trackId, courses, session, onClose, onSaved }: SessionFormProps) => {
  const editing = !!session;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const staff = useStaffUsers(isAdmin);
  const hosts = useTrustedHosts();
  // Admin only: who runs the session. Empty keeps the current one (or the creator).
  const [instructorId, setInstructorId] = useState(refId(session?.instructor) ?? "");
  const [title, setTitle] = useState(session?.title ?? "");
  const [description, setDescription] = useState(session?.description ?? "");
  const [url, setUrl] = useState(session?.url ?? "");
  const [level, setLevel] = useState<SessionPayload["level"]>(session?.level ?? "beginner");
  const [access, setAccess] = useState<SessionPayload["access"]>(session?.access ?? "track-only");
  const [duration, setDuration] = useState(session?.duration ? String(session.duration) : "");
  const [startDate, setStartDate] = useState(toLocalInput(session?.startDate));
  const [published, setPublished] = useState(session?.published ?? true);
  const [courseId, setCourseId] = useState(session?.course ?? "");
  // New sessions only: skip the track and make it public, so it's listed under Open sessions.
  const [openSession, setOpenSession] = useState(false);
  const [resources, setResources] = useState<{ title: string; url: string }[]>(session?.resources ?? []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Use at least 3 characters.";
    const urlProblem = url.trim() ? linkProblem(url.trim(), hosts) : null;
    if (urlProblem) next.url = urlProblem;
    if (duration && (!Number.isFinite(Number(duration)) || Number(duration) <= 0)) {
      next.duration = "Enter the length in minutes.";
    }
    resources.forEach((r, i) => {
      const problem = r.url.trim() ? linkProblem(r.url.trim(), hosts) : "Add the link to this material.";
      if (problem) next[`res-${i}`] = problem;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: SessionPayload = {
      title: title.trim(),
      description: description.trim(),
      level,
      access: openSession ? "public" : access,
      published,
      resources: resources.map((r, i) => ({ title: r.title.trim() || `Material ${i + 1}`, url: r.url.trim() })),
    };
    if (url.trim()) payload.url = url.trim();
    if (isAdmin && instructorId) payload.instructor = instructorId;
    if (duration) payload.duration = Number(duration);
    // The API validates startDate as a date, so leave it out rather than send null.
    const start = fromLocalInput(startDate);
    if (start) payload.startDate = start;

    setSaving(true);
    // An open session never joins a course.
    const targetCourse = openSession ? "" : courseId;
    try {
      if (editing) {
        await api.updateSession(session._id, payload);
        const oldCourse = session.course ?? "";
        if (oldCourse !== targetCourse) {
          if (oldCourse) await api.detachSessionFromCourse(oldCourse, session._id);
          if (targetCourse) await api.attachSessionToCourse(targetCourse, session._id);
        }
        toast.success("Session saved.");
      } else {
        const res = await api.createSession(payload);
        const newId = res.data?.session?._id;
        if (!newId) throw new Error("The session was created, but the server didn't return its id.");
        if (openSession) {
          toast.success(published ? "Open session created. It's listed on Explore." : "Open session saved as a draft.");
          onSaved();
          onClose();
          return;
        }
        // Creating and linking are separate requests; say which part failed.
        try {
          await api.attachSessionToTrack(trackId, newId);
          if (targetCourse) await api.attachSessionToCourse(targetCourse, newId);
          toast.success("Session created and added to the track.");
        } catch (err) {
          toast.error(
            `Session created, but it couldn't be added to the track: ${errorMessage(err, "unknown error")}. It's listed under "Not in a track".`,
          );
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the session."));
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1 text-xs font-medium text-red-700">
        {errors[key]}
      </p>
    ) : null;

  return (
    <Modal onClose={onClose} labelledBy="session-form-title" className="flex max-h-[90vh] max-w-2xl flex-col">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col" noValidate>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="session-form-title" className="text-lg font-bold text-gray-900">
            {editing ? "Edit session" : "New session"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="s-title" className={labelCls}>Title</label>
            <input
              id="s-title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              required
            />
            {fieldError("title")}
          </div>

          <div>
            <label htmlFor="s-desc" className={labelCls}>Description</label>
            <textarea
              id="s-desc"
              rows={3}
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="s-url" className={labelCls}>Video or meeting link</label>
            <input
              id="s-url"
              type="url"
              inputMode="url"
              placeholder="https://youtube.com/watch?v=..."
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? "url-error s-hosts" : "s-hosts"}
            />
            {fieldError("url")}
            <p id="s-hosts" className="mt-1 text-xs text-gray-600">
              Links must start with https:// and be on one of these hosts: {hostListLabel(hosts)}.
            </p>
          </div>

          {isAdmin && (
            <div>
              <label htmlFor="s-instructor" className={labelCls}>Instructor</label>
              <select
                id="s-instructor"
                className={inputCls}
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
              >
                <option value="">{editing ? "Keep current instructor" : "Me (default)"}</option>
                {staff.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} · {u.role === "admin" ? "Admin" : "Instructor"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!editing && (
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={openSession}
                onChange={(e) => setOpenSession(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block font-semibold text-gray-900">Open session</span>
                <span className="text-gray-600">
                  Not part of this track or a course. Anyone signed in can find it on Explore and join it.
                </span>
              </span>
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-start" className={labelCls}>Date and time</label>
              <input
                id="s-start"
                type="datetime-local"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="s-duration" className={labelCls}>Length (minutes)</label>
              <input
                id="s-duration"
                type="number"
                min={1}
                className={inputCls}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-invalid={!!errors.duration}
                aria-describedby={errors.duration ? "duration-error" : undefined}
              />
              {fieldError("duration")}
            </div>
            <div>
              <label htmlFor="s-level" className={labelCls}>Level</label>
              <select
                id="s-level"
                className={inputCls}
                value={level}
                onChange={(e) => setLevel(e.target.value as SessionPayload["level"])}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="s-access" className={labelCls}>Access</label>
              <select
                id="s-access"
                className={inputCls}
                disabled={openSession}
                value={openSession ? "public" : access}
                onChange={(e) => setAccess(e.target.value as SessionPayload["access"])}
              >
                <option value="track-only">Track members only</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-course" className={labelCls}>Course (optional)</label>
              <select
                id="s-course"
                className={inputCls}
                disabled={openSession}
                value={openSession ? "" : courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Not part of a course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>Materials</legend>
            <p className="mb-2 text-xs text-gray-600">
              The same link rules apply: https:// on one of the hosts listed above.
            </p>
            <div className="space-y-3">
              {resources.map((r, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <label htmlFor={`res-title-${i}`} className="sr-only">Material {i + 1} name</label>
                    <input
                      id={`res-title-${i}`}
                      placeholder="Name, e.g. Slides"
                      className={inputCls}
                      value={r.title}
                      onChange={(e) =>
                        setResources((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="flex-[2]">
                    <label htmlFor={`res-url-${i}`} className="sr-only">Material {i + 1} link</label>
                    <input
                      id={`res-url-${i}`}
                      type="url"
                      placeholder="https://..."
                      className={inputCls}
                      value={r.url}
                      onChange={(e) =>
                        setResources((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                      }
                      aria-invalid={!!errors[`res-${i}`]}
                      aria-describedby={errors[`res-${i}`] ? `res-${i}-error` : undefined}
                    />
                    {fieldError(`res-${i}`)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setResources((prev) => prev.filter((_, j) => j !== i))}
                    className={`${smallBtn} self-end text-red-700 hover:bg-red-50 sm:self-center`}
                    aria-label={`Remove material ${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setResources((prev) => [...prev, { title: "", url: "" }])}
                className={`${smallBtn} text-primary hover:bg-primary-light`}
              >
                <Plus size={14} />
                Add material
              </button>
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Published (visible to students)
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryBtn} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {editing ? "Save changes" : "Create session"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionForm;
