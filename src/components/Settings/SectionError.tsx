import { AlertCircle, RotateCw } from "lucide-react";

/** Shown instead of an empty state when a request failed, so a failed load
 *  isn't mistaken for "you have nothing here". */
const SectionError = ({ what, onRetry }: { what: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-light-active bg-white p-6 text-center text-neutral-dark">
    <p className="flex items-center gap-2">
      <AlertCircle size={18} className="text-primary" aria-hidden="true" />
      Couldn't load {what}.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-light-active px-4 py-1.5 text-sm font-semibold text-neutral-darker transition-colors hover:bg-neutral-light"
    >
      <RotateCw size={14} aria-hidden="true" />
      Retry
    </button>
  </div>
);

export default SectionError;
