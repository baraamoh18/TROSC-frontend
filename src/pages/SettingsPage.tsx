import { useSearchParams } from "react-router-dom";
import { Activity, CalendarCheck, Lock, Mail, SunMoon, TriangleAlert, User } from "lucide-react";
import { useAuth } from "../context/useAuth";
import AvatarUpload from "../components/Settings/AvatarUpload";
import ProfileForm from "../components/Settings/ProfileForm";
import MyEvents from "../components/Settings/MyEvents";
import RecentActivity from "../components/Settings/RecentActivity";
import SecurityForm from "../components/Settings/SecurityForm";
import DangerZone from "../components/Settings/DangerZone";
import AppearanceForm from "../components/Settings/AppearanceForm";
import usePageTitle from "../hooks/usePageTitle";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "events", label: "My events", icon: CalendarCheck },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: SunMoon },
  { id: "danger", label: "Danger Zone", icon: TriangleAlert },
] as const;

type TabId = (typeof tabs)[number]["id"];

const SettingsPage = () => {
  usePageTitle("Settings");
  const { user } = useAuth();
  // ?tab= keeps the open tab linkable, e.g. /settings?tab=events.
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const activeTab: TabId = tabs.some((t) => t.id === requested) ? (requested as TabId) : "profile";
  const setActiveTab = (id: TabId) => setParams(id === "profile" ? {} : { tab: id }, { replace: true });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page pt-24 pb-20">
      <div className="mx-auto w-full max-w-3xl px-6">
        <h1 className="text-3xl font-extrabold text-brand-darker">Settings</h1>
        <p className="mt-1 mb-6 text-neutral-dark">Your profile, events, activity, password, appearance and account.</p>

        {/* Who you are, with the photo control */}
        <div className="mb-8 flex flex-col items-start gap-5 rounded-xl bg-surface p-6 shadow-sm sm:flex-row sm:items-center">
          <AvatarUpload />
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-neutral-darker">{user.name}</p>
            <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-neutral-dark">
              <Mail size={16} className="shrink-0" aria-hidden="true" />
              {user.email}
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-semibold capitalize text-brand-dark">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="settings-panel"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface text-neutral-dark hover:text-neutral-darker hover:bg-neutral-light-active"
                } ${tab.id === "danger" && !isActive ? "hover:text-brand-dark" : ""}`}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id="settings-panel"
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeTab}`}
          className="rounded-xl bg-surface p-6 shadow-sm sm:p-8"
        >
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "events" && <MyEvents />}
          {activeTab === "activity" && <RecentActivity />}
          {activeTab === "security" && <SecurityForm />}
          {activeTab === "appearance" && <AppearanceForm />}
          {activeTab === "danger" && <DangerZone />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
