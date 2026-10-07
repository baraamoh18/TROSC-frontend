import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { SyllabusItem } from "../../services/api";
import { hostListLabel } from "../../utils/trustedHosts";
import { coverProblem } from "../../utils/contentFields";
import type { useLinkList } from "../../utils/contentFields";

// Fields shared by the admin forms (Tracks & courses, Events) and the
// instructors' course form. Each takes the input class of the form it sits in.

const hintCls = "mt-1 text-xs text-gray-600";
const errorCls = "mt-1 text-xs font-medium text-red-700";
const smallBtn =
  "inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export const CoverImageField = ({
  id,
  value,
  onChange,
  inputCls,
  labelCls,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
  labelCls: string;
}) => {
  const [broken, setBroken] = useState(false);
  const problem = coverProblem(value);
  const showPreview = !!value.trim() && !problem && !broken;
  return (
    <div>
      <label htmlFor={id} className={labelCls}>Cover image link (optional)</label>
      <input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://i.imgur.com/..."
        className={inputCls}
        value={value}
        onChange={(e) => {
          setBroken(false);
          onChange(e.target.value);
        }}
        aria-invalid={!!problem}
        aria-describedby={`${id}-hint`}
      />
      {problem ? (
        <p id={`${id}-hint`} className={errorCls}>{problem}</p>
      ) : (
        <p id={`${id}-hint`} className={hintCls}>
          A direct link to a wide image, about 1200 by 600 pixels. Leave it empty to use the default cover.
        </p>
      )}
      {showPreview && (
        <img
          src={value.trim()}
          alt="Cover preview"
          onError={() => setBroken(true)}
          className="mt-2 aspect-[2/1] w-full rounded-lg border border-gray-200 object-cover"
        />
      )}
      {broken && <p className={errorCls}>That link doesn't open as an image. Check it's a direct image link.</p>}
    </div>
  );
};

export const LinkListField = ({
  id,
  list,
  inputCls,
  labelCls,
  label = "Attachment links (optional)",
}: {
  id: string;
  list: ReturnType<typeof useLinkList>;
  inputCls: string;
  labelCls: string;
  label?: string;
}) => (
  <div>
    <label htmlFor={id} className={labelCls}>{label}</label>
    <textarea
      id={id}
      rows={3}
      placeholder={"One link per line, e.g.\nhttps://drive.google.com/..."}
      className={inputCls}
      value={list.text}
      onChange={(e) => list.setText(e.target.value)}
      aria-invalid={!!list.problem}
      aria-describedby={`${id}-hint`}
    />
    {list.problem && <p className={errorCls}>{list.problem}</p>}
    <p id={`${id}-hint`} className={hintCls}>
      Links must start with https:// and be on one of these hosts: {hostListLabel(list.hosts)}.
    </p>
  </div>
);

export const SyllabusEditor = ({
  items,
  onChange,
  inputCls,
  labelCls,
}: {
  items: SyllabusItem[];
  onChange: (items: SyllabusItem[]) => void;
  inputCls: string;
  labelCls: string;
}) => {
  const update = (i: number, patch: Partial<SyllabusItem>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, by: number) => {
    const next = [...items];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  return (
    <fieldset>
      <legend className={labelCls}>Syllabus (optional)</legend>
      <p className="mb-2 text-xs text-gray-600">The topics the course covers, in order.</p>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={item._id ?? `new-${i}`} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right text-xs font-bold text-gray-500">{i + 1}.</span>
              <div className="min-w-0 flex-1 space-y-2">
                <label htmlFor={`syl-title-${i}`} className="sr-only">Topic {i + 1} title</label>
                <input
                  id={`syl-title-${i}`}
                  placeholder="Topic, e.g. React hooks"
                  className={inputCls}
                  value={item.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                />
                <label htmlFor={`syl-desc-${i}`} className="sr-only">Topic {i + 1} description</label>
                <textarea
                  id={`syl-desc-${i}`}
                  rows={2}
                  placeholder="What it covers (optional)"
                  className={inputCls}
                  value={item.description ?? ""}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                className={`${smallBtn} text-gray-700 hover:bg-gray-100`}
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move topic ${i + 1} up`}
              >
                <ArrowUp size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${smallBtn} text-gray-700 hover:bg-gray-100`}
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label={`Move topic ${i + 1} down`}
              >
                <ArrowDown size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${smallBtn} text-red-700 hover:bg-red-50`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove topic ${i + 1}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={`${smallBtn} mt-2 text-primary hover:bg-primary-light`}
        onClick={() => onChange([...items, { title: "", description: "" }])}
      >
        <Plus size={14} aria-hidden="true" />
        Add topic
      </button>
    </fieldset>
  );
};
