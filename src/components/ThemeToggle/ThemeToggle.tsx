import { useSyncExternalStore } from "react";
import { isDarkTheme, setThemePref, subscribeTheme } from "../../utils/theme";
import { ASTRO_BEAR, CLOUDS_BACK, CLOUDS_FRONT, PILOT_BEAR, STARS } from "./art";
import "./ThemeToggle.css";

// Static, trusted markup from ./art (no user content)
const svg = (html: string) => ({ __html: html });

/**
 * Navbar day/night switch. Pressing it picks Light or Dark explicitly;
 * Settings > Appearance still offers "System" to follow the device.
 */
const ThemeToggle = () => {
  const dark = useSyncExternalStore(subscribeTheme, isDarkTheme);
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={label}
      onClick={() => setThemePref(dark ? "light" : "dark")}
    >
      <span className="toggle" aria-hidden="true">
        <span className="toggle__content">
          <span dangerouslySetInnerHTML={svg(CLOUDS_BACK)} />
          <span className="pilot__container">
            <span className="pilot-bear" dangerouslySetInnerHTML={svg(PILOT_BEAR)} />
          </span>
          <span dangerouslySetInnerHTML={svg(CLOUDS_FRONT)} />
          <span className="toggle__indicator-wrapper">
            <span className="toggle__indicator">
              <span className="toggle__star">
                <span className="sun">
                  <span className="moon">
                    <span className="moon__crater" />
                    <span className="moon__crater" />
                    <span className="moon__crater" />
                  </span>
                </span>
              </span>
            </span>
          </span>
          <span dangerouslySetInnerHTML={svg(STARS)} />
          <span className="astrobear__container">
            <span className="astrobear" dangerouslySetInnerHTML={svg(ASTRO_BEAR)} />
          </span>
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
