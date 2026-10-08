import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { NAVBAR_OFFSET, smoothScrollToId } from "../utils/smoothScroll";

/**
 * Listens to route changes and smoothly scrolls to the element matching
 * the URL hash (#section-id) using our custom requestAnimationFrame scroller.
 * Retries up to 10 times (every 80ms) to handle elements that haven't
 * mounted yet (e.g. navigating from /contact → /#tracks), then re-aims for
 * a few seconds while content above it loads.
 */
export default function useScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    // No hash — snap to the top of the new page immediately.
    // This prevents the previous page's scroll position from carrying over
    // when navigating to routes like /track/:id or /contact.
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const id = location.hash.replace("#", "");
    const MAX_ATTEMPTS = 10;
    // Sections above the target can change height while their data loads,
    // so keep re-aiming for a few seconds, until the visitor scrolls.
    const CORRECTIONS = [800, 1600, 2400, 3200];
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let userScrolled = false;
    const stop = () => {
      userScrolled = true;
    };
    const userEvents = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    userEvents.forEach((e) => window.addEventListener(e, stop, { passive: true }));

    const correct = () => {
      const el = document.getElementById(id);
      if (!userScrolled && el && Math.abs(el.getBoundingClientRect().top - NAVBAR_OFFSET) > 24) {
        smoothScrollToId(id);
      }
    };

    const tryScroll = () => {
      const found = smoothScrollToId(id);
      if (found) {
        CORRECTIONS.forEach((ms) => timers.push(setTimeout(correct, ms)));
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        timer = setTimeout(tryScroll, 80);
      }
    };

    // Small delay so React finishes rendering the new route's DOM
    timer = setTimeout(tryScroll, 50);
    return () => {
      clearTimeout(timer);
      timers.forEach(clearTimeout);
      userEvents.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [location.pathname, location.hash]);
}
