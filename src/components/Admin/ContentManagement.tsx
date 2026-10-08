import React, { useCallback, useEffect, useId, useState } from "react";
import DateTimeField from "../DateTimeField";
import Combobox from "../Combobox";
import { fromLocalInput, toLocalInput } from "../Studio/studioUi";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  GitBranch,
  BookOpen,
  CalendarDays,
  X,
  AlertTriangle,
  Pencil,
  Megaphone,
  Pin,
} from "lucide-react";
import * as api from "../../services/api";
import SharedModal from "../Modal";
import useStaffUsers from "../../hooks/useStaffUsers";
import { CoverImageField, LinkListField, SyllabusEditor } from "../Studio/ContentFields";
import { cleanSyllabus, coverProblem, realCover, useLinkList } from "../../utils/contentFields";
import type {
  BackendTrack,
  BackendCourse,
  BackendEvent,
  BackendAnnouncement,
  AnnouncementPayload,
  TrackPayload,
  CoursePayload,
  EventPayload,
} from "../../services/api";

// ── shared helpers ────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectCls = inputCls + " cursor-pointer";

/** Inline confirm-delete row */
const DeleteButton: React.FC<{
  onConfirm: () => Promise<void>;
  disabled?: boolean;
}> = ({ onConfirm, disabled }) => {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  if (asking) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <AlertTriangle size={13} className="text-brand-dark" />
        <span className="font-semibold text-brand-dark">Delete?</span>
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className="rounded-lg bg-primary-dark px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAsking(false)}
          className="rounded-lg bg-surface px-3 py-1 text-xs font-bold text-neutral-dark border border-neutral-light-active"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setAsking(true)}
      className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-surface px-3 py-1.5 text-xs font-bold text-brand-dark transition-colors hover:bg-primary-light disabled:opacity-40"
    >
      <Trash2 size={12} />
      Delete
    </button>
  );
};

/** Simple edit trigger button */
const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-surface px-3 py-1.5 text-xs font-bold text-neutral-dark transition-colors hover:bg-neutral-light-active"
  >
    <Pencil size={12} />
    Edit
  </button>
);

// ── Section wrapper with collapse ─────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Plain card without the toggle, when the page heading already names it. */
  flat?: boolean;
}> = ({ icon, title, count, children, defaultOpen = false, flat = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (flat) {
    return <div className="rounded-xl border border-neutral-light-active bg-surface p-6 shadow-sm">{children}</div>;
  }
  return (
    <div className="rounded-xl border border-neutral-light-active bg-surface shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="flex items-center gap-3 font-bold text-neutral-darker">
          <span className="text-brand">{icon}</span>
          {title}
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-brand-dark">
            {count}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`text-neutral transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-neutral-light-active px-6 pb-6 pt-5">{children}</div>}
    </div>
  );
};

// ── Form modal overlay ────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => {
  const titleId = useId();
  return (
    <SharedModal onClose={onClose} labelledBy={titleId} className="max-h-[90vh] max-w-lg overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 id={titleId} className="text-lg font-bold text-neutral-darker">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-neutral hover:bg-neutral-light"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </SharedModal>
  );
};

// ── Tracks panel ──────────────────────────────────────────────

const fieldLabelCls = "mb-1 block text-sm font-semibold text-neutral-darker";

const TracksPanel: React.FC<{
  tracks: BackendTrack[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ tracks, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<BackendTrack | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TrackPayload>({
    title: "",
    description: "",
    level: "all",
    published: false,
  });
  // Instructors and admins the track can be assigned to (admin-only fields).
  const staff = useStaffUsers(showForm);
  // The lead can't also be a co-instructor; the API drops them from the list.
  const leadId = form.instructor ?? editingTrack?.instructor?._id;
  const coInstructors = (form.instructors ?? []).filter((id) => id !== leadId);
  const toggleCoInstructor = (id: string) =>
    setForm((f) => {
      const current = f.instructors ?? [];
      return { ...f, instructors: current.includes(id) ? current.filter((x) => x !== id) : [...current, id] };
    });

  const openCreate = () => {
    setEditingTrack(null);
    setForm({ title: "", description: "", level: "all", published: false, instructors: [], coverImage: "" });
    setShowForm(true);
  };

  const openEdit = (t: BackendTrack) => {
    setEditingTrack(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      level: (t.level as TrackPayload["level"]) ?? "all",
      published: t.published ?? false,
      instructor: t.instructor?._id,
      instructors: (t.instructors ?? []).map((u) => u._id),
      coverImage: realCover(t.coverImage),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (coverProblem(form.coverImage ?? "")) {
      toast.error("Fix the cover image link.");
      return;
    }
    setSaving(true);
    // instructors replaces the whole list, so always send it in full.
    const { coverImage, ...rest } = form;
    const payload: TrackPayload = {
      ...rest,
      instructors: coInstructors,
      ...(coverImage?.trim() ? { coverImage: coverImage.trim() } : {}),
    };
    try {
      if (editingTrack) {
        await api.updateTrack(editingTrack._id, payload);
        toast.success("Track updated!");
      } else {
        await api.createTrack(payload);
        toast.success("Track created!");
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    await api.deleteTrack(id);
    toast.success(`"${title}" deleted.`);
    onRefresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={15} /> Add Track
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-center text-sm text-neutral-dark py-4">No tracks yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {tracks.map((t) => (
            <li key={t._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-darker">{t.title}</p>
                <p className="text-xs text-neutral-dark capitalize">
                  {t.level} · {t.studentCount} students · {t.published ? "Published" : "Draft"}
                  {t.instructor?.name ? ` · ${t.instructor.name}` : ""}
                  {t.instructors?.length ? ` + ${t.instructors.map((u) => u.name).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EditButton onClick={() => openEdit(t)} />
                <DeleteButton onConfirm={() => handleDelete(t._id, t.title)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Modal
          title={editingTrack ? "Edit Track" : "New Track"}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="track-title" className="mb-1 block text-sm font-semibold text-neutral-darker">Title *</label>
              <input
                id="track-title"
                type="text"
                className={inputCls}
                placeholder="e.g. Full Stack Web Dev"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="track-desc" className="mb-1 block text-sm font-semibold text-neutral-darker">Description *</label>
              <textarea
                id="track-desc"
                rows={3}
                className="w-full rounded-lg border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What will students learn?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="track-level" className="mb-1 block text-sm font-semibold text-neutral-darker">Level</label>
              <select
                id="track-level"
                className={selectCls}
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as TrackPayload["level"] }))}
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="track-instructor" className="mb-1 block text-sm font-semibold text-neutral-darker">Instructor</label>
              <Combobox
                id="track-instructor"
                triggerClassName={selectCls}
                value={form.instructor ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, instructor: v || undefined }))}
                searchPlaceholder="Search people…"
                options={[
                  { value: "", label: editingTrack ? "Keep current instructor" : "Me (default)" },
                  ...staff.map((u) => ({ value: u._id, label: u.name, hint: u.role === "admin" ? "Admin" : "Instructor" })),
                ]}
              />
            </div>
            <CoverImageField
              id="track-cover"
              value={form.coverImage ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))}
              inputCls={inputCls}
              labelCls={fieldLabelCls}
            />
            <fieldset>
              <legend className="mb-1 block text-sm font-semibold text-neutral-darker">Co-instructors</legend>
              <p className="mb-2 text-xs text-neutral-dark">
                They can edit the track, handle join and leave requests, and manage its courses, sessions and grading.
                Only admins can delete a track.
              </p>
              {staff.length === 0 ? (
                <p className="text-xs text-neutral-dark">Loading instructors…</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-light-active p-2">
                  {staff
                    .filter((u) => u._id !== leadId)
                    .map((u) => (
                      <li key={u._id}>
                        <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded px-1 text-sm text-neutral-darker hover:bg-neutral-light">
                          <input
                            type="checkbox"
                            checked={coInstructors.includes(u._id)}
                            onChange={() => toggleCoInstructor(u._id)}
                            className="h-4 w-4 rounded accent-primary"
                          />
                          {u.name} · {u.role === "admin" ? "Admin" : "Instructor"}
                        </label>
                      </li>
                    ))}
                </ul>
              )}
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-darker cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary"
              />
              {editingTrack ? "Published" : "Publish immediately"}
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingTrack ? "Save Changes" : "Create Track"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Courses panel ─────────────────────────────────────────────

const CoursesPanel: React.FC<{
  tracks: BackendTrack[];
  courses: BackendCourse[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ tracks, courses, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<BackendCourse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CoursePayload>({
    title: "",
    description: "",
    level: "beginner",
    published: false,
    access: "track-only",
  });
  const staff = useStaffUsers(showForm);
  const [durationText, setDurationText] = useState("");
  const attachments = useLinkList();

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: "", description: "", level: "beginner", published: false, access: "track-only", coverImage: "", syllabus: [] });
    setDurationText("");
    attachments.setText("");
    setShowForm(true);
  };

  const openEdit = (c: BackendCourse) => {
    setEditingCourse(c);
    setForm({
      title: c.title,
      description: c.description ?? "",
      level: (c.level as CoursePayload["level"]) ?? "beginner",
      published: c.published ?? false,
      access: (c.access as CoursePayload["access"]) ?? "track-only",
      track: c.track ? (typeof c.track === "string" ? c.track : c.track._id) : undefined,
      instructor: c.instructor?._id,
      coverImage: realCover(c.coverImage),
      syllabus: c.syllabus ?? [],
    });
    setDurationText(c.duration ? String(c.duration) : "");
    attachments.setText((c.attachments ?? []).join("\n"));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (durationText && (!Number.isFinite(Number(durationText)) || Number(durationText) <= 0)) {
      toast.error("Enter the course length in hours.");
      return;
    }
    if (coverProblem(form.coverImage ?? "") || attachments.problem) {
      toast.error("Fix the highlighted links first.");
      return;
    }
    const { coverImage, syllabus, ...rest } = form;
    const payload: CoursePayload = {
      ...rest,
      syllabus: cleanSyllabus(syllabus ?? []),
      attachments: attachments.links,
      ...(coverImage?.trim() ? { coverImage: coverImage.trim() } : {}),
      ...(durationText ? { duration: Number(durationText) } : {}),
    };
    setSaving(true);
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse._id, payload);
        toast.success("Course updated!");
      } else {
        await api.createCourse(payload);
        toast.success("Course created!");
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    await api.deleteCourse(id);
    toast.success(`"${title}" deleted.`);
    onRefresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={15} /> Add Course
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-center text-sm text-neutral-dark py-4">No courses yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {courses.map((c) => (
            <li key={c._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-darker">{c.title}</p>
                <p className="text-xs text-neutral-dark">
                  <span className="capitalize">{c.level}</span> · {c.published ? "Published" : "Draft"} · {c.access} ·{" "}
                  {c.track ? c.track.title : "No track"}
                  {c.instructor?.name ? ` · ${c.instructor.name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EditButton onClick={() => openEdit(c)} />
                <DeleteButton onConfirm={() => handleDelete(c._id, c.title)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Modal
          title={editingCourse ? "Edit Course" : "New Course"}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Title *</label>
              <input id="course-title" type="text" className={inputCls} placeholder="Course title"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Description *</label>
              <textarea id="course-desc" rows={3}
                className="w-full rounded-lg border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What will students learn?"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Level</label>
                <select id="course-level" className={selectCls} value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as CoursePayload["level"] }))}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Access</label>
                <select id="course-access" className={selectCls} value={form.access}
                  onChange={(e) => setForm((f) => ({ ...f, access: e.target.value as CoursePayload["access"] }))}>
                  <option value="track-only">Track only</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="course-instructor" className="mb-1 block text-sm font-semibold text-neutral-darker">Instructor</label>
              <Combobox
                id="course-instructor"
                triggerClassName={selectCls}
                value={form.instructor ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, instructor: v || undefined }))}
                searchPlaceholder="Search people…"
                options={[
                  { value: "", label: editingCourse ? "Keep current instructor" : "Me (default)" },
                  ...staff.map((u) => ({ value: u._id, label: u.name, hint: u.role === "admin" ? "Admin" : "Instructor" })),
                ]}
              />
            </div>
            {tracks.length > 0 && (
              <div>
                <label htmlFor="course-track" className="mb-1 block text-sm font-semibold text-neutral-darker">Assign to Track (optional)</label>
                <Combobox
                  id="course-track"
                  triggerClassName={selectCls}
                  value={form.track ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, track: v || undefined }))}
                  searchPlaceholder="Search tracks…"
                  options={[{ value: "", label: "No track" }, ...tracks.map((t) => ({ value: t._id, label: t.title }))]}
                />
              </div>
            )}
            {!form.track && (
              <p className="rounded-lg bg-neutral-light px-3 py-2 text-xs text-neutral-dark">
                {form.access === "public"
                  ? "No track and public: this course is listed on Explore, and anyone signed in can enroll."
                  : form.access === "track-only"
                    ? "No track and track-only: nobody can enroll. Choose a track, or set access to Public."
                    : "No track and private: students can't find or enroll in this course on their own."}
              </p>
            )}
            <div className="sm:w-1/2">
              <label htmlFor="course-duration" className={fieldLabelCls}>Length in hours (optional)</label>
              <input id="course-duration" type="number" min={1} inputMode="numeric" className={inputCls}
                value={durationText} onChange={(e) => setDurationText(e.target.value)} />
            </div>
            <CoverImageField
              id="course-cover"
              value={form.coverImage ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))}
              inputCls={inputCls}
              labelCls={fieldLabelCls}
            />
            <SyllabusEditor
              items={form.syllabus ?? []}
              onChange={(items) => setForm((f) => ({ ...f, syllabus: items }))}
              inputCls={inputCls}
              labelCls={fieldLabelCls}
            />
            <LinkListField id="course-attachments" list={attachments} inputCls={inputCls} labelCls={fieldLabelCls} />
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-darker cursor-pointer">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary" />
              {editingCourse ? "Published" : "Publish immediately"}
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingCourse ? "Save Changes" : "Create Course"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Events panel ──────────────────────────────────────────────

const EventsPanel: React.FC<{
  events: BackendEvent[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ events, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BackendEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventPayload>({
    title: "",
    description: "",
    date: "",
    locationType: "online",
    locationLink: "",
    locationAddress: "",
  });
  const attachments = useLinkList();

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ title: "", description: "", date: "", locationType: "online", coverImage: "" });
    attachments.setText("");
    setShowForm(true);
  };

  const openEdit = (ev: BackendEvent) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      // Local time, not UTC: the field shows what the person will see
      date: toLocalInput(ev.date),
      locationType: ev.locationType ?? "online",
      locationLink: ev.locationLink ?? "",
      locationAddress: ev.locationAddress ?? "",
      coverImage: realCover(ev.coverImage),
    });
    attachments.setText((ev.attachments ?? []).join("\n"));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date) {
      toast.error("Title, description and date are required.");
      return;
    }
    if (coverProblem(form.coverImage ?? "") || attachments.problem) {
      toast.error("Fix the highlighted links first.");
      return;
    }
    setSaving(true);
    try {
      const { coverImage, ...rest } = form;
      const payload: EventPayload = {
        ...rest,
        // The field holds local time; send it as a real instant
        date: fromLocalInput(rest.date)!,
        locationLink: form.locationLink?.trim() || undefined,
        locationAddress: form.locationAddress?.trim() || undefined,
        attachments: attachments.links,
        ...(coverImage?.trim() ? { coverImage: coverImage.trim() } : {}),
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent._id, payload);
        toast.success("Event updated!");
      } else {
        await api.createEvent(payload);
        toast.success("Event created!");
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    await api.deleteEvent(id);
    toast.success(`"${title}" deleted.`);
    onRefresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={15} /> Add Event
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-neutral-dark py-4">No events yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {events.map((ev) => (
            <li key={ev._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-darker">{ev.title}</p>
                <p className="text-xs text-neutral-dark">
                  {new Date(ev.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {ev.locationType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EditButton onClick={() => openEdit(ev)} />
                <DeleteButton onConfirm={() => handleDelete(ev._id, ev.title)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Modal
          title={editingEvent ? "Edit Event" : "New Event"}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Title *</label>
              <input id="event-title" type="text" className={inputCls} placeholder="Event name"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Description *</label>
              <textarea id="event-desc" rows={2}
                className="w-full rounded-lg border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What's happening?"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Date & Time *</label>
                <DateTimeField id="event-date" fieldClassName={inputCls} value={form.date}
                  onChange={(date) => setForm((f) => ({ ...f, date }))} defaultTime="18:00" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Location type</label>
                <select id="event-location-type" className={selectCls} value={form.locationType}
                  onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value as "online" | "offline" }))}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            {form.locationType === "online" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Meeting Link</label>
                <input id="event-link" type="url" className={inputCls} placeholder="https://meet.google.com/…"
                  value={form.locationLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, locationLink: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Address</label>
                <input id="event-address" type="text" className={inputCls} placeholder="Venue address"
                  value={form.locationAddress ?? ""} onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))} />
              </div>
            )}
            <CoverImageField
              id="event-cover"
              value={form.coverImage ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))}
              inputCls={inputCls}
              labelCls={fieldLabelCls}
            />
            <LinkListField id="event-attachments" list={attachments} inputCls={inputCls} labelCls={fieldLabelCls} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingEvent ? "Save Changes" : "Create Event"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Announcements panel ───────────────────────────────────────

const EMPTY_ANNOUNCEMENT: AnnouncementPayload = {
  title: "",
  message: "",
  audience: "all",
  isPinned: false,
};

const AnnouncementsPanel: React.FC<{
  announcements: BackendAnnouncement[];
  tracks: BackendTrack[];
  courses: BackendCourse[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ announcements, tracks, courses, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BackendAnnouncement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AnnouncementPayload>(EMPTY_ANNOUNCEMENT);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_ANNOUNCEMENT);
    setShowForm(true);
  };

  const openEdit = (a: BackendAnnouncement) => {
    setEditing(a);
    setForm({
      title: a.title,
      message: a.message,
      audience: a.audience,
      targetTrack: a.targetTrack,
      targetCourse: a.targetCourse,
      isPinned: a.isPinned,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters.");
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters.");
      return;
    }
    if (form.audience === "track" && !form.targetTrack) {
      toast.error("Choose the track this announcement is for.");
      return;
    }
    if (form.audience === "course" && !form.targetCourse) {
      toast.error("Choose the course this announcement is for.");
      return;
    }
    // The API only accepts a target that matches the chosen audience.
    const payload: AnnouncementPayload = {
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      isPinned: !!form.isPinned,
      ...(form.audience === "track" ? { targetTrack: form.targetTrack } : {}),
      ...(form.audience === "course" ? { targetCourse: form.targetCourse } : {}),
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updateAnnouncement(editing._id, payload);
        toast.success("Announcement updated!");
      } else {
        await api.createAnnouncement(payload);
        toast.success("Announcement published!");
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    await api.deleteAnnouncement(id);
    toast.success(`"${title}" deleted.`);
    onRefresh();
  };

  const audienceLabel = (a: BackendAnnouncement) => {
    if (a.audience === "track") {
      return `Track: ${tracks.find((t) => t._id === a.targetTrack)?.title ?? "unknown"}`;
    }
    if (a.audience === "course") {
      return `Course: ${courses.find((c) => c._id === a.targetCourse)?.title ?? "unknown"}`;
    }
    return "Everyone";
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={15} /> Add Announcement
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-center text-sm text-neutral-dark py-4">No announcements yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {announcements.map((a) => (
            <li key={a._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-semibold text-neutral-darker">
                  {a.isPinned && <Pin size={13} className="shrink-0 text-brand" aria-label="Pinned" />}
                  {a.title}
                </p>
                <p className="text-xs text-neutral-dark">
                  {audienceLabel(a)} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EditButton onClick={() => openEdit(a)} />
                <DeleteButton onConfirm={() => handleDelete(a._id, a.title)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Modal
          title={editing ? "Edit Announcement" : "New Announcement"}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="announcement-title" className="mb-1 block text-sm font-semibold text-neutral-darker">Title *</label>
              <input id="announcement-title" type="text" className={inputCls} placeholder="e.g. New semester starts Sunday"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="announcement-message" className="mb-1 block text-sm font-semibold text-neutral-darker">Message *</label>
              <textarea id="announcement-message" rows={4}
                className="w-full rounded-lg border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="At least 10 characters"
                value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="announcement-audience" className="mb-1 block text-sm font-semibold text-neutral-darker">Audience</label>
              <select id="announcement-audience" className={selectCls} value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AnnouncementPayload["audience"] }))}>
                <option value="all">Everyone</option>
                <option value="track">A track</option>
                <option value="course">A course</option>
              </select>
            </div>
            {form.audience === "track" && (
              <div>
                <label htmlFor="announcement-track" className="mb-1 block text-sm font-semibold text-neutral-darker">Track *</label>
                <Combobox
                  id="announcement-track"
                  triggerClassName={selectCls}
                  value={form.targetTrack ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, targetTrack: v || undefined }))}
                  searchPlaceholder="Search tracks…"
                  options={[{ value: "", label: "Choose a track…" }, ...tracks.map((t) => ({ value: t._id, label: t.title }))]}
                />
              </div>
            )}
            {form.audience === "course" && (
              <div>
                <label htmlFor="announcement-course" className="mb-1 block text-sm font-semibold text-neutral-darker">Course *</label>
                <Combobox
                  id="announcement-course"
                  triggerClassName={selectCls}
                  value={form.targetCourse ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, targetCourse: v || undefined }))}
                  searchPlaceholder="Search courses…"
                  options={[{ value: "", label: "Choose a course…" }, ...courses.map((c) => ({ value: c._id, label: c.title }))]}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-darker cursor-pointer">
              <input type="checkbox" checked={!!form.isPinned}
                onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary" />
              Pin to the top
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editing ? "Save Changes" : "Publish"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Main export ───────────────────────────────────────────────

export type ContentPanel = "tracks" | "courses" | "events" | "announcements";

interface ContentManagementProps {
  tracks: BackendTrack[];
  tracksLoading: boolean;
  onRefreshTracks: () => void;
  /** Which panels to show; the Studio gives each group its own section. */
  panels?: ContentPanel[];
}

const ContentManagement: React.FC<ContentManagementProps> = ({
  tracks,
  tracksLoading,
  onRefreshTracks,
  panels = ["tracks", "courses", "announcements", "events"],
}) => {
  const show = (panel: ContentPanel) => panels.includes(panel);
  // Announcements can target a course, so they need the course list too.
  const needCourses = show("courses") || show("announcements");
  // ── Courses state ──────────────────────────────────────────
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await api.getCourses("limit=100&sort=-createdAt");
      setCourses(res.data?.courses ?? []);
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  // ── Events state ───────────────────────────────────────────
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await api.getEvents("limit=100&sort=-date");
      setEvents(res.data?.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // ── Announcements state ────────────────────────────────────
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await api.getAnnouncements("limit=100&sort=-createdAt");
      setAnnouncements(res.data?.announcements ?? []);
    } catch {
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  const showEvents = show("events");
  const showAnnouncements = show("announcements");
  useEffect(() => {
    if (needCourses) void fetchCourses();
    if (showEvents) void fetchEvents();
    if (showAnnouncements) void fetchAnnouncements();
  }, [needCourses, showEvents, showAnnouncements, fetchCourses, fetchEvents, fetchAnnouncements]);

  return (
    <div className="space-y-5">
      {show("tracks") && (
        <Section icon={<GitBranch size={18} />} title="Tracks" count={tracks.length} defaultOpen>
          <TracksPanel tracks={tracks} loading={tracksLoading} onRefresh={onRefreshTracks} />
        </Section>
      )}

      {show("courses") && (
        <Section icon={<BookOpen size={18} />} title="Courses" count={courses.length} defaultOpen>
          <CoursesPanel
            tracks={tracks}
            courses={courses}
            loading={coursesLoading}
            onRefresh={fetchCourses}
          />
        </Section>
      )}

      {showAnnouncements && (
        <Section icon={<Megaphone size={18} />} title="Announcements" count={announcements.length} flat={panels.length === 1}>
          <AnnouncementsPanel
            announcements={announcements}
            tracks={tracks}
            courses={courses}
            loading={announcementsLoading}
            onRefresh={fetchAnnouncements}
          />
        </Section>
      )}

      {showEvents && (
        <Section icon={<CalendarDays size={18} />} title="Events" count={events.length} flat={panels.length === 1}>
          <EventsPanel events={events} loading={eventsLoading} onRefresh={fetchEvents} />
        </Section>
      )}
    </div>
  );
};

export default ContentManagement;
