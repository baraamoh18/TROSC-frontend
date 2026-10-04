import { useEffect, useState } from "react";
import * as api from "../services/api";
import type { AuthUser } from "../services/api";

/**
 * Instructors and admins, for the admin-only instructor pickers. Loads once
 * `enabled` turns true; GET /users is admin only.
 */
export default function useStaffUsers(enabled: boolean): AuthUser[] {
  const [staff, setStaff] = useState<AuthUser[]>([]);
  const loaded = staff.length > 0;
  useEffect(() => {
    if (!enabled || loaded) return;
    let active = true;
    Promise.all([
      api.getAllUsers("role=instructor&limit=100&sort=name"),
      api.getAllUsers("role=admin&limit=100&sort=name"),
    ])
      .then(([i, a]) => {
        if (active) setStaff([...(i.data?.users ?? []), ...(a.data?.users ?? [])]);
      })
      .catch(() => {
        if (active) setStaff([]);
      });
    return () => {
      active = false;
    };
  }, [enabled, loaded]);
  return staff;
}
