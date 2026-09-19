import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import * as api from "../../services/api";
import type {
  BackendTrack,
  BackendCourse,
  BackendEvent,
  TrackPayload,
  CoursePayload,
  EventPayload,
} from "../../services/api";

// ── shared helpers ────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

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
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  if (asking) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <AlertTriangle size={13} className="text-primary-dark" />
        <span className="font-semibold text-primary-dark">Delete?</span>
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className="rounded-full bg-primary-dark px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAsking(false)}
          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-dark border border-neutral-light-active"
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
      className="inline-flex items-center gap-1 rounded-full border border-neutral-light-active bg-white px-3 py-1.5 text-xs font-bold text-primary-dark transition-colors hover:bg-primary-light disabled:opacity-40"
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
    className="inline-flex items-center gap-1 rounded-full border border-neutral-light-active bg-white px-3 py-1.5 text-xs font-bold text-neutral-dark transition-colors hover:bg-neutral-light-active"
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
}> = ({ icon, title, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-neutral-light-active bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="flex items-center gap-3 font-bold text-neutral-darker">
          <span className="text-primary">{icon}</span>
          {title}
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-primary-dark">
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
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-neutral-darker">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-neutral hover:bg-neutral-light"
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Tracks panel ──────────────────────────────────────────────

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

  const openCreate = () => {
    setEditingTrack(null);
    setForm({ title: "", description: "", level: "all", published: false });
    setShowForm(true);
  };

  const openEdit = (t: BackendTrack) => {
    setEditingTrack(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      level: (t.level as TrackPayload["level"]) ?? "all",
      published: t.published ?? false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingTrack) {
        await api.updateTrack(editingTrack._id, form);
        toast.success("Track updated!");
      } else {
        await api.createTrack(form);
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
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
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
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Title *</label>
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
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Description *</label>
              <textarea
                id="track-desc"
                rows={3}
                className="w-full rounded-xl border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What will students learn?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-darker">Level</label>
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
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-darker cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary"
              />
              Publish immediately
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingTrack ? "Save Changes" : "Create Track"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light"
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

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: "", description: "", level: "beginner", published: false, access: "track-only" });
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
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse._id, form);
        toast.success("Course updated!");
      } else {
        await api.createCourse(form);
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
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
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
                <p className="text-xs text-neutral-dark capitalize">
                  {c.level} · {c.published ? "Published" : "Draft"} · {c.access}
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
                className="w-full rounded-xl border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
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
            {tracks.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Assign to Track (optional)</label>
                <select id="course-track" className={selectCls} value={form.track ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, track: e.target.value || undefined }))}>
                  <option value="">No track</option>
                  {tracks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-darker cursor-pointer">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary" />
              Publish immediately
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingCourse ? "Save Changes" : "Create Course"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light">
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

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ title: "", description: "", date: "", locationType: "online" });
    setShowForm(true);
  };

  const openEdit = (ev: BackendEvent) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "",
      locationType: ev.locationType ?? "online",
      locationLink: ev.locationLink ?? "",
      locationAddress: ev.locationAddress ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date) {
      toast.error("Title, description and date are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        locationLink: form.locationLink?.trim() || undefined,
        locationAddress: form.locationAddress?.trim() || undefined,
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
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
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
                className="w-full rounded-xl border border-neutral-light-active bg-neutral-light px-4 py-2.5 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What's happening?"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-darker">Date & Time *</label>
                <input id="event-date" type="datetime-local" className={inputCls}
                  value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
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
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : editingEvent ? "Save Changes" : "Create Event"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full border border-neutral-light-active px-5 py-2.5 text-sm font-bold text-neutral-dark hover:bg-neutral-light">
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

interface ContentManagementProps {
  tracks: BackendTrack[];
  tracksLoading: boolean;
  onRefreshTracks: () => void;
}

const ContentManagement: React.FC<ContentManagementProps> = ({
  tracks,
  tracksLoading,
  onRefreshTracks,
}) => {
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

  useEffect(() => {
    void fetchCourses();
    void fetchEvents();
  }, [fetchCourses, fetchEvents]);

  return (
    <div className="space-y-5">
      <Section
        icon={<GitBranch size={18} />}
        title="Tracks"
        count={tracks.length}
        defaultOpen
      >
        <TracksPanel tracks={tracks} loading={tracksLoading} onRefresh={onRefreshTracks} />
      </Section>

      <Section icon={<BookOpen size={18} />} title="Courses" count={courses.length}>
        <CoursesPanel
          tracks={tracks}
          courses={courses}
          loading={coursesLoading}
          onRefresh={fetchCourses}
        />
      </Section>

      <Section icon={<CalendarDays size={18} />} title="Events" count={events.length}>
        <EventsPanel
          events={events}
          loading={eventsLoading}
          onRefresh={fetchEvents}
        />
      </Section>
    </div>
  );
};

export default ContentManagement;
