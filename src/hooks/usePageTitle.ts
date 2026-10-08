import { useEffect } from "react";

const SITE_NAME = "TROSC";
// Keep in step with index.html and api/seo.ts
const HOME_TITLE = "TROSC · Student-led tech tracks at Suez Canal University";

/** Sets document.title to "<title> · TROSC" (the home page title when empty). */
const usePageTitle = (title?: string | null) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : HOME_TITLE;
  }, [title]);
};

export default usePageTitle;
