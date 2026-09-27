import { useCallback, useEffect, useState } from "react";
import { ListChecks, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { BackendCourse, WeeklyTask } from "../../services/api";
import EmptyState from "../EmptyState";
import ConfirmAction from "./ConfirmAction";
import WeeklyTaskForm from "./WeeklyTaskForm";
import { cardCls, errorMessage, inputCls, labelCls, ownerName, primaryBtn, smallBtn } from "./studioUi";
import type { CanManage } from "./studioUi";

const StudioWeeklyTasks = ({ courses: all, canManage }: { courses: BackendCourse[]; canManage: CanManage }) => {
  // Weekly tasks live on a course, and only its owner (or an admin) can change them.
  const courses = all.filter((c) => canManage(c.instructor));
  const [courseId, setCourseId] = useState(courses[0]?._id ?? "");
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<WeeklyTask | "new" | null>(null);
  const activeCourse = courses.some((c) => c._id === courseId) ? courseId : courses[0]?._id ?? "";

  const load = useCallback(async () => {
    if (!activeCourse) return;
    setLoading(true);
    try {
      const res = await api.getWeeklyTasksByCourse(activeCourse);
      setTasks([...res.data.weeklyTasks].sort((a, b) => a.week - b.week));
    } catch (err) {
      setTasks([]);
      toast.error(errorMessage(err, "Couldn't load weekly tasks."));
    } finally {
      setLoading(false);
    }
  }, [activeCourse]);

  useEffect(() => {
    load();
  }, [load]);

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        message={
          all.length > 0
            ? `Weekly tasks belong to a course, and you can only edit courses you own. This track's courses belong to ${ownerName(all[0].instructor)}.`
            : "Weekly tasks belong to a course. Add a course to this track first."
        }
      />
    );
  }

  const remove = async (id: string) => {
    try {
      await api.deleteWeeklyTask(id);
      toast.success("Week deleted.");
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete it."));
    }
  };

  const nextWeek = tasks.reduce((max, t) => Math.max(max, t.week), 0) + 1;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-sm">
          <label htmlFor="wt-course" className={labelCls}>Course</label>
          <select id="wt-course" className={inputCls} value={activeCourse} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>
        <button type="button" className={primaryBtn} onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden="true" />
          Add week
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} message="This course has no weekly tasks yet." />
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t._id} className={`${cardCls} p-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">
                    Week {t.week}: {t.title}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {t.items.map((i) => (
                      <li key={i._id} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 text-xs font-semibold capitalize text-gray-600">{i.type}</span>
                        {i.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={`${smallBtn} text-gray-800 hover:bg-gray-100`} onClick={() => setEditing(t)}>
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </button>
                  <ConfirmAction label="Delete" confirmLabel="Click to delete" onConfirm={() => remove(t._id)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <WeeklyTaskForm
          courseId={activeCourse}
          task={editing === "new" ? undefined : editing}
          nextWeek={nextWeek}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default StudioWeeklyTasks;
