import { useEffect } from "react";

const SITE_NAME = "TROSC";

/** Sets document.title to "<title> · TROSC" (or just "TROSC" when empty). */
const usePageTitle = (title?: string | null) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
};

export default usePageTitle;
