// ============================================================
// API service layer
// Dev: Vite proxy forwards /v1/* to DEV_API_TARGET (see vite.config.ts).
//      `npm run dev` → local backend on http://localhost:5000
//      `npm run dev:prod-api` → deployed backend (production data!)
// Prod: requests go to /v1 and Vercel rewrites them to the backend
//       (vercel.json), or set VITE_API_URL=https://your-api.com
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL)}/v1`
  : "/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ── Session-expiry hook ──────────────────────────────────────
// AuthProvider registers a handler that runs when a request comes back 401,
// i.e. the auth cookie is missing or expired. These endpoints are excluded
// because their 401s mean "wrong credentials", not "session expired".
const CREDENTIAL_ENDPOINTS = [
  "/users/login",
  "/users/signup",
  "/users/logout",
  "/users/forgotPassword",
  "/users/resetPassword/",
  "/users/updateMyPassword",
];

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function notifyIfUnauthorized(status: number, path: string): void {
  if (
    status === 401 &&
    !CREDENTIAL_ENDPOINTS.some((endpoint) => path.startsWith(endpoint))
  ) {
    unauthorizedHandler?.();
  }
}

async function request<T = void>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    notifyIfUnauthorized(res.status, path);
    const json = await res.json().catch(() => ({}));
    throw new ApiError(
      (json as { message?: string }).message ??
        `Request failed (${res.status})`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Shared sub-types ─────────────────────────────────────────

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
}

// ── Domain types ─────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  enrolledTrack?: string | null;
  pendingTrack?: string | null;
  enrolledCourses?: string[];
  enrolledSessions?: string[];
  photo?: string;
  bio?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  emailVerified?: boolean;
  active?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: { user: AuthUser };
}

export interface BackendTrack {
  _id: string;
  title: string;
  description: string;
  instructor: PopulatedUser;
  courses: string[];
  sessions: string[];
  students: string[];
  pendingStudents: string[];
  pendingLeaves: string[];
  level: "beginner" | "intermediate" | "advanced" | "all";
  coverImage: string;
  published: boolean;
  studentCount: number;
  courseCount: number;
  sessionCount: number;
  contentCount: { courses: number; sessions: number; total: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendSession {
  _id: string;
  title: string;
  description?: string;
  /** Primary content link (YouTube, Drive, Zoom, etc.) */
  url?: string;
  /** Auto-generated YouTube embed or Google Drive preview URL — use in <iframe> */
  embedUrl?: string;
  instructor: PopulatedUser;
  students?: string[];
  /** Some endpoints return populated track docs, others bare ids */
  tracks?: Array<string | { _id: string }>;
  course?: string;
  /** Controls who can access this session */
  access: "public" | "track-only" | "private";
  isStandalone?: boolean;
  duration?: number; // minutes
  level: "beginner" | "intermediate" | "advanced";
  coverImage: string;
  /** GET /sessions/:id omits this field entirely when empty — always guard */
  resources?: { title: string; url: string }[];
  published: boolean;
  startDate?: string;
  endDate?: string;
  /** Present only for an enrolled requester. The server remains authoritative. */
  myProgress?: {
    status: "not_started" | "watched";
    watchedAt?: string | null;
  };
  /** GET /sessions/track/:id returns raw progress entries instead of myProgress. */
  progress?: { student: string; status: "not_started" | "watched"; watchedAt?: string | null }[];
  createdAt?: string;
  updatedAt?: string;
}

/** Public, deliberately media-free session data for visitors. */
export interface SessionCatalogItem {
  _id: string;
  title: string;
  description?: string;
  startDate?: string;
  duration?: number;
  instructor?: { _id: string; name: string };
}

export interface SyllabusItem {
  _id?: string;
  title: string;
  description?: string;
}

export interface BackendCourse {
  _id: string;
  title: string;
  description: string;
  track?: { _id: string; title: string; description: string };
  instructor: PopulatedUser;
  students?: string[];
  sessions?: string[];
  level: "beginner" | "intermediate" | "advanced";
  coverImage: string;
  published: boolean;
  /** Controls who can access this course */
  access: "public" | "track-only" | "private";
  /** Trusted-host URLs (Drive, GitHub, Cloudinary, etc.) */
  attachments?: string[];
  /** Prerequisite course ObjectIds */
  prerequisites?: string[];
  /** Estimated total duration in hours */
  duration?: number;
  syllabus?: SyllabusItem[];
  /** Virtual — number of enrolled students */
  studentCount?: number;
  /** Virtual — number of linked sessions */
  sessionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendEvent {
  _id: string;
  title: string;
  description: string;
  track?: string;
  course?: string;
  date: string;
  locationType: "online" | "offline";
  locationLink?: string;
  locationAddress?: string;
  /** Computed CTA field — { type, url, label } */
  locationAction?: { type: "online" | "offline"; url: string; label: string };
  coverImage?: string;
  /** Trusted-host attachment URLs */
  attachments?: string[];
  attendees: string[];
  createdBy: { _id: string; name: string; role: string; photo?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendAnnouncement {
  _id: string;
  title: string;
  message: string;
  /** "all" | "track" | "course" — who the announcement targets */
  audience: "all" | "track" | "course";
  targetTrack?: string;
  targetCourse?: string;
  attachments: string[];
  /** Populated on list/detail responses */
  createdBy: string | { _id: string; name: string; role: string; photo?: string };
  /** Pinned announcements sort first (isPinned: -1, createdAt: -1) */
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  /** Link to the submitted work (the live API stores a URL here). */
  file?: string;
  /** Bare id on learner endpoints; populated on GET /assignments/:id (staff) */
  student: string | { _id: string; name: string; email?: string; photo?: string };
  /** Safe learner-facing metadata. Never expose a Drive file ID or URL. */
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  /** Staff view only: open the file through submissionFileUrl() */
  hasFile?: boolean;
  submittedAt: string;
  /** Cleared by the API when the student resubmits */
  grade?: number | null;
  feedback?: string | null;
}

export interface BackendAssignment {
  _id: string;
  title: string;
  description: string;
  /** Populated course reference (mutually exclusive with session) */
  course?: BackendCourse | null;
  /** Populated session reference (mutually exclusive with course) */
  session?: BackendSession | null;
  instructor: PopulatedUser;
  /** Trusted-host URLs (Drive, GitHub, Cloudinary, etc.) */
  attachments: string[];
  deadline: string;
  submissions: Submission[];
  /** The requesting user's own submission — only present on track-level endpoint */
  mySubmission?: Submission | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTaskItem {
  _id: string;
  title: string;
  type: "reading" | "quiz" | "video" | "assignment" | "other";
  /** Computed per requesting user — not stored on the item itself */
  done: boolean;
}

export interface WeeklyTask {
  _id: string;
  course: string;
  instructor: string;
  week: number;
  title: string;
  items: WeeklyTaskItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Auth ─────────────────────────────────────────────────────

export interface SignInPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  passwordConfirm: string;
}

export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return request<AuthResponse>("POST", "/users/login", payload);
}

export function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return request<AuthResponse>("POST", "/users/signup", payload);
}

export function signOut(): Promise<void> {
  return request("POST", "/users/logout");
}

export function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  return request("POST", "/users/forgotPassword", payload);
}

export function resetPassword(
  payload: ResetPasswordPayload,
): Promise<AuthResponse> {
  const { token, ...body } = payload;
  return request<AuthResponse>("PATCH", `/users/resetPassword/${token}`, body);
}

export function getMe(): Promise<{ status: string; data: { user: AuthUser } }> {
  return request("GET", "/users/me");
}

export function updateMe(payload: {
  name?: string;
  photo?: string;
  bio?: string;
  website?: string;
  socialMedia?: { twitter?: string; linkedin?: string; github?: string };
}): Promise<{ status: string; data: { user: AuthUser } }> {
  return request("PATCH", "/users/updateMe", payload);
}

export function updateMyPassword(payload: {
  passwordCurrent: string;
  password: string;
  passwordConfirm: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("PATCH", "/users/updateMyPassword", payload);
}

export function deleteMe(): Promise<void> {
  return request("DELETE", "/users/deleteMe");
}

// ── User enrollments (protected) ─────────────────────────────

export interface EnrollmentsResponse {
  status: string;
  data: {
    // The backend returns an array; the frontend reads [0] to get the single
    // enrolled track (a user can only be in one track at a time).
    tracks: BackendTrack[];
    courses: BackendCourse[];
    sessions: BackendSession[];
  };
}

export function getMyEnrollments(): Promise<EnrollmentsResponse> {
  return request<EnrollmentsResponse>("GET", "/users/me/enrollments");
}

// ── Tracks (public) ──────────────────────────────────────────

export interface TracksResponse {
  status: string;
  results: number;
  total: number;
  data: { tracks: BackendTrack[] };
}

export interface TrackResponse {
  status: string;
  data: { track: BackendTrack };
}

export interface TrackAnalytics {
  totalStudents: number;
  totalSessions: number;
  enrollmentRate: number;
  completionRate: number;
  averageEngagement: number;
}

export function getTracks(query?: string): Promise<TracksResponse> {
  return request<TracksResponse>("GET", `/tracks${query ? `?${query}` : ""}`);
}

export function getTrack(id: string): Promise<TrackResponse> {
  return request<TrackResponse>("GET", `/tracks/${id}`);
}

export function getPopularTracks(): Promise<TracksResponse> {
  return request<TracksResponse>("GET", "/tracks/popular");
}

export function getTrackAnalytics(
  trackId: string,
): Promise<{ status: string; data: TrackAnalytics }> {
  return request("GET", `/tracks/${trackId}/analytics`);
}

// ── Track CRUD (admin/instructor) ────────────────────────────

export interface TrackPayload {
  title: string;
  description: string;
  level?: "beginner" | "intermediate" | "advanced" | "all";
  published?: boolean;
  /** Admin only: user id of an instructor or admin. Ignored for other roles. */
  instructor?: string;
}

export function createTrack(
  payload: TrackPayload,
): Promise<TrackResponse> {
  return request<TrackResponse>("POST", "/tracks", payload);
}

export function updateTrack(
  trackId: string,
  payload: Partial<TrackPayload>,
): Promise<TrackResponse> {
  return request<TrackResponse>("PATCH", `/tracks/${trackId}`, payload);
}

export function deleteTrack(
  trackId: string,
): Promise<void> {
  return request("DELETE", `/tracks/${trackId}`);
}

// ── Track enrollment (protected) ─────────────────────────────

export function enrollInTrack(
  trackId: string,
): Promise<{ status: string; message: string; data: { track: BackendTrack } }> {
  return request("POST", `/tracks/${trackId}/enroll-me`);
}

export function leaveTrack(
  trackId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/tracks/${trackId}/leave-me`);
}

// ── Track pending requests (instructor/admin) ─────────────────

export interface PendingListResponse {
  status: string;
  results: number;
  data: {
    pendingStudents: AuthUser[];
    pendingLeaves: AuthUser[];
  };
}

/**
 * Pending join and leave requests for a track. The deployed API returns
 * join requests from /pending and leave requests from a separate /leaves
 * endpoint, so fetch both and merge them.
 */
export async function getTrackPending(
  trackId: string,
): Promise<PendingListResponse> {
  const [pending, leaves] = await Promise.all([
    request<PendingListResponse>("GET", `/tracks/${trackId}/pending`),
    request<{ data?: { pendingLeaves?: AuthUser[] } }>("GET", `/tracks/${trackId}/leaves`)
      .catch(() => null),
  ]);
  return {
    ...pending,
    data: {
      ...pending.data,
      pendingLeaves: leaves?.data?.pendingLeaves ?? pending.data?.pendingLeaves ?? [],
    },
  };
}

export function approveEnrollment(
  trackId: string,
  studentId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/tracks/${trackId}/students/${studentId}/approve`);
}

export function rejectEnrollment(
  trackId: string,
  studentId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/tracks/${trackId}/students/${studentId}/reject`);
}

export function getTrackLeaves(
  trackId: string,
): Promise<PendingListResponse> {
  return request<PendingListResponse>("GET", `/tracks/${trackId}/leaves`);
}

export function approveLeave(
  trackId: string,
  studentId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/tracks/${trackId}/leaves/${studentId}/approve`);
}

export function rejectLeave(
  trackId: string,
  studentId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/tracks/${trackId}/leaves/${studentId}/reject`);
}

// ── Sessions (protected) ──────────────────────────────────────

export interface SessionsResponse {
  status: string;
  results: number;
  total: number;
  data: { sessions: BackendSession[] };
}

export interface SessionResponse {
  status: string;
  data: { session: BackendSession };
}

/** Signed-in only; filters such as access=public&published=true pass through. */
export function getSessions(query?: string): Promise<SessionsResponse> {
  return request<SessionsResponse>("GET", `/sessions${query ? `?${query}` : ""}`);
}

export function getSession(id: string): Promise<SessionResponse> {
  return request<SessionResponse>("GET", `/sessions/${id}`);
}

export function getSessionsByTrack(trackId: string): Promise<SessionsResponse> {
  return request<SessionsResponse>("GET", `/sessions/track/${trackId}`);
}

export interface SessionCatalogResponse {
  status: string;
  data: { sessions: SessionCatalogItem[] };
}

/** Public endpoint: session titles and schedule only, never video URLs. */
export function getSessionCatalogByTrack(
  trackId: string,
): Promise<SessionCatalogResponse> {
  return request<SessionCatalogResponse>("GET", `/tracks/${trackId}/session-catalog`);
}

export async function markSessionWatched(
  sessionId: string,
): Promise<{ status: string; data: { myProgress: NonNullable<BackendSession["myProgress"]> } }> {
  try {
    return await request("PUT", `/sessions/${sessionId}/progress`, { status: "watched" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      throw new ApiError("Join this session's track to track your progress.", 403);
    }
    throw err;
  }
}

// ── Session CRUD and linking (staff) ─────────────────────────
// POST /sessions ignores `tracks` and rejects `course`: create first, then
// attach with the linking routes. Linking to a track requires owning the track.

export interface SessionPayload {
  title: string;
  description?: string;
  url?: string;
  level?: "beginner" | "intermediate" | "advanced";
  access?: "public" | "track-only" | "private";
  duration?: number;
  startDate?: string | null;
  endDate?: string | null;
  published?: boolean;
  resources?: { title: string; url: string }[];
}

export function createSession(payload: SessionPayload): Promise<SessionResponse> {
  return request<SessionResponse>("POST", "/sessions", payload);
}

export function updateSession(
  sessionId: string,
  payload: Partial<SessionPayload>,
): Promise<SessionResponse> {
  return request<SessionResponse>("PATCH", `/sessions/${sessionId}`, payload);
}

export function deleteSession(sessionId: string): Promise<void> {
  return request("DELETE", `/sessions/${sessionId}`);
}

export function getSessionsByInstructor(instructorId: string): Promise<SessionsResponse> {
  return request<SessionsResponse>("GET", `/sessions/instructor/${instructorId}`);
}

export function attachSessionToTrack(trackId: string, sessionId: string): Promise<unknown> {
  return request("PATCH", `/tracks/${trackId}/sessions/${sessionId}`);
}

export function detachSessionFromTrack(trackId: string, sessionId: string): Promise<void> {
  return request("DELETE", `/tracks/${trackId}/sessions/${sessionId}`);
}

export function attachSessionToCourse(courseId: string, sessionId: string): Promise<unknown> {
  return request("PATCH", `/courses/${courseId}/sessions/${sessionId}`);
}

export function detachSessionFromCourse(courseId: string, sessionId: string): Promise<void> {
  return request("DELETE", `/courses/${courseId}/sessions/${sessionId}`);
}

export function enrollInSession(
  sessionId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/sessions/${sessionId}/enroll-me`);
}

export function leaveSession(
  sessionId: string,
): Promise<{ status: string; message: string }> {
  return request("DELETE", `/sessions/${sessionId}/leave-me`);
}

// ── Courses (public + protected) ─────────────────────────────

export interface CoursesResponse {
  status: string;
  results: number;
  total: number;
  data: { courses: BackendCourse[] };
}

export interface CourseResponse {
  status: string;
  data: { course: BackendCourse };
}

export function getCourses(query?: string): Promise<CoursesResponse> {
  return request<CoursesResponse>("GET", `/courses${query ? `?${query}` : ""}`);
}

export function getCourse(id: string): Promise<CourseResponse> {
  return request<CourseResponse>("GET", `/courses/${id}`);
}

export function getCoursesByTrack(trackId: string): Promise<CoursesResponse> {
  return request<CoursesResponse>("GET", `/courses/track/${trackId}`);
}

export function getCoursesByInstructor(
  instructorId: string,
): Promise<CoursesResponse> {
  return request<CoursesResponse>(
    "GET",
    `/courses/instructor/${instructorId}`,
  );
}

export function enrollInCourse(
  courseId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/courses/${courseId}/enroll-me`);
}

export function leaveCourse(
  courseId: string,
): Promise<{ status: string; message: string }> {
  return request("DELETE", `/courses/${courseId}/leave-me`);
}

// ── Course CRUD (admin/instructor) ───────────────────────────

export interface CoursePayload {
  title: string;
  description: string;
  track?: string;
  level?: "beginner" | "intermediate" | "advanced";
  published?: boolean;
  access?: "public" | "track-only" | "private";
}

export function createCourse(
  payload: CoursePayload,
): Promise<CourseResponse> {
  return request<CourseResponse>("POST", "/courses", payload);
}

export function updateCourse(
  courseId: string,
  payload: Partial<CoursePayload>,
): Promise<CourseResponse> {
  return request<CourseResponse>("PATCH", `/courses/${courseId}`, payload);
}

export function deleteCourse(
  courseId: string,
): Promise<void> {
  return request("DELETE", `/courses/${courseId}`);
}

// ── Events (public) ──────────────────────────────────────────

export interface EventsResponse {
  status: string;
  results: number;
  data: { events: BackendEvent[] };
}

export interface EventResponse {
  status: string;
  data: { event: BackendEvent };
}

export interface FeedResponse {
  status: string;
  data: {
    announcements: BackendAnnouncement[];
    upcomingEvents: BackendEvent[];
  };
}

export function getEvents(query?: string): Promise<EventsResponse> {
  return request<EventsResponse>("GET", `/events${query ? `?${query}` : ""}`);
}

export function getEvent(eventId: string): Promise<EventResponse> {
  return request<EventResponse>("GET", `/events/${eventId}`);
}

// Returns only events the current user has RSVP'd to (uses the dedicated
// backend route instead of loading all events and filtering client-side).
export function getMyEvents(): Promise<EventsResponse> {
  return request<EventsResponse>("GET", "/events/my-events");
}

export function getFeed(): Promise<FeedResponse> {
  return request<FeedResponse>("GET", "/feed");
}

// ── Event RSVP (protected) ───────────────────────────────────

export function rsvpEvent(
  eventId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/events/${eventId}/rsvp`);
}

export function cancelRsvp(
  eventId: string,
): Promise<{ status: string; message: string }> {
  return request("DELETE", `/events/${eventId}/rsvp`);
}

// ── Event CRUD (admin) ───────────────────────────────────────

export interface EventPayload {
  title: string;
  description: string;
  date: string;           // ISO string
  locationType: "online" | "offline";
  locationLink?: string;
  locationAddress?: string;
  track?: string;
  course?: string;
}

export function createEvent(
  payload: EventPayload,
): Promise<EventResponse> {
  return request<EventResponse>("POST", "/events", payload);
}

export function updateEvent(
  eventId: string,
  payload: Partial<EventPayload>,
): Promise<EventResponse> {
  return request<EventResponse>("PATCH", `/events/${eventId}`, payload);
}

export function deleteEvent(
  eventId: string,
): Promise<void> {
  return request("DELETE", `/events/${eventId}`);
}

// ── Announcements (public) ────────────────────────────────────

export interface AnnouncementsResponse {
  status: string;
  results: number;
  data: { announcements: BackendAnnouncement[] };
}

export interface AnnouncementResponse {
  status: string;
  data: { announcement: BackendAnnouncement };
}

export function getAnnouncements(query?: string): Promise<AnnouncementsResponse> {
  return request<AnnouncementsResponse>(
    "GET",
    `/announcements${query ? `?${query}` : ""}`,
  );
}

export function getAnnouncement(id: string): Promise<AnnouncementResponse> {
  return request<AnnouncementResponse>("GET", `/announcements/${id}`);
}

// ── Announcements (admin/instructor) ──────────────────────────
// Validation: title ≥ 3 chars, message ≥ 10 chars; targetTrack/targetCourse
// are only allowed when audience is "track"/"course" respectively.

export interface AnnouncementPayload {
  title: string;
  message: string;
  audience: "all" | "track" | "course";
  targetTrack?: string;
  targetCourse?: string;
  isPinned?: boolean;
}

export function createAnnouncement(
  payload: AnnouncementPayload,
): Promise<AnnouncementResponse> {
  return request<AnnouncementResponse>("POST", "/announcements", payload);
}

export function updateAnnouncement(
  id: string,
  payload: Partial<AnnouncementPayload>,
): Promise<AnnouncementResponse> {
  return request<AnnouncementResponse>("PATCH", `/announcements/${id}`, payload);
}

export function deleteAnnouncement(id: string): Promise<void> {
  return request("DELETE", `/announcements/${id}`);
}

// ── Weekly Tasks (protected) ──────────────────────────────────

export interface WeeklyTasksResponse {
  status: string;
  results: number;
  data: { weeklyTasks: WeeklyTask[] };
}

// The API returns the list as `data.tasks`; callers read `data.weeklyTasks`.
async function getWeeklyTasks(path: string): Promise<WeeklyTasksResponse> {
  const res = await request<{
    status: string;
    results: number;
    data?: { tasks?: WeeklyTask[] };
  }>("GET", path);
  return { ...res, data: { weeklyTasks: res.data?.tasks ?? [] } };
}

export function getWeeklyTasksByTrack(
  trackId: string,
): Promise<WeeklyTasksResponse> {
  return getWeeklyTasks(`/tracks/${trackId}/weekly-tasks`);
}

export function getWeeklyTasksByCourse(
  courseId: string,
): Promise<WeeklyTasksResponse> {
  return getWeeklyTasks(`/courses/${courseId}/weekly-tasks`);
}

export function completeWeeklyTaskItem(
  taskId: string,
  itemId: string,
): Promise<{ status: string; message: string }> {
  return request("POST", `/weekly-tasks/${taskId}/items/${itemId}/complete`);
}

export function uncompleteWeeklyTaskItem(
  taskId: string,
  itemId: string,
): Promise<{ status: string; message: string }> {
  return request("DELETE", `/weekly-tasks/${taskId}/items/${itemId}/complete`);
}

// ── Weekly task CRUD (staff) ──────────────────────────────────
// There are no per-item routes: an edit sends the whole item list. Items that
// keep their `_id` keep students' ticks.

export interface WeeklyTaskPayload {
  week: number;
  title: string;
  items: { _id?: string; title: string; type: WeeklyTaskItem["type"] }[];
}

export function createWeeklyTask(courseId: string, payload: WeeklyTaskPayload): Promise<unknown> {
  return request("POST", `/courses/${courseId}/weekly-tasks`, payload);
}

export function updateWeeklyTask(
  taskId: string,
  payload: Partial<WeeklyTaskPayload>,
): Promise<unknown> {
  return request("PATCH", `/weekly-tasks/${taskId}`, payload);
}

export function deleteWeeklyTask(taskId: string): Promise<void> {
  return request("DELETE", `/weekly-tasks/${taskId}`);
}

// ── Assignments (protected) ───────────────────────────────────

export interface AssignmentsResponse {
  status: string;
  results: number;
  data: { assignments: BackendAssignment[] };
}

export interface AssignmentResponse {
  status: string;
  data: { assignment: BackendAssignment };
}

/** Get all assignments across every course in a track.
 *  Each assignment includes a `mySubmission` field for the current user. */
export function getAssignmentsByTrack(
  trackId: string,
): Promise<AssignmentsResponse> {
  return request<AssignmentsResponse>("GET", `/tracks/${trackId}/assignments`);
}

export function getAssignmentsByCourse(
  courseId: string,
): Promise<AssignmentsResponse> {
  return request<AssignmentsResponse>(
    "GET",
    `/courses/${courseId}/assignments`,
  );
}

export function getAssignmentsBySession(
  sessionId: string,
): Promise<AssignmentsResponse> {
  return request<AssignmentsResponse>(
    "GET",
    `/sessions/${sessionId}/assignments`,
  );
}

// Title at least 3 characters, description at least 10. An assignment can't
// be moved to another course or session after it's created.
export interface AssignmentPayload {
  title: string;
  description: string;
  deadline: string;
  attachments?: string[];
}

export function createAssignment(
  target: { course: string } | { session: string },
  payload: AssignmentPayload,
): Promise<AssignmentResponse> {
  const path =
    "course" in target
      ? `/courses/${target.course}/assignments`
      : `/sessions/${target.session}/assignments`;
  return request<AssignmentResponse>("POST", path, payload);
}

export function updateAssignment(
  assignmentId: string,
  payload: Partial<AssignmentPayload>,
): Promise<AssignmentResponse> {
  return request<AssignmentResponse>("PATCH", `/assignments/${assignmentId}`, payload);
}

export function deleteAssignment(assignmentId: string): Promise<void> {
  return request("DELETE", `/assignments/${assignmentId}`);
}

/** Staff only: one assignment with populated submissions. */
export function getAssignment(assignmentId: string): Promise<AssignmentResponse> {
  return request<AssignmentResponse>("GET", `/assignments/${assignmentId}`);
}

/** Staff only. `studentId` is the student's user id. Feedback is up to 2000 chars. */
export function gradeSubmission(
  assignmentId: string,
  studentId: string,
  payload: { grade: number; feedback?: string },
): Promise<{ status: string }> {
  return request("PATCH", `/assignments/${assignmentId}/submissions/${studentId}/grade`, payload);
}

/**
 * Staff only. The endpoint answers with a 302 to the stored file, so use the
 * URL as a link target (new tab) and never fetch() it.
 */
export function submissionFileUrl(assignmentId: string, studentId: string): string {
  return `${API_BASE}/assignments/${assignmentId}/submissions/${studentId}/file`;
}

export interface AssignmentUploadResponse {
  status: string;
  message: string;
  data: { submission: Submission };
}

/**
 * The live API stores a link to the student's work: POST { file: url }.
 * (A multipart upload is rejected with '"file" is required'.)
 */
export function submitAssignmentLink(
  assignmentId: string,
  url: string,
): Promise<AssignmentUploadResponse> {
  return request<AssignmentUploadResponse>("POST", `/assignments/${assignmentId}/submissions`, { file: url });
}

// ── Contact ───────────────────────────────────────────────────

export interface ContactPayload {
  username: string;
  track: string;
  email: string;
  phone: string;
  message: string;
}

export function submitContact(
  payload: ContactPayload,
): Promise<{ status: string; message: string }> {
  return request("POST", "/contact", payload);
}

// ── Reviews ───────────────────────────────────────────────────

export interface ReviewPayload {
  rating: number;
  content: string;
}

export interface Review {
  _id: string;
  rating: number;
  content: string;
  user: { _id: string; name: string; photo?: string };
  createdAt: string;
}

export interface ReviewsResponse {
  status: string;
  results: number;
  data: { reviews: Review[] };
}

// Track reviews
export function submitTrackReview(
  trackId: string,
  payload: ReviewPayload,
): Promise<{ status: string; data: { review: Review } }> {
  return request("POST", `/tracks/${trackId}/reviews`, payload);
}

export function getTrackReviews(trackId: string): Promise<ReviewsResponse> {
  return request<ReviewsResponse>("GET", `/tracks/${trackId}/reviews`);
}

// Session reviews
export function submitSessionReview(
  sessionId: string,
  payload: ReviewPayload,
): Promise<{ status: string; data: { review: Review } }> {
  return request("POST", `/sessions/${sessionId}/reviews`, payload);
}

export function getSessionReviews(sessionId: string): Promise<ReviewsResponse> {
  return request<ReviewsResponse>("GET", `/sessions/${sessionId}/reviews`);
}

export function deleteSessionReview(
  sessionId: string,
  reviewId: string,
): Promise<void> {
  return request("DELETE", `/sessions/${sessionId}/reviews/${reviewId}`);
}

// Course reviews
export function submitCourseReview(
  courseId: string,
  payload: ReviewPayload,
): Promise<{ status: string; data: { review: Review } }> {
  return request("POST", `/courses/${courseId}/reviews`, payload);
}

export function getCourseReviews(courseId: string): Promise<ReviewsResponse> {
  return request<ReviewsResponse>("GET", `/courses/${courseId}/reviews`);
}

export function deleteCourseReview(
  courseId: string,
  reviewId: string,
): Promise<void> {
  return request("DELETE", `/courses/${courseId}/reviews/${reviewId}`);
}

// ── Dashboard Stats (admin only) ─────────────────────────────

export interface DashboardStats {
  _id: string;
  period: "daily" | "weekly" | "monthly";
  date: string;
  totalUsers: number;
  /** Users registered in the last 24 hours */
  newUsers: number;
  totalTracks: number;
  totalCourses: number;
  totalAssignments: number;
  totalSubmissions: number;
  avgCompletionRate: number;
  totalEvents: number;
  totalAnnouncements: number;
  /** Populated on /live and snapshot endpoints; older payloads sent a bare id */
  mostActiveTrack?: string | { _id: string; title?: string } | null;
  createdAt: string;
  /** Present on /dashboard-stats/live instead of createdAt */
  computedAt?: string;
}

export interface DashboardStatsResponse {
  status: string;
  results: number;
  total: number;
  pagination: object;
  data: { stats: DashboardStats[] };
}

export interface DashboardTrendsResponse {
  status: string;
  data: { trends: DashboardStats[] };
}

/** Live platform stats computed on the fly — not persisted. newUsers covers last 24h. */
export function getDashboardLive(): Promise<{ status: string; data: DashboardStats }> {
  return request("GET", "/dashboard-stats/live");
}

/** Most recently generated snapshot for a period */
export function getDashboardLatest(
  period: "daily" | "weekly" | "monthly",
): Promise<{ status: string; data: DashboardStats }> {
  return request("GET", `/dashboard-stats/latest?period=${period}`);
}

/** Last N snapshots for a period, oldest first — ready to feed into a trend chart */
export function getDashboardTrends(
  period: "daily" | "weekly" | "monthly",
  limit?: number,
): Promise<DashboardTrendsResponse> {
  const q = `period=${period}${limit ? `&limit=${limit}` : ""}`;
  return request<DashboardTrendsResponse>("GET", `/dashboard-stats/trends?${q}`);
}

/** Generate or refresh a snapshot on demand (upserts — same period/date overwrites) */
export function createDashboardSnapshot(payload: {
  period: "daily" | "weekly" | "monthly";
  date?: string;
}): Promise<{ status: string; data: DashboardStats }> {
  return request("POST", "/dashboard-stats/snapshot", payload);
}

/** List stored snapshots. Supports ?period=daily&date[gte]=2025-01-01 filters */
export function getDashboardStats(
  query?: string,
): Promise<DashboardStatsResponse> {
  return request<DashboardStatsResponse>(
    "GET",
    `/dashboard-stats${query ? `?${query}` : ""}`,
  );
}

export function getDashboardStat(
  id: string,
): Promise<{ status: string; data: DashboardStats }> {
  return request("GET", `/dashboard-stats/${id}`);
}

/** Bulk-delete snapshots older than N days */
export function deleteDashboardStats(
  olderThanDays: number,
): Promise<{ status: string; message: string }> {
  return request("DELETE", `/dashboard-stats?olderThanDays=${olderThanDays}`);
}

export function deleteDashboardStat(id: string): Promise<void> {
  return request("DELETE", `/dashboard-stats/${id}`);
}

// ── Activity Logs ─────────────────────────────────────────────

export interface ActivityLog {
  _id: string;
  user: string;
  /** e.g. "enrolled_in_course", "login", "submitted_assignment" */
  action: string;
  targetModel?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogsResponse {
  status: string;
  results: number;
  total: number;
  pagination: object;
  data: { logs: ActivityLog[] };
}

export interface ActivitySummaryResponse {
  status: string;
  data: {
    totalCount: number;
    byAction: Record<string, number>;
    mostActiveUsers: { user: string; count: number }[];
  };
}

/** Get the current user's own activity timeline (newest first) */
export function getMyActivityLogs(query?: string): Promise<ActivityLogsResponse> {
  return request<ActivityLogsResponse>(
    "GET",
    `/activity-logs/me${query ? `?${query}` : ""}`,
  );
}

/** Aggregated activity stats — totals, breakdown by action, most active users (admin) */
export function getActivitySummary(params?: {
  from?: string;
  to?: string;
  action?: string;
}): Promise<ActivitySummaryResponse> {
  const q = params
    ? Object.entries(params)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return request<ActivitySummaryResponse>(
    "GET",
    `/activity-logs/summary${q ? `?${q}` : ""}`,
  );
}

/** A specific user's activity timeline (admin only) */
export function getUserActivityLogs(
  userId: string,
  query?: string,
): Promise<ActivityLogsResponse> {
  return request<ActivityLogsResponse>(
    "GET",
    `/activity-logs/user/${userId}${query ? `?${query}` : ""}`,
  );
}

/** All activity logs — supports ?action=login&page=1 (admin only) */
export function getActivityLogs(query?: string): Promise<ActivityLogsResponse> {
  return request<ActivityLogsResponse>(
    "GET",
    `/activity-logs${query ? `?${query}` : ""}`,
  );
}

export function getActivityLog(
  id: string,
): Promise<{ status: string; data: ActivityLog }> {
  return request("GET", `/activity-logs/${id}`);
}

/** Bulk-delete logs older than N days — minimum 30 to protect audit trail (admin) */
export function deleteActivityLogs(
  olderThanDays: number,
): Promise<{ status: string; message: string }> {
  return request(
    "DELETE",
    `/activity-logs?olderThanDays=${olderThanDays}`,
  );
}

export function deleteActivityLog(id: string): Promise<void> {
  return request("DELETE", `/activity-logs/${id}`);
}

// ── Admin: User management ────────────────────────────────────

export interface UsersResponse {
  status: string;
  results: number;
  total: number;
  data: { users: AuthUser[] };
}

export interface UserAdminUpdatePayload {
  name?: string;
  email?: string;
  role?: "student" | "instructor" | "admin";
  active?: boolean;
  emailVerified?: boolean;
}

/** List all users — admin only. Supports ?role=student&page=1 etc. */
export function getAllUsers(query?: string): Promise<UsersResponse> {
  return request<UsersResponse>(
    "GET",
    `/users${query ? `?${query}` : ""}`,
  );
}

/** Get a single user by id — admin only. */
export function getUser(
  userId: string,
): Promise<{ status: string; data: { user: AuthUser } }> {
  return request("GET", `/users/${userId}`);
}

/** Update any user field (role, active, etc.) — admin only. */
export function updateUserAdmin(
  userId: string,
  payload: UserAdminUpdatePayload,
): Promise<{ status: string; data: { user: AuthUser } }> {
  return request("PATCH", `/users/${userId}`, payload);
}
