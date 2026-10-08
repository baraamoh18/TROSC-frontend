import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { SyllabusItem } from "../../services/api";
import { hostListLabel } from "../../utils/trustedHosts";
import { coverProblem } from "../../utils/contentFields";
import { ACCEPTED_TYPES, deleteUploadedImage, prepareImage, uploadImage } from "../../utils/imageUpload";
import type { useLinkList } from "../../utils/contentFields";

// Fields shared by the admin forms (Tracks & courses, Events) and the
// instructors' course form. Each takes the input class of the form it sits in.

const hintCls = "mt-1 text-xs text-gray-600";
const errorCls = "mt-1 text-xs font-medium text-danger-ink";
const smallBtn =
  "inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Cover image: choose or drop a file (shrunk in the browser, then uploaded
 * to Cloudinary) or paste a link. The value stays a plain image URL, so the
 * API and the forms are unchanged.
 */
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [broken, setBroken] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  // Token for the image uploaded in this form, so Replace/Remove can tidy it up
  const [deleteToken, setDeleteToken] = useState<string | undefined>();

  const trimmed = value.trim();
  const problem = coverProblem(value);
  const uploading = progress !== null;

  const set = (url: string) => {
    setBroken(false);
    onChange(url);
  };

  const discardUploaded = () => {
    deleteUploadedImage(deleteToken);
    setDeleteToken(undefined);
  };

  const handleFile = async (file?: File) => {
    if (!file || uploading) return;
    setUploadError(null);
    setProgress(0);
    try {
      const blob = await prepareImage(file);
      const uploaded = await uploadImage(blob, setProgress);
      discardUploaded();
      setDeleteToken(uploaded.deleteToken);
      setLinkMode(false);
      set(uploaded.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fileInput = (
    <input
      ref={fileRef}
      id={`${id}-file`}
      type="file"
      accept={ACCEPTED_TYPES.join(",")}
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  return (
    <div>
      <p id={`${id}-label`} className={labelCls}>Cover image (optional)</p>
      {fileInput}

      {trimmed && !problem && !broken && !linkMode ? (
        // A cover is set: preview with Replace and Remove
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <img
            src={trimmed}
            alt="Cover preview"
            onError={() => setBroken(true)}
            className={`aspect-[2/1] w-full object-cover ${uploading ? "opacity-40" : ""}`}
          />
          <div className="absolute right-2 bottom-2 flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-black/65 px-3 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Replace
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                discardUploaded();
                set("");
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-black/65 px-3 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50"
            >
              <Trash2 size={14} aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : linkMode || trimmed ? (
        // Pasting a link, or an existing link that has a problem
        <input
          id={id}
          type="url"
          inputMode="url"
          placeholder="https://i.imgur.com/..."
          className={inputCls}
          value={value}
          onChange={(e) => set(e.target.value)}
          aria-labelledby={`${id}-label`}
          aria-invalid={!!problem}
          aria-describedby={`${id}-hint`}
          autoFocus
        />
      ) : (
        // Empty: a drop zone that is also the "choose a file" button
        <button
          id={id}
          type="button"
          aria-labelledby={`${id}-label ${id}-drop`}
          aria-describedby={`${id}-hint`}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex aspect-[2/1] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            dragging ? "border-primary bg-primary-light" : "border-gray-300 bg-neutral-light hover:border-primary"
          }`}
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-brand" aria-hidden="true" />
          ) : (
            <ImagePlus size={24} className="text-brand" aria-hidden="true" />
          )}
          <span id={`${id}-drop`} className="text-sm font-bold text-neutral-darker">
            {uploading ? "Uploading…" : dragging ? "Drop the image here" : "Choose an image or drag it here"}
          </span>
          <span className="text-xs text-neutral-dark">JPG, PNG or WebP. Wide images work best (2:1).</span>
        </button>
      )}

      {linkMode && trimmed && !problem && !broken && (
        <img
          src={trimmed}
          alt="Cover preview"
          onError={() => setBroken(true)}
          className="mt-2 aspect-[2/1] w-full rounded-lg border border-gray-200 object-cover"
        />
      )}

      {uploading && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-label="Upload progress" aria-valuenow={Math.round((progress ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
        </div>
      )}

      {uploadError ? (
        <p role="alert" className={errorCls}>{uploadError}</p>
      ) : problem ? (
        <p id={`${id}-hint`} className={errorCls}>{problem}</p>
      ) : broken ? (
        <p id={`${id}-hint`} className={errorCls}>That link doesn't open as an image. Check it's a direct image link.</p>
      ) : (
        <p id={`${id}-hint`} className={hintCls}>Leave it empty to use the default cover.</p>
      )}

      {(!trimmed || linkMode) && (
        <button
          type="button"
          onClick={() => setLinkMode((on) => !on)}
          className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-neutral-dark hover:text-brand"
        >
          <Link2 size={13} aria-hidden="true" />
          {linkMode ? "Upload a file instead" : "Paste a link instead"}
        </button>
      )}
      {(problem || broken) && (
        <button
          type="button"
          onClick={() => {
            set("");
            setLinkMode(false);
          }}
          className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-neutral-dark hover:text-brand"
        >
          <Trash2 size={13} aria-hidden="true" />
          Clear and upload a file instead
        </button>
      )}
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
                className={`${smallBtn} text-danger-ink hover:bg-danger-soft`}
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
        className={`${smallBtn} mt-2 text-brand hover:bg-primary-light`}
        onClick={() => onChange([...items, { title: "", description: "" }])}
      >
        <Plus size={14} aria-hidden="true" />
        Add topic
      </button>
    </fieldset>
  );
};
