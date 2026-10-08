import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { WeeklyTask, WeeklyTaskItem, WeeklyTaskPayload } from "../../services/api";
import Modal from "../Modal";
import { errorMessage, inputCls, labelCls, primaryBtn, secondaryBtn, smallBtn } from "./studioUi";

interface WeeklyTaskFormProps {
  courseId: string;
  /** Omit to add a new week. */
  task?: WeeklyTask;
  /** Suggested week number for a new task. */
  nextWeek: number;
  onClose: () => void;
  onSaved: () => void;
}

type Item = WeeklyTaskPayload["items"][number] & { key: string };

const TYPES: WeeklyTaskItem["type"][] = ["reading", "video", "quiz", "assignment", "other"];

let keySeed = 0;
const newKey = () => `new-${++keySeed}`;

const WeeklyTaskForm = ({ courseId, task, nextWeek, onClose, onSaved }: WeeklyTaskFormProps) => {
  const editing = !!task;
  const [week, setWeek] = useState(String(task?.week ?? nextWeek));
  const [title, setTitle] = useState(task?.title ?? "");
  // Existing items keep their _id so students' ticks survive the edit.
  const [items, setItems] = useState<Item[]>(
    task?.items.map((i) => ({ _id: i._id, title: i.title, type: i.type, key: i._id })) ?? [
      { title: "", type: "reading", key: newKey() },
    ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [it] = next.splice(index, 1);
      next.splice(index + delta, 0, it);
      return next;
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(week);
    const filled = items.filter((i) => i.title.trim());
    if (!Number.isInteger(n) || n < 1) return setError("Week must be a whole number, 1 or more.");
    if (!title.trim()) return setError("Give this week a title.");
    if (filled.length === 0) return setError("Add at least one item.");
    setError("");

    const payload: WeeklyTaskPayload = {
      week: n,
      title: title.trim(),
      items: filled.map(({ _id, title: t, type }) => ({ ...(_id ? { _id } : {}), title: t.trim(), type })),
    };
    setSaving(true);
    try {
      if (editing) await api.updateWeeklyTask(task._id, payload);
      else await api.createWeeklyTask(courseId, payload);
      toast.success(editing ? "Week saved." : "Week added.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save this week."));
    } finally {
      setSaving(false);
    }
  };

  const removedExisting = (task?.items.length ?? 0) - items.filter((i) => i._id).length;

  return (
    <Modal onClose={onClose} labelledBy="week-form-title" className="flex max-h-[90vh] max-w-2xl flex-col">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col" noValidate>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="week-form-title" className="text-lg font-bold text-gray-900">
            {editing ? `Edit week ${task.week}` : "Add a week"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[100px_1fr]">
            <div>
              <label htmlFor="w-week" className={labelCls}>Week</label>
              <input id="w-week" type="number" min={1} className={inputCls} value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>
            <div>
              <label htmlFor="w-title" className={labelCls}>Title</label>
              <input
                id="w-title"
                placeholder="e.g. React basics"
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>Checklist items</legend>
            <ol className="space-y-2">
              {items.map((item, index) => (
                <li key={item.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2">
                  <span className="w-6 text-center text-xs font-bold text-gray-600" aria-hidden="true">
                    {index + 1}
                  </span>
                  <label htmlFor={`item-${item.key}`} className="sr-only">Item {index + 1}</label>
                  <input
                    id={`item-${item.key}`}
                    placeholder="What should students do?"
                    className={`${inputCls} min-w-0 flex-1 basis-48`}
                    value={item.title}
                    onChange={(e) => update(item.key, { title: e.target.value })}
                  />
                  <label htmlFor={`type-${item.key}`} className="sr-only">Item {index + 1} type</label>
                  <select
                    id={`type-${item.key}`}
                    className={`${inputCls} w-32 capitalize`}
                    value={item.type}
                    onChange={(e) => update(item.key, { type: e.target.value as WeeklyTaskItem["type"] })}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="flex">
                    <button
                      type="button"
                      className={`${smallBtn} text-gray-700 hover:bg-gray-100`}
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move item ${index + 1} up`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${smallBtn} text-gray-700 hover:bg-gray-100`}
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move item ${index + 1} down`}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${smallBtn} text-danger-ink hover:bg-danger-soft`}
                      onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { title: "", type: "reading", key: newKey() }])}
              className={`${smallBtn} mt-2 text-brand hover:bg-primary-light`}
            >
              <Plus size={14} />
              Add item
            </button>
            {removedExisting > 0 && (
              <p className="mt-2 text-xs text-warning-ink">
                Removing an item also removes students' ticks for it.
              </p>
            )}
          </fieldset>

          {error && (
            <p role="alert" className="text-sm font-medium text-danger-ink">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryBtn} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {editing ? "Save week" : "Add week"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WeeklyTaskForm;
