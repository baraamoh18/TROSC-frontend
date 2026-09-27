import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { smallBtn } from "./studioUi";

interface ConfirmActionProps {
  label: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  /** Red styling for destructive actions. */
  danger?: boolean;
  disabled?: boolean;
}

/** Two-step button: the first click asks, a second click within 4s acts. */
const ConfirmAction = ({ label, confirmLabel, onConfirm, danger = true, disabled }: ConfirmActionProps) => {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const timer = setTimeout(() => setAsking(false), 4000);
    return () => clearTimeout(timer);
  }, [asking]);

  const tone = danger
    ? asking
      ? "bg-red-700 text-white hover:bg-red-800"
      : "text-red-700 hover:bg-red-50"
    : asking
      ? "bg-gray-900 text-white hover:bg-black"
      : "text-gray-700 hover:bg-gray-100";

  const handleClick = async () => {
    if (!asking) {
      setAsking(true);
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={disabled || busy} className={`${smallBtn} ${tone}`}>
      {busy && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
      {asking ? confirmLabel : label}
    </button>
  );
};

export default ConfirmAction;
