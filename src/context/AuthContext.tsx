import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import * as api from "../services/api";
import { ApiError } from "../services/api";
import { AuthContext } from "./authContextInstance";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<api.AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // A 401 on any non-credential request while signed in means the session
  // expired. Clear the user; ProtectedRoute then sends protected pages to
  // /signin (remembering where they were), and public pages fall back to
  // their signed-out view. Signed-out 401s (e.g. the initial getMe) are
  // expected and ignored.
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      if (!userRef.current) return;
      userRef.current = null;
      setUser(null);
      toast.error("Your session has expired. Please sign in again.", {
        id: "session-expired",
      });
    });
    return () => api.setUnauthorizedHandler(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      setUser(res.data.user);
    } catch (err) {
      // Not logged in (401) or network error — treat as signed out.
      if (!(err instanceof ApiError) || err.status !== 401) {
        // Non-auth errors are logged for visibility, but we still fall
        // back to a signed-out state so the UI doesn't hang.
        console.error("Failed to load current user:", err);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    // Clear the ref first so in-flight requests that 401 during sign-out
    // don't trigger the "session expired" toast.
    userRef.current = null;
    try {
      await api.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, refreshUser, logout }),
    [user, loading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
