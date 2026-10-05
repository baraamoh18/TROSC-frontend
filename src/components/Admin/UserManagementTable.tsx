import React, { useCallback, useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import {
  UserCircle,
  Shield,
  GraduationCap,
  User,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  UserCog,
  X,
} from "lucide-react";
import * as api from "../../services/api";
import Modal from "../Modal";
import { isDefaultPhoto } from "../../utils/photoUtils";
import type { AuthUser } from "../../services/api";

const RoleBadge: React.FC<{ role: AuthUser["role"] }> = ({ role }) => {
  const map: Record<AuthUser["role"], { label: string; cls: string; icon: React.ReactNode }> = {
    admin: {
      label: "Admin",
      cls: "bg-red-100 text-red-700",
      icon: <Shield size={11} />,
    },
    instructor: {
      label: "Instructor",
      cls: "bg-amber-100 text-amber-700",
      icon: <GraduationCap size={11} />,
    },
    student: {
      label: "Student",
      cls: "bg-sky-100 text-sky-700",
      icon: <User size={11} />,
    },
  };
  const { label, cls, icon } = map[role] ?? map.student;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
};

/** Two-step button: the first click arms it, a second within 4 s confirms. */
const ConfirmButton: React.FC<{
  label: string;
  confirmLabel: string;
  icon: React.ReactNode;
  disabled: boolean;
  busy: boolean;
  danger?: boolean;
  onConfirm: () => void;
}> = ({ label, confirmLabel, icon, disabled, busy, danger, onConfirm }) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        armed && danger
          ? "border-primary-dark bg-primary-dark text-white"
          : armed
            ? "border-neutral-darker bg-neutral-darker text-white"
            : "border-neutral-light-active bg-white text-neutral-dark hover:bg-neutral-light"
      }`}
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : icon}
      {armed ? confirmLabel : label}
    </button>
  );
};

type ChangeableRole = "student" | "instructor";

const ROLE_INFO: Record<ChangeableRole, { label: string; detail: string }> = {
  student: {
    label: "Student",
    detail: "Joins tracks, courses and sessions, and submits assignments.",
  },
  instructor: {
    label: "Instructor",
    detail:
      "Opens the Studio, creates their own courses and sessions, and grades their work. An admin can also add them to a track as lead or co-instructor.",
  },
};

/** Picks a new role and saves only on an explicit confirm. */
const RoleDialog: React.FC<{
  user: AuthUser;
  onClose: () => void;
  onConfirm: (role: ChangeableRole) => Promise<void>;
}> = ({ user, onClose, onConfirm }) => {
  const titleId = useId();
  const current = user.role as ChangeableRole;
  const [role, setRole] = useState<ChangeableRole>(current === "student" ? "instructor" : "student");
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm(role);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={() => !saving && onClose()} labelledBy={titleId} className="max-w-md p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 id={titleId} className="text-lg font-bold text-neutral-darker">Change role</h3>
          <p className="mt-0.5 text-sm text-neutral-dark">
            {user.name} is {current === "instructor" ? "an instructor" : "a student"} now.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-neutral hover:bg-neutral-light">
          <X size={18} />
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">New role</legend>
        {(Object.keys(ROLE_INFO) as ChangeableRole[]).map((r) => (
          <label
            key={r}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
              role === r ? "border-primary bg-primary-light/40" : "border-neutral-light-active"
            }`}
          >
            <input
              type="radio"
              name="new-role"
              value={r}
              checked={role === r}
              onChange={() => setRole(r)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block font-semibold text-neutral-darker">
                {ROLE_INFO[r].label}
                {r === current && <span className="font-normal text-neutral-dark"> (current)</span>}
              </span>
              <span className="text-neutral-dark">
                {ROLE_INFO[r].detail}
                {r === "student" && current === "instructor" &&
                  " They lose the Studio and anything they managed as an instructor."}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-neutral-light-active px-4 py-2 text-sm font-bold text-neutral-dark hover:bg-neutral-light"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving || role === current}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {role === current ? "No change" : `Make ${user.name} ${role === "instructor" ? "an instructor" : "a student"}`}
        </button>
      </div>
    </Modal>
  );
};

const PAGE_SIZE = 15;

type StatusFilter = "active" | "inactive";

const UserManagementTable: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleTarget, setRoleTarget] = useState<AuthUser | null>(null);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
        sort: "-createdAt",
      });
      if (query) params.set("search", query);
      if (status === "inactive") params.set("active", "false");
      const res = await api.getAllUsers(params.toString());
      setUsers(res.data?.users ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error("Couldn't load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSetActive = async (userId: string, name: string, active: boolean) => {
    setBusyId(userId);
    try {
      await api.updateUserAdmin(userId, { active });
      toast.success(active ? `${name} was reactivated.` : `${name} was deactivated.`);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (userId: string, name: string, role: ChangeableRole) => {
    setBusyId(userId);
    try {
      await api.updateUserAdmin(userId, { role });
      toast.success(`${name} is now ${role === "instructor" ? "an instructor" : "a student"}.`);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role change failed.");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral"
          />
          <input
            id="user-search"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-light-active bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <label htmlFor="user-status" className="sr-only">Show</label>
        <select
          id="user-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="shrink-0 rounded-lg border border-neutral-light-active bg-white px-3 py-2.5 text-sm font-semibold text-neutral-darker focus:border-primary focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <span className="hidden shrink-0 text-sm text-neutral-dark sm:inline">
          {total} user{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-light-active bg-white p-10 text-center text-sm text-neutral-dark">
          {query
            ? `No ${status === "inactive" ? "deactivated " : ""}users match "${query}".`
            : status === "inactive"
              ? "No deactivated users."
              : "No users found."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-light-active bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-light-active bg-neutral-light">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-dark">User</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-neutral-dark sm:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-neutral-dark sm:table-cell">Role</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-dark">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="transition-colors hover:bg-neutral-light/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {!isDefaultPhoto(user.photo) ? (
                        <img loading="lazy"
                          src={user.photo}
                          alt={user.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle size={36} className="shrink-0 text-neutral" strokeWidth={1} />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-neutral-darker">{user.name}</span>
                        {/* Email column is hidden on phones; show it here instead. */}
                        <p className="truncate text-xs text-neutral-dark sm:hidden">{user.email}</p>
                        {/* Role column is hidden on phones too. */}
                        <div className="mt-1 sm:hidden">
                          <RoleBadge role={user.role} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-dark sm:table-cell">
                    {user.email}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                    {status === "inactive" ? (
                      <ConfirmButton
                        label="Reactivate"
                        confirmLabel="Confirm reactivate"
                        icon={<UserCheck size={12} />}
                        disabled={busyId !== null}
                        busy={busyId === user._id}
                        onConfirm={() => handleSetActive(user._id, user.name, true)}
                      />
                    ) : (
                    <>
                    {user.role !== "admin" && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => setRoleTarget(user)}
                        aria-label={`Change role for ${user.name}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-light-active bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === user._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <UserCog size={12} />
                        )}
                        Change role
                      </button>
                    )}
                    {user.role !== "admin" && user._id !== currentUserId && (
                      <ConfirmButton
                        label="Deactivate"
                        confirmLabel="Confirm deactivate"
                        icon={<UserX size={12} />}
                        danger
                        disabled={busyId !== null}
                        busy={false}
                        onConfirm={() => handleSetActive(user._id, user.name, false)}
                      />
                    )}
                    {user.role === "admin" && (
                      <span className="text-xs text-neutral-dark">No actions</span>
                    )}
                    </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {roleTarget && (
        <RoleDialog
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onConfirm={(role) => handleChangeRole(roleTarget._id, roleTarget.name, role)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-dark">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-white px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-light-active bg-white px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
