// Light / dark theme. The choice lives in localStorage; index.html
// applies it before first paint so there is no flash of the wrong theme.
// The navbar toggle and Settings > Appearance both read and write it here.

export type ThemePref = "light" | "dark" | "system";

const KEY = "trosc-theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // Storage blocked: fall back to the system setting
  }
  return "system";
}

/** The theme actually on screen right now. */
export function isDarkTheme(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

/** For useSyncExternalStore: called whenever the theme or the choice changes. */
export function subscribeTheme(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && media().matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#190a05" : "#e83b3b");
  listeners.forEach((cb) => cb());
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Not saved, but still applied for this visit
  }
  apply(pref);
}

/** Applies the saved choice and follows OS changes while on "system". */
export function initTheme() {
  apply(getThemePref());
  media().addEventListener("change", () => {
    if (getThemePref() === "system") apply("system");
  });
}
