import { Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import MainLayoutNoFooter from "./layout/MainLayoutNoFooter";

import LandingPage from "./pages/landingPage";
import SignInPage from "./pages/signInPage";
import SignUpPage from "./pages/signUpPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import ContactUsPage from "./pages/contactUsPage";
import TrackDetailsPage from "./pages/TrackDetailsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";
import NotFoundPage from "./pages/NotFoundPage";
import useScrollToHash from "./hooks/useScrollToHash";
import ErrorBoundary from "./components/ErrorBoundary";
import { lazyWithReload as lazy } from "./utils/lazyWithReload";

// Signed-in and deep-link pages are split into their own chunks so first-time
// visitors to the landing page don't download the dashboards.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SessionViewerPage = lazy(() => import("./pages/SessionViewerPage"));
const CourseDetailsPage = lazy(() => import("./pages/CourseDetailsPage"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));

/** Old or guessed links: /tracks/:id → /track/:id */
const TracksRedirect = () => {
  const { trackId } = useParams<{ trackId: string }>();
  return <Navigate to={`/track/${trackId}`} replace />;
};

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center pt-16" aria-busy="true">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-light border-t-primary" />
  </div>
);

function App() {
  useScrollToHash();

  return (
    <ErrorBoundary>
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Pages with Navbar + Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/track/:trackId" element={<TrackDetailsPage />} />
        <Route path="/tracks/:trackId" element={<TracksRedirect />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
      </Route>

      {/* Pages with Navbar only (no Footer) */}
      <Route element={<MainLayoutNoFooter />}>
        <Route path="/contact" element={<ContactUsPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:sessionId"
          element={
            <ProtectedRoute>
              <SessionViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <StudioPage />
            </ProtectedRoute>
          }
        />
        {/* The Studio replaced the instructor dashboard. */}
        <Route path="/instructor" element={<Navigate to="/studio" replace />} />
        {/* The admin dashboard is now the Studio's Platform sections. */}
        <Route path="/admin" element={<Navigate to="/studio?section=overview" replace />} />
      </Route>

      <Route path="/signin" element={<RedirectIfAuthenticated><SignInPage /></RedirectIfAuthenticated>} />
      <Route path="/signup" element={<RedirectIfAuthenticated><SignUpPage /></RedirectIfAuthenticated>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Catch-all 404 */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

export default App;
