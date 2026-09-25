import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getRedirectPath } from "../utils/redirect";

interface RedirectIfAuthenticatedProps {
  children: ReactNode;
}

/**
 * Wraps auth pages (sign in / sign up) so that already-authenticated
 * users are sent back to the page they came from (or the dashboard)
 * instead of seeing the form.
 * Renders nothing while the auth check is loading to avoid a flash.
 */
const RedirectIfAuthenticated = ({ children }: RedirectIfAuthenticatedProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user) {
    return <Navigate to={getRedirectPath(location.state, "/dashboard")} replace />;
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
