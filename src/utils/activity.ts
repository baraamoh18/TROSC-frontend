import {
  Activity,
  ClipboardList,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

// Shared by Settings > Recent Activity and the Studio's activity log.

/** Icon for an activity-log action such as "created_course" or "login". */
export const activityIcon = (action: string): LucideIcon => {
  if (action === "logout") return LogOut;
  if (action.includes("login")) return LogIn;
  if (action === "signed_up") return UserPlus;
  if (action.includes("password")) return KeyRound;
  if (action.includes("enroll")) return UserCheck;
  if (action.includes("submit") || action.includes("graded")) return ClipboardList;
  if (action.includes("review")) return Star;
  if (action.includes("upload") || action.includes("photo")) return UploadCloud;
  if (action.startsWith("deleted") || action.startsWith("deactivated")) return Trash2;
  if (action.startsWith("created")) return Plus;
  if (action.startsWith("updated")) return Pencil;
  return Activity;
};

/** "created_course" → "Created course" */
export const actionLabel = (action: string): string => {
  const text = action.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export const formatRelative = (isoDate: string): string => {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
