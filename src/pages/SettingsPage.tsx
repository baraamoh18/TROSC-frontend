import { useState } from "react";
import { User, Lock, TriangleAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";
import ProfileForm from "../components/Settings/ProfileForm";
import SecurityForm from "../components/Settings/SecurityForm";
import DangerZone from "../components/Settings/DangerZone";
import usePageTitle from "../hooks/usePageTitle";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "danger", label: "Danger Zone", icon: TriangleAlert },
] as const;

type TabId = (typeof tabs)[number]["id"];

const SettingsPage = () => {
  usePageTitle("Settings");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-light pt-24 pb-20 font-family-poppins">
      <div className="mx-auto w-full max-w-3xl px-6">
        {/* Page header */}
        <h1 className="text-3xl font-extrabold text-primary-darker">
          Settings
        </h1>
        <p className="mt-1 mb-8 text-neutral-dark">
          Manage your profile, password, and account.
        </p>

        {/* Tab switcher */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-neutral-dark hover:text-neutral-darker hover:bg-neutral-light-active"
                } ${tab.id === "danger" && !isActive ? "hover:text-primary-dark" : ""}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "security" && <SecurityForm />}
          {activeTab === "danger" && <DangerZone />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
