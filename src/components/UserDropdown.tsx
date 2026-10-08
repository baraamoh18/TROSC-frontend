import { Link } from "react-router-dom";
import { ChevronDown, GraduationCap, LayoutDashboard, LayoutGrid, LogOut, Settings, Shield, UserRound } from "lucide-react";
import type { AuthUser } from "../services/api";
import { isDefaultPhoto } from "../utils/photoUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABEL: Record<AuthUser["role"], string> = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

/**
 * The navbar's signed-in menu. Opens on click, tap or keyboard (Enter,
 * Space, arrow keys) and closes on Escape or outside click; focus
 * handling comes from Radix via shadcn/ui. Holds the Studio (staff) or
 * the dashboard (students), Settings and Log out.
 */
const UserDropdown = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const firstName = user.name.trim().split(/\s+/)[0];
  const isStaff = user.role === "admin" || user.role === "instructor";
  // Placeholder photos (placehold.co etc.) get the role icon instead.
  const showPhoto = !!user.photo && !isDefaultPhoto(user.photo);
  const RoleIcon = user.role === "admin" ? Shield : user.role === "instructor" ? GraduationCap : UserRound;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-light-active bg-surface pr-2.5 pl-1 text-sm font-semibold text-neutral-darker transition-colors hover:bg-neutral-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:bg-neutral-light">
        {showPhoto ? (
          <img className="size-8 rounded-md object-cover" src={user.photo} alt="" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-white" aria-hidden="true">
            <RoleIcon size={16} strokeWidth={2.5} />
          </span>
        )}
        <span className="max-w-32 truncate">{firstName}</span>
        <ChevronDown
          size={16}
          className="text-neutral-dark transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5 shadow-lg">
        <DropdownMenuLabel className="px-2.5 py-2 font-normal">
          <span className="block truncate text-sm font-bold text-neutral-darker">{user.name}</span>
          <span className="block truncate text-xs text-neutral-dark">{user.email}</span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
            <RoleIcon size={12} aria-hidden="true" />
            {ROLE_LABEL[user.role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-2.5 font-semibold">
          <Link to={isStaff ? "/studio" : "/dashboard"}>
            {isStaff ? <LayoutGrid /> : <LayoutDashboard />}
            {isStaff ? "Studio" : "My dashboard"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-2.5 font-semibold">
          <Link to="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-2.5 font-semibold"
          onSelect={onLogout}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
