// Server-rendered <head> and a plain-text version of public pages, plus
// the sitemap. The app is a client-rendered SPA, so without this every
// URL returns the same empty shell: search engines see one generic title
// and AI crawlers, which mostly don't run JavaScript, see no content.
//
// middleware.ts rewrites public page URLs here as /api/seo?path=<path>;
// vercel.json rewrites /sitemap.xml to /api/seo?sitemap. Vercel's CDN
// caches the responses, so the API is asked at most every few minutes.
// The browser still boots the normal SPA, which replaces #root.
//
// Self-contained on purpose (no local imports): Vercel compiles each
// function file on its own, and node can run it directly for testing.

const SITE = (process.env.SITE_URL || "https://trosc.vercel.app").replace(/\/$/, "");
const API = (process.env.API_URL || "https://trosc.onrender.com/v1").replace(/\/$/, "");
const SITE_NAME = "TROSC";
const HOME_TITLE = "TROSC · Student-led tech tracks at Suez Canal University";
const FACULTY = "Faculty of Computers and Information, Suez Canal University";
const DEFAULT_DESCRIPTION =
  "Student-led tech team at the Faculty of Computers and Information, Suez Canal University. Learning tracks with live sessions, weekly tasks and reviewed work.";
const API_TIMEOUT_MS = 4000;

// ── API ───────────────────────────────────────────────────────

interface Person {
  name?: string;
}
interface Ref {
  _id: string;
  title?: string;
}
export interface Track {
  _id: string;
  title: string;
  description?: string;
  level?: string;
  coverImage?: string;
  instructor?: Person | string;
  instructors?: (Person | string)[];
  courses?: (Ref & { description?: string })[] | string[];
  courseCount?: number;
  sessionCount?: number;
  updatedAt?: string;
}
export interface Course {
  _id: string;
  title: string;
  description?: string;
  level?: string;
  coverImage?: string;
  instructor?: Person | string;
  track?: Ref | string;
  duration?: number;
  sessionCount?: number;
  updatedAt?: string;
}
export interface EventItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  locationType?: "online" | "offline";
  locationAddress?: string;
  coverImage?: string;
  updatedAt?: string;
}

export class NotFound extends Error {}

export type Fetcher = (path: string) => Promise<unknown>;

/** GET an API path; NotFound on 404 (and on 400/403, which bad or hidden ids give). */
export const apiFetch: Fetcher = async (path) => {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (res.status === 404 || res.status === 400 || res.status === 403) throw new NotFound(path);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return ((await res.json()) as { data: unknown }).data;
};

const list = async <T,>(get: Fetcher, path: string, key: string) =>
  (((await get(path)) as Record<string, T[]>)[key] ?? []) as T[];
const one = async <T,>(get: Fetcher, path: string, key: string) =>
  ((await get(path)) as Record<string, T>)[key];

// ── Helpers ───────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One line of plain text, cut at a word boundary for meta descriptions. */
const summary = (text: string | undefined, max = 160) => {
  const s = (text ?? "").replace(/<[^>]*>/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, s.lastIndexOf(" ", max - 1) > 80 ? s.lastIndexOf(" ", max - 1) : max - 1)}…`;
};

const nameOf = (p: Person | string | undefined) => (p && typeof p === "object" ? p.name?.trim() : undefined);

/** A real cover image; placeholders and inline data URLs aren't worth sharing. */
const imageOf = (url: string | undefined) =>
  url && url.startsWith("https://") && !url.includes("placehold.co") ? url : undefined;

const capitalise = (s: string | undefined) => (s ? s[0].toUpperCase() + s.slice(1) : undefined);

const cairoDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

const isId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: SITE_NAME,
  url: `${SITE}/`,
  logo: `${SITE}/apple-touch-icon.png`,
  email: "troscscu2@gmail.com",
  description: DEFAULT_DESCRIPTION,
  parentOrganization: { "@type": "EducationalOrganization", name: FACULTY },
};
const PROVIDER = { "@id": `${SITE}/#organization` };

// ── Pages ─────────────────────────────────────────────────────

export interface Page {
  status: number;
  /** Full document title */
  title: string;
  description: string;
  image?: string;
  jsonLd?: object;
  /** Plain HTML for #root, read by crawlers that don't run JavaScript */
  body: string;
  noindex?: boolean;
}

const titled = (t: string) => `${t} · ${SITE_NAME}`;

const linkList = (items: { href: string; title: string; text?: string }[]) =>
  items.length
    ? `<ul>${items
        .map((i) => `<li><a href="${esc(i.href)}">${esc(i.title)}</a>${i.text ? `: ${esc(summary(i.text, 200))}` : ""}</li>`)
        .join("")}</ul>`
    : "";

const nav = `<p><a href="/">Home</a> · <a href="/explore">Explore tracks and courses</a> · <a href="/contact">Contact</a></p>`;

const trackItems = (tracks: Track[]) =>
  tracks.map((t) => ({ href: `/track/${t._id}`, title: t.title, text: t.description }));
const courseItems = (courses: Course[]) =>
  courses.map((c) => ({ href: `/courses/${c._id}`, title: c.title, text: c.description }));

async function homePage(get: Fetcher): Promise<Page> {
  const now = new Date().toISOString();
  const [tracks, courses, events] = await Promise.all([
    list<Track>(get, "/tracks?published=true&limit=50&sort=title", "tracks"),
    list<Course>(get, "/courses?published=true&limit=50&sort=title", "courses"),
    list<EventItem>(get, `/events?sort=date&limit=10&date[gte]=${encodeURIComponent(now)}`, "events"),
  ]);
  return {
    status: 200,
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [ORGANIZATION, { "@type": "WebSite", name: SITE_NAME, url: `${SITE}/`, publisher: PROVIDER }],
    },
    body: [
      `<h1>TROSC</h1>`,
      `<p>TROSC is a student-led team from the ${esc(FACULTY)}. We run learning tracks with live sessions, weekly tasks and instructors who review your work.</p>`,
      tracks.length ? `<h2>Tracks</h2>${linkList(trackItems(tracks))}` : "",
      courses.length ? `<h2>Courses</h2>${linkList(courseItems(courses))}` : "",
      events.length
        ? `<h2>Upcoming events</h2>${linkList(events.map((e) => ({ href: `/events/${e._id}`, title: e.title, text: cairoDate(e.date) })))}`
        : "",
      nav,
    ].join(""),
  };
}

async function explorePage(get: Fetcher): Promise<Page> {
  const [tracks, courses] = await Promise.all([
    list<Track>(get, "/tracks?published=true&limit=100&sort=title", "tracks"),
    list<Course>(get, "/courses?published=true&limit=100&sort=title", "courses"),
  ]);
  return {
    status: 200,
    title: titled("Explore"),
    description: "Browse TROSC's learning tracks and courses: live sessions, weekly tasks and instructors who review your work.",
    body: [
      `<h1>Explore tracks and courses</h1>`,
      `<h2>Tracks</h2>${linkList(trackItems(tracks)) || "<p>No tracks are open yet.</p>"}`,
      `<h2>Courses</h2>${linkList(courseItems(courses)) || "<p>No courses are open yet.</p>"}`,
      nav,
    ].join(""),
  };
}

async function trackPage(get: Fetcher, id: string): Promise<Page> {
  const t = await one<Track>(get, `/tracks/${id}`, "track");
  const instructors = [nameOf(t.instructor), ...(t.instructors ?? []).map(nameOf)].filter(
    (n, i, all): n is string => !!n && all.indexOf(n) === i,
  );
  const courses = (t.courses ?? []).filter((c): c is Ref & { description?: string } => typeof c === "object");
  const facts = [
    capitalise(t.level) && `Level: ${capitalise(t.level)}`,
    instructors.length && `Instructors: ${instructors.join(", ")}`,
    t.courseCount != null && `${t.courseCount} ${t.courseCount === 1 ? "course" : "courses"}`,
    t.sessionCount != null && `${t.sessionCount} ${t.sessionCount === 1 ? "session" : "sessions"}`,
  ].filter(Boolean) as string[];
  const url = `${SITE}/track/${t._id}`;
  return {
    status: 200,
    title: titled(t.title),
    description: summary(t.description) || `${t.title}, a learning track by TROSC.`,
    image: imageOf(t.coverImage),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: t.title,
      description: summary(t.description, 500) || t.title,
      url,
      image: imageOf(t.coverImage),
      educationalLevel: capitalise(t.level),
      provider: ORGANIZATION,
      ...(instructors.length ? { instructor: instructors.map((name) => ({ "@type": "Person", name })) } : {}),
      ...(courses.length
        ? { hasPart: courses.map((c) => ({ "@type": "Course", name: c.title, url: `${SITE}/courses/${c._id}` })) }
        : {}),
    },
    body: [
      `<h1>${esc(t.title)}</h1>`,
      t.description ? `<p>${esc(summary(t.description, 2000))}</p>` : "",
      facts.length ? `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "",
      courses.length
        ? `<h2>Courses in this track</h2>${linkList(courses.map((c) => ({ href: `/courses/${c._id}`, title: c.title ?? "Course", text: c.description })))}`
        : "",
      nav,
    ].join(""),
  };
}

async function coursePage(get: Fetcher, id: string): Promise<Page> {
  const c = await one<Course>(get, `/courses/${id}`, "course");
  const instructor = nameOf(c.instructor);
  const track = c.track && typeof c.track === "object" ? c.track : undefined;
  const facts = [
    capitalise(c.level) && `Level: ${capitalise(c.level)}`,
    instructor && `Instructor: ${instructor}`,
    c.duration && `${c.duration} hours`,
    c.sessionCount != null && `${c.sessionCount} ${c.sessionCount === 1 ? "session" : "sessions"}`,
  ].filter(Boolean) as string[];
  return {
    status: 200,
    title: titled(c.title),
    description: summary(c.description) || `${c.title}, a course by TROSC.`,
    image: imageOf(c.coverImage),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: summary(c.description, 500) || c.title,
      url: `${SITE}/courses/${c._id}`,
      image: imageOf(c.coverImage),
      educationalLevel: capitalise(c.level),
      provider: ORGANIZATION,
      ...(instructor ? { instructor: { "@type": "Person", name: instructor } } : {}),
      ...(c.duration ? { timeRequired: `PT${c.duration}H` } : {}),
      ...(track?.title ? { isPartOf: { "@type": "Course", name: track.title, url: `${SITE}/track/${track._id}` } } : {}),
    },
    body: [
      `<h1>${esc(c.title)}</h1>`,
      c.description ? `<p>${esc(summary(c.description, 2000))}</p>` : "",
      facts.length ? `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "",
      track?.title ? `<p>Part of the <a href="/track/${esc(track._id)}">${esc(track.title)}</a> track.</p>` : "",
      nav,
    ].join(""),
  };
}

async function eventPage(get: Fetcher, id: string): Promise<Page> {
  const e = await one<EventItem>(get, `/events/${id}`, "event");
  const url = `${SITE}/events/${e._id}`;
  const online = e.locationType !== "offline";
  const where = online ? "Online" : e.locationAddress?.trim() || "In person";
  return {
    status: 200,
    title: titled(e.title),
    description: summary(`${cairoDate(e.date)} (Cairo time), ${where}. ${e.description ?? ""}`),
    image: imageOf(e.coverImage),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.title,
      description: summary(e.description, 500) || e.title,
      url,
      startDate: e.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: online
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
      // The page, not the meeting link: that's for people who RSVP
      location: online
        ? { "@type": "VirtualLocation", url }
        : { "@type": "Place", name: where, address: where },
      image: imageOf(e.coverImage),
      organizer: ORGANIZATION,
    },
    body: [
      `<h1>${esc(e.title)}</h1>`,
      `<p>${esc(cairoDate(e.date))} (Cairo time). ${esc(where)}.</p>`,
      e.description ? `<p>${esc(summary(e.description, 2000))}</p>` : "",
      nav,
    ].join(""),
  };
}

const STATIC: Record<string, { title: string; heading: string; description: string }> = {
  "/contact": {
    title: titled("Contact us"),
    heading: "Contact TROSC",
    description: `Get in touch with TROSC, the student-led tech team at the ${FACULTY}.`,
  },
  "/privacy": {
    title: titled("Privacy policy"),
    heading: "Privacy policy",
    description: "What information TROSC collects when you use the learning platform, why, and what you can do about it.",
  },
  "/terms": {
    title: titled("Terms of use"),
    heading: "Terms of use",
    description: "The terms for using the TROSC learning platform.",
  },
};

const notFoundPage = (): Page => ({
  status: 404,
  title: titled("Page not found"),
  description: "This page doesn't exist or is no longer public.",
  body: `<h1>Page not found</h1><p>This page doesn't exist or is no longer public.</p>${nav}`,
  noindex: true,
});

/** The page for a public path. Throws on API failures other than "not found". */
export async function buildPage(path: string, get: Fetcher = apiFetch): Promise<Page> {
  try {
    if (path === "/") return await homePage(get);
    if (path === "/explore") return await explorePage(get);
    const fixed = STATIC[path];
    if (fixed) {
      return { status: 200, ...fixed, body: `<h1>${esc(fixed.heading)}</h1><p>${esc(fixed.description)}</p>${nav}` };
    }
    const [, kind, id = ""] = path.split("/");
    if (!isId(id)) return notFoundPage();
    if (kind === "track") return await trackPage(get, id);
    if (kind === "courses") return await coursePage(get, id);
    if (kind === "events") return await eventPage(get, id);
    return notFoundPage();
  } catch (err) {
    if (err instanceof NotFound) return notFoundPage();
    throw err;
  }
}

// ── HTML ──────────────────────────────────────────────────────

const setMeta = (html: string, attr: "name" | "property", key: string, value: string) => {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `  ${tag}\n</head>`);
};

/** Fill the built index.html with a page's head tags and readable body. */
export function renderHtml(template: string, page: Page, path: string): string {
  const url = `${SITE}${path}`;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setMeta(html, "name", "description", page.description);
  html = setMeta(html, "property", "og:title", page.title);
  html = setMeta(html, "property", "og:description", page.description);
  html = setMeta(html, "property", "og:url", url);
  if (page.image) html = setMeta(html, "property", "og:image", page.image);
  if (page.image) html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*"\s*\/?>/g, "");

  const head = [
    page.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${esc(url)}" />`,
    page.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")}</script>`
      : "",
  ].filter(Boolean);
  html = html.replace("</head>", `  ${head.join("\n  ")}\n</head>`);

  // React replaces this when the app starts. The "prerender" style in
  // index.html keeps it hidden for a moment so a normal load doesn't flash it.
  return html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root"><main class="prerender">${page.body}</main></div>`,
  );
}

// ── Sitemap ───────────────────────────────────────────────────

export async function buildSitemap(get: Fetcher = apiFetch): Promise<string> {
  const [tracks, courses, events] = await Promise.all([
    list<Track>(get, "/tracks?published=true&limit=100", "tracks"),
    list<Course>(get, "/courses?published=true&limit=100", "courses"),
    list<EventItem>(get, "/events?limit=100&sort=-date", "events"),
  ]);
  const day = (iso?: string) => (iso ? iso.slice(0, 10) : undefined);
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: "/" },
    { loc: "/explore" },
    ...tracks.map((t) => ({ loc: `/track/${t._id}`, lastmod: day(t.updatedAt) })),
    ...courses.map((c) => ({ loc: `/courses/${c._id}`, lastmod: day(c.updatedAt) })),
    ...events.map((e) => ({ loc: `/events/${e._id}`, lastmod: day(e.updatedAt) })),
    { loc: "/contact" },
    { loc: "/privacy" },
    { loc: "/terms" },
  ];
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map(
      (u) => `  <url><loc>${esc(SITE + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
    ),
    `</urlset>`,
    "",
  ].join("\n");
}

// ── Handler ───────────────────────────────────────────────────

/** Browsers always revalidate; Vercel's CDN keeps a copy for `seconds`. */
const cacheHeaders = (seconds: number) => ({
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Vercel-CDN-Cache-Control": `max-age=${seconds}, stale-while-revalidate=86400`,
});

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.searchParams.has("sitemap")) {
    try {
      return new Response(await buildSitemap(), {
        headers: { "Content-Type": "application/xml; charset=utf-8", ...cacheHeaders(3600) },
      });
    } catch (err) {
      // A 5xx makes crawlers come back later instead of dropping pages
      console.error("sitemap", err);
      return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } });
    }
  }

  const path = url.searchParams.get("path") || "/";
  // The built app shell. Passing the cookie through lets this work on
  // password-protected preview deployments too.
  const templateRes = await fetch(new URL("/index.html", url.origin), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  if (!templateRes.ok) {
    console.error("template", templateRes.status);
    return new Response("Something went wrong. Reload the page.", { status: 502 });
  }
  const template = await templateRes.text();
  try {
    const page = await buildPage(path);
    return new Response(renderHtml(template, page, path), {
      status: page.status,
      headers: { "Content-Type": "text/html; charset=utf-8", ...cacheHeaders(page.status === 200 ? 600 : 60) },
    });
  } catch (err) {
    // API down or asleep: serve the plain app shell and try again soon
    console.error("page", path, err);
    return new Response(template, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...cacheHeaders(30) },
    });
  }
}
