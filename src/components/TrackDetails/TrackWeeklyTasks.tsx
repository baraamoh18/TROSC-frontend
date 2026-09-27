import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  BookOpen,
  HelpCircle,
  Video,
  ClipboardList,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { WeeklyTask, WeeklyTaskItem } from "../../services/api";
import EmptyState from "../EmptyState";

// ── Item type icon ────────────────────────────────────────────

const ItemTypeIcon = ({ type }: { type: WeeklyTaskItem["type"] }) => {
  const cls = "w-4 h-4 shrink-0";
  switch (type) {
    case "reading":      return <BookOpen className={cls} />;
    case "quiz":         return <HelpCircle className={cls} />;
    case "video":        return <Video className={cls} />;
    case "assignment":   return <ClipboardList className={cls} />;
    default:             return <MoreHorizontal className={cls} />;
  }
};

// ── Single task item row ──────────────────────────────────────

const TaskItemRow = ({
  item,
  taskId,
  onToggle,
}: {
  item: WeeklyTaskItem;
  taskId: string;
  onToggle: (itemId: string, done: boolean) => void;
}) => {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (item.done) {
        await api.uncompleteWeeklyTaskItem(taskId, item._id);
      } else {
        await api.completeWeeklyTaskItem(taskId, item._id);
      }
      onToggle(item._id, !item.done);
    } catch {
      toast.error("Failed to update task. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={toggling}
      aria-pressed={item.done}
      className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-gray-100 disabled:opacity-60"
    >
      <span className="shrink-0" aria-hidden="true">
        {toggling ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : item.done ? (
          <CheckSquare className="w-5 h-5 text-primary" />
        ) : (
          <Square className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
        )}
      </span>

      <span className={`text-gray-500 ${item.done ? "opacity-50" : ""}`} aria-hidden="true">
        <ItemTypeIcon type={item.type} />
      </span>
      <span
        className={`flex-1 min-w-0 text-sm leading-snug transition-colors ${
          item.done ? "line-through text-gray-500" : "text-gray-800"
        }`}
      >
        {item.title}
      </span>
      <span className="ml-auto shrink-0 text-xs capitalize text-gray-500 hidden sm:block">
        {item.type}
      </span>
    </button>
  );
};

// ── Weekly task bucket (collapsible) ─────────────────────────

const TaskBucket = ({ task }: { task: WeeklyTask }) => {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<WeeklyTaskItem[]>(task.items);

  const handleToggle = (itemId: string, done: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, done } : it)),
    );
  };

  const doneCount = items.filter((it) => it.done).length;
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-200/60 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Week {task.week}
            </span>
            <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {doneCount}/{total}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>

      {/* Items */}
      {open && total > 0 && (
        <div className="px-4 pb-3 divide-y divide-gray-200">
          {items.map((item) => (
            <TaskItemRow
              key={item._id}
              item={item}
              taskId={task._id}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {open && total === 0 && (
        <p className="px-4 pb-4 text-sm text-gray-500">No items yet.</p>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────

interface TrackWeeklyTasksProps {
  tasks: WeeklyTask[];
}

const TrackWeeklyTasks: React.FC<TrackWeeklyTasksProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold text-primary-darker">Weekly tasks</h2>
        <EmptyState icon={ClipboardList} message="No weekly tasks have been added to this track yet." />
      </div>
    );
  }

  // Sort by week number
  const sorted = [...tasks].sort((a, b) => a.week - b.week);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-primary-darker">Weekly tasks</h2>
      <div className="space-y-4 max-w-3xl">
        {sorted.map((task) => (
          <TaskBucket key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TrackWeeklyTasks;
