import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import * as api from "../../services/api";
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

const PAGE_SIZE = 15;

const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (pg = 1) => {
    setLoading(true);
    try {
      const q = `limit=${PAGE_SIZE}&page=${pg}&sort=-createdAt`;
      const res = await api.getAllUsers(q);
      setUsers(res.data?.users ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error("Couldn't load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers(page);
  }, [page]);

  const handlePromoteToInstructor = async (userId: string, name: string) => {
    setBusyId(userId);
    try {
      await api.updateUserAdmin(userId, { role: "instructor" });
      toast.success(`${name} is now an instructor.`);
      await fetchUsers(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Promotion failed.");
    } finally {
      setBusyId(null);
    }
  };

  // Client-side name/email filter
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

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
            className="w-full rounded-full border border-neutral-light-active bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-darker placeholder:text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="shrink-0 text-sm text-neutral-dark">
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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-light-active bg-white p-10 text-center text-sm text-neutral-dark">
          No users found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-light-active bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-light-active bg-neutral-light">
                <th className="px-4 py-3 text-left font-semibold text-neutral-dark">User</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-neutral-dark sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-dark">Role</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-dark">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user._id} className="transition-colors hover:bg-neutral-light/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.photo ? (
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle size={36} className="shrink-0 text-neutral" strokeWidth={1} />
                      )}
                      <span className="font-semibold text-neutral-darker">{user.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-dark sm:table-cell">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role === "student" && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => handlePromoteToInstructor(user._id, user.name)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === user._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <GraduationCap size={12} />
                        )}
                        Make Instructor
                      </button>
                    )}
                    {(user.role === "instructor" || user.role === "admin") && (
                      <span className="text-xs text-neutral">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              className="inline-flex items-center gap-1 rounded-full border border-neutral-light-active bg-white px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-light-active bg-white px-3 py-1.5 font-semibold text-neutral-dark transition-colors hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-40"
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
