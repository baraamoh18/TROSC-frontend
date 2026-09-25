import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface RedirectIfAuthenticatedProps {
  children: ReactNode;
}

/**
 * Wraps auth pages (sign in / sign up) so that already-authenticated
 * users are sent straight to the dashboard instead of seeing the form.
 * Renders nothing while the auth check is loading to avoid a flash.
 */
const RedirectIfAuthenticated = ({ children }: RedirectIfAuthenticatedProps) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
