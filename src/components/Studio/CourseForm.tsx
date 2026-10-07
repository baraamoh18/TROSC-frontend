import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendCourse, CoursePayload, SyllabusItem } from "../../services/api";
import Modal from "../Modal";
import { errorMessage, inputCls, labelCls, primaryBtn, secondaryBtn } from "./studioUi";
import { CoverImageField, LinkListField, SyllabusEditor } from "./ContentFields";
import { cleanSyllabus, coverProblem, realCover, useLinkList } from "../../utils/contentFields";

interface CourseFormProps {
  /** Omit to create a new standalone course. */
  course?: BackendCourse;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * A course an instructor runs on their own. Linking a course to a track is
 * the admin's call (Tracks & courses), so this form never sends `track`.
 */
const CourseForm = ({ course, onClose, onSaved }: CourseFormProps) => {
  const editing = !!course;
  const inTrack = !!course?.track;
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [level, setLevel] = useState<CoursePayload["level"]>(course?.level ?? "beginner");
  // Without a track, only public courses can be joined, so that's the default.
  const [access, setAccess] = useState<CoursePayload["access"]>(course?.access ?? "public");
  const [published, setPublished] = useState(course?.published ?? false);
  const [cover, setCover] = useState(realCover(course?.coverImage));
  const [duration, setDuration] = useState(course?.duration ? String(course.duration) : "");
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(course?.syllabus ?? []);
  const attachments = useLinkList(course?.attachments ?? []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Use at least 3 characters.";
    if (description.trim().length < 10) next.description = "Use at least 10 characters.";
    if (duration && (!Number.isFinite(Number(duration)) || Number(duration) <= 0)) {
      next.duration = "Enter the length in hours.";
    }
    if (coverProblem(cover)) next.cover = "Fix the cover image link.";
    if (attachments.problem) next.attachments = "Fix the attachment links.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: CoursePayload = {
      title: title.trim(),
      description: description.trim(),
      level,
      access,
      published,
      syllabus: cleanSyllabus(syllabus),
      attachments: attachments.links,
    };
    if (cover.trim()) payload.coverImage = cover.trim();
    if (duration) payload.duration = Number(duration);
    setSaving(true);
    try {
      if (editing) {
        await api.updateCourse(course._id, payload);
        toast.success("Course saved.");
      } else {
        await api.createCourse(payload);
        toast.success(published ? "Course created." : "Course saved as a draft.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the course."));
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`c-${key}-error`} className="mt-1 text-xs font-medium text-red-700">
        {errors[key]}
      </p>
    ) : null;

  const accessHint = inTrack
    ? "Track only: members of its track can join. Public: anyone signed in can join."
    : access === "public"
      ? "Listed on Explore once published. Anyone signed in can join."
      : access === "track-only"
        ? "This course isn't in a track, so nobody could join it. Choose Public, or ask an admin to add it to a track."
        : "Private: students can't find or join it on their own.";

  return (
    <Modal onClose={onClose} labelledBy="course-form-title" className="flex max-h-[90vh] max-w-xl flex-col">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col" noValidate>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="course-form-title" className="text-lg font-bold text-gray-900">
            {editing ? "Edit course" : "New course"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="c-title" className={labelCls}>Title</label>
            <input
              id="c-title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "c-title-error" : undefined}
              required
            />
            {fieldError("title")}
          </div>

          <div>
            <label htmlFor="c-desc" className={labelCls}>Description</label>
            <textarea
              id="c-desc"
              rows={3}
              className={inputCls}
              placeholder="What will students learn?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "c-description-error" : undefined}
            />
            {fieldError("description")}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-level" className={labelCls}>Level</label>
              <select
                id="c-level"
                className={inputCls}
                value={level}
                onChange={(e) => setLevel(e.target.value as CoursePayload["level"])}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-access" className={labelCls}>Who can join</label>
              <select
                id="c-access"
                className={inputCls}
                value={access}
                onChange={(e) => setAccess(e.target.value as CoursePayload["access"])}
                aria-describedby="c-access-hint"
              >
                <option value="public">Public</option>
                <option value="track-only">Track members only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          <p id="c-access-hint" className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
            {accessHint}
          </p>

          <div className="sm:w-1/2">
            <label htmlFor="c-duration" className={labelCls}>Length in hours (optional)</label>
            <input
              id="c-duration"
              type="number"
              min={1}
              inputMode="numeric"
              className={inputCls}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              aria-invalid={!!errors.duration}
              aria-describedby={errors.duration ? "c-duration-error" : undefined}
            />
            {fieldError("duration")}
          </div>

          <CoverImageField id="c-cover" value={cover} onChange={setCover} inputCls={inputCls} labelCls={labelCls} />

          <SyllabusEditor items={syllabus} onChange={setSyllabus} inputCls={inputCls} labelCls={labelCls} />

          <LinkListField id="c-attachments" list={attachments} inputCls={inputCls} labelCls={labelCls} />

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
            {editing ? "Save changes" : "Create course"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseForm;
