import { Suspense, lazy, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  /** Id of the date button, for the field's <label htmlFor>. */
  id: string;
  /** Local date-time as "YYYY-MM-DDTHH:mm" (what datetime-local used), or "". */
  value: string;
  onChange: (value: string) => void;
  /** The form's own input classes, so the field matches its neighbours. */
  fieldClassName: string;
  invalid?: boolean;
  describedBy?: string;
  /** Time used when a date is picked before any time is set. */
  defaultTime?: string;
}

// The calendar (react-day-picker, ~24 KB) downloads the first time a
// picker opens, not with every page that has a form.
const Calendar = lazy(() => import("@/components/ui/calendar").then((m) => ({ default: m.Calendar })));

const pad = (n: number) => String(n).padStart(2, "0");
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Date and time picker that looks the same in every browser, replacing
 * <input type="datetime-local">. The date comes from a calendar popover;
 * the time stays a native time field (phones show their own wheel).
 */
const DateTimeField = ({ id, value, onChange, fieldClassName, invalid, describedBy, defaultTime = "09:00" }: Props) => {
  const [open, setOpen] = useState(false);
  const [datePart = "", timePart = ""] = value ? value.split("T") : [];
  const [y, m, d] = datePart.split("-").map(Number);
  const selected = datePart ? new Date(y, m - 1, d) : undefined;

  const label = selected
    ? selected.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Pick a date";

  return (
    <div>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(fieldClassName, "flex min-w-0 flex-1 items-center gap-2 text-left", !selected && "text-neutral")}
          >
            <CalendarDays size={16} className="shrink-0 text-neutral-dark" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto rounded-xl border-border p-0 shadow-lg">
            <Suspense fallback={<div className="h-[22rem] w-[19.5rem]" aria-busy="true" />}>
              <Calendar
                mode="single"
                selected={selected}
                defaultMonth={selected}
                onSelect={(day) => {
                  if (!day) return;
                  onChange(`${toDateKey(day)}T${timePart || defaultTime}`);
                  setOpen(false);
                }}
                className="[--cell-size:--spacing(10)]"
                autoFocus
              />
            </Suspense>
          </PopoverContent>
        </Popover>
        <input
          type="time"
          aria-label="Time"
          className={cn(fieldClassName, "w-32 shrink-0")}
          value={timePart}
          disabled={!datePart}
          onChange={(e) => onChange(`${datePart}T${e.target.value || defaultTime}`)}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1 min-h-8 text-xs font-semibold text-neutral-dark hover:text-brand"
        >
          Clear date
        </button>
      )}
    </div>
  );
};

export default DateTimeField;
