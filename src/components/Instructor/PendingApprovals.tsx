import React from "react";
import { Check, X, Loader2, UserCircle } from "lucide-react";
import type { AuthUser } from "../../services/api";
import { isDefaultPhoto } from "../../utils/photoUtils";

interface PendingApprovalsProps {
  heading: string;
  people: AuthUser[];
  loading: boolean;
  /** Id of the row whose action is currently in flight. */
  busyId: string | null;
  approveLabel?: string;
  rejectLabel?: string;
  emptyMessage: string;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

/**
 * Table of users awaiting a decision (enrollment requests or leave
 * requests) with approve/reject actions.
 */
const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  heading,
  people,
  loading,
  busyId,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  emptyMessage,
  onApprove,
  onReject,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-light-active bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-darker">
        {heading}
        {!loading && people.length > 0 && (
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-primary-dark">
            {people.length}
          </span>
        )}
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-light-active p-6 text-center text-sm text-neutral-dark">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {people.map((person) => (
            <li
              key={person._id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                {!isDefaultPhoto(person.photo) ? (
                  <img loading="lazy"
                    src={person.photo}
                    alt={person.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle
                    size={40}
                    className="shrink-0 text-neutral"
                    strokeWidth={1}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-darker">
                    {person.name}
                  </p>
                  <p className="truncate text-sm text-neutral-dark">
                    {person.email}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 sm:ml-4">
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => onApprove(person._id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyId === person._id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  {approveLabel}
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => onReject(person._id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-dark px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={15} />
                  {rejectLabel}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingApprovals;
