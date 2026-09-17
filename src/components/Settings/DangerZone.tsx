import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, TriangleAlert } from "lucide-react";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";

const DangerZone = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.deleteMe();
      await logout();
      toast.success(
        "Your account has been deactivated. You can sign in again to reactivate it.",
      );
      navigate("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate account.",
      );
      setDeactivating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-darker">Danger zone</h2>
        <p className="mt-1 text-sm text-neutral-dark">
          Deactivating your account removes you from all tracks, courses, and
          events. Your data is kept so you can reactivate by signing in again.
        </p>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-primary-dark bg-white px-8 py-3 text-base font-bold text-primary-dark transition-colors hover:bg-primary-light"
        >
          <TriangleAlert size={18} />
          Deactivate my account
        </button>
      ) : (
        <div className="rounded-2xl border-2 border-primary-light-active bg-primary-light p-6">
          <p className="mb-4 flex items-start gap-2 text-sm font-semibold text-primary-darker">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            Are you sure? You will be signed out immediately and lose access to
            your enrollments.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deactivating && <Loader2 size={16} className="animate-spin" />}
              {deactivating ? "Deactivating..." : "Yes, deactivate"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deactivating}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-neutral-darker transition-colors hover:bg-neutral-light-active disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZone;
