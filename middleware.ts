import { rewrite } from "@vercel/functions";

// Public pages get their <head> and readable content from api/seo.ts
// (see the comment there). Everything else is served the SPA shell as before.
export const config = {
  matcher: ["/", "/explore", "/contact", "/privacy", "/terms", "/track/:id", "/courses/:id", "/events/:id"],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/api/seo", url);
  target.searchParams.set("path", url.pathname);
  return rewrite(target);
}
