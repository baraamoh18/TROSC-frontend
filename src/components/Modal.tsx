import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  onClose: () => void;
  /** id of the element that names the dialog (usually its heading). */
  labelledBy?: string;
  /** Fallback accessible name when there is no visible heading. */
  label?: string;
  /** Classes for the dialog panel (width, padding, layout). */
  className?: string;
  children: ReactNode;
}

/**
 * Accessible modal dialog: closes on Escape and backdrop click, locks page
 * scroll, keeps Tab focus inside the dialog, and returns focus to the
 * element that opened it. On phones it is a bottom sheet (full width,
 * slides up, buttons within thumb reach); from sm up a centred dialog.
 */
const Modal = ({ onClose, labelledBy, label, className = "", children }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];

    // Focus the first form field if there is one, otherwise the panel.
    const firstField = panel?.querySelector<HTMLElement>("input, select, textarea");
    (firstField ?? panel)?.focus();

    // Popups opened from the form (date picker, menus) are portalled outside
    // the panel and handle their own Escape and Tab; Escape there should close
    // only the popup, not the whole form. They may already be gone by the time
    // the key reaches handleKey, so note it on the way down (capture phase).
    const fromPopup = new WeakSet<KeyboardEvent>();
    const notePopupKey = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-radix-popper-content-wrapper]")) fromPopup.add(e);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (fromPopup.has(e)) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", notePopupKey, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", notePopupKey, true);
      document.removeEventListener("keydown", handleKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        className={`anim-sheet w-full rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl focus:outline-none sm:rounded-xl sm:pb-0 ${className} max-sm:max-h-[92dvh] max-sm:max-w-none`}
      >
        {/* Grab bar: marks the sheet on phones */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden" />
        {children}
      </div>
    </div>
  );
};

export default Modal;
