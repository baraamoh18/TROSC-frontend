import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** One sentence saying what's missing or how to unlock it. */
  message: string;
  icon?: LucideIcon;
  /** Optional single next step, such as a sign-in link. */
  action?: ReactNode;
  className?: string;
}

/** Neutral placeholder for sections with nothing to show yet. */
const EmptyState = ({ message, icon: Icon = Inbox, action, className = "" }: EmptyStateProps) => (
  <div
    role="status"
    className={`flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center ${className}`}
  >
    <Icon size={28} className="text-gray-400" aria-hidden="true" />
    <p className="max-w-md text-sm text-gray-600">{message}</p>
    {action}
  </div>
);

export default EmptyState;
