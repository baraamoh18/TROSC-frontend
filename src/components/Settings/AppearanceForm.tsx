import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getThemePref, setThemePref, subscribeTheme, type ThemePref } from "../../utils/theme";

const options: { id: ThemePref; label: string; hint: string; icon: typeof Sun }[] = [
  { id: "system", label: "System", hint: "Match your device", icon: Monitor },
  { id: "light", label: "Light", hint: "Always light", icon: Sun },
  { id: "dark", label: "Dark", hint: "Always dark", icon: Moon },
];

/** Theme picker. Applies straight away and is saved on this device. */
const AppearanceForm = () => {
  // Shared with the navbar toggle, so flipping it updates this picker too
  const pref = useSyncExternalStore(subscribeTheme, getThemePref);
  const choose = (id: ThemePref) => setThemePref(id);

  return (
    <fieldset>
      <legend className="text-lg font-bold text-neutral-darker">Theme</legend>
      <p className="mt-1 text-sm text-neutral-dark">Saved on this device only.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {options.map(({ id, label, hint, icon: Icon }) => {
          const on = pref === id;
          return (
            <label
              key={id}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                on
                  ? "border-primary bg-primary-light"
                  : "border-neutral-light-active hover:bg-neutral-light"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={id}
                checked={on}
                onChange={() => choose(id)}
                className="sr-only"
              />
              <Icon size={20} className={on ? "text-brand" : "text-neutral-dark"} aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-neutral-darker">{label}</span>
                <span className="block text-xs text-neutral-dark">{hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default AppearanceForm;
