import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LogOut, Settings, UserRound, GraduationCap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../services/api";
import { isDefaultPhoto } from "../utils/photoUtils";

/**
 * Hover dropdown for the navbar's signed-in area, adapted from the
 * pre-styled "tooltip" component and recolored
 * to the TROSC palette: primary red #d32f2f, primary-dark #ae2c2c,
 * neutral greys, Poppins.
 *
 * The pill shows the user's avatar + first name; hovering, focusing or
 * clicking/tapping it reveals three circular icon actions: Profile,
 * Settings, Log out. Escape or a click outside closes it.
 */

const UserDropdown = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const navigate = useNavigate();
  const firstName = user.name.trim().split(/\s+/)[0];
  const isStaff = user.role === "admin" || user.role === "instructor";
  // Placeholder photos (placehold.co etc.) get the initials fallback.
  const showPhoto = !!user.photo && !isDefaultPhoto(user.photo);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Move focus off the menu so :focus-within doesn't keep it visible.
        (document.activeElement as HTMLElement | null)?.blur();
      }
    };
    const handlePointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    action();
  };

  return (
    <StyledWrapper>
      <div ref={containerRef} className={`dropdown-container${open ? " open" : ""}`}>
        <button
          type="button"
          className="dropdown-button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {showPhoto ? (
            <img className="avatar" src={user.photo} alt="" />
          ) : (
            <span className="avatar avatar-fallback">
              {user.role === "admin" ? <Shield size={16} strokeWidth={2.5} /> : user.role === "instructor" ? <GraduationCap size={16} strokeWidth={2.5} /> : <UserRound size={16} strokeWidth={2.5} />}
            </span>
          )}
          <span className="text">{isStaff ? (user.role === "admin" ? "Admin" : "Instructor") : firstName}</span>
        </button>

        <div className="dropdown-content" role="menu">
          <div className="menu-icons">
            <button
              type="button"
              className="menu-icon icon-profile"
              title="My profile"
              aria-label="My profile"
              onClick={() => choose(() => navigate("/dashboard"))}
            >
              <UserRound size={18} />
            </button>
            <button
              type="button"
              className="menu-icon icon-settings"
              title="Settings"
              aria-label="Settings"
              onClick={() => choose(() => navigate("/settings"))}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="menu-icon icon-logout"
              title="Log out"
              aria-label="Log out"
              onClick={() => choose(onLogout)}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .dropdown-container {
    position: relative;
    display: inline-block;
    font-family: "Poppins", sans-serif;
    overflow: visible;
  }

  /* ── Pill button: avatar + first name ── */
  .dropdown-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, #d32f2f, #ae2c2c);
    color: white;
    padding: 7px 16px 7px 8px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition:
      background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
      transform 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 4px 10px rgba(232, 59, 59, 0.25);
    position: relative;
    z-index: 10;
    overflow: hidden;
  }

  .dropdown-button::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(232, 59, 59, 0.4), rgba(174, 44, 44, 0.4));
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: -1;
  }

  .dropdown-button::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
    transform: scale(0);
    transition: transform 0.6s ease-out;
    z-index: -1;
  }

  .dropdown-button:hover::before {
    opacity: 1;
  }

  .dropdown-button:hover::after {
    transform: scale(1);
  }

  .dropdown-button:hover {
    background: linear-gradient(135deg, #ae2c2c, #d32f2f);
    box-shadow: 0 8px 18px rgba(232, 59, 59, 0.35);
    transform: translateY(-2px) scale(1.03);
  }

  .dropdown-button:active {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 0 4px 8px rgba(232, 59, 59, 0.2);
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.7);
    background: white;
  }

  .avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: #d32f2f;
    flex-shrink: 0;
  }

  .text {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: letter-spacing 0.3s ease;
  }

  .dropdown-button:hover .text {
    letter-spacing: 1px;
  }

  /* ── Reveal panel ── */
  .dropdown-content {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    transform: scale(0.8);
    background: white;
    border: 1px solid #e8e8e8;
    border-radius: 15px;
    padding: 14px 16px;
    box-shadow: 0 15px 30px rgba(64, 64, 64, 0.2);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      visibility 0.5s ease;
    z-index: 100;
    pointer-events: none;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }

  /* Arrow pointing at the pill */
  .dropdown-content::before {
    content: "";
    position: absolute;
    top: -10px;
    right: 22px;
    border-width: 0 10px 10px 10px;
    border-style: solid;
    border-color: transparent transparent rgba(255, 255, 255, 0.95) transparent;
    filter: drop-shadow(0 -3px 3px rgba(64, 64, 64, 0.1));
  }

  /* Invisible bridge filling the gap above the panel so the pointer can
     travel from the pill to the icons without the menu closing */
  .dropdown-content::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: 14px;
  }

  .dropdown-container:hover .dropdown-content,
  .dropdown-container:focus-within .dropdown-content,
  .dropdown-container.open .dropdown-content {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
    pointer-events: auto;
  }

  /* ── Circular icon actions ── */
  .menu-icons {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: #f8f8f8;
    color: #525252;
    cursor: pointer;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      background 0.3s ease,
      color 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 4px 8px rgba(64, 64, 64, 0.1);
    position: relative;
    overflow: hidden;
  }

  .menu-icon::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .menu-icon:hover::before {
    opacity: 1;
  }

  .menu-icon svg {
    z-index: 1;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      color 0.3s ease;
  }

  .menu-icon:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 20px rgba(64, 64, 64, 0.15);
  }

  .menu-icon:active {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 5px 10px rgba(64, 64, 64, 0.1);
  }

  .menu-icon:hover svg {
    transform: scale(1.2);
    color: white;
  }

  .icon-profile:hover {
    background: linear-gradient(135deg, #d32f2f, #b92828);
  }

  .icon-admin:hover {
    background: linear-gradient(135deg, #8b2323, #511515);
  }

  .icon-instructor:hover {
    background: linear-gradient(135deg, #d97706, #b45309);
  }

  .icon-settings:hover {
    background: linear-gradient(135deg, #6d6d6d, #525252);
  }

  .icon-logout:hover {
    background: linear-gradient(135deg, #ae2c2c, #8b2323);
  }

  /* ── Accessibility ── */
  .dropdown-button:focus {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(232, 59, 59, 0.5),
      0 4px 10px rgba(232, 59, 59, 0.25);
  }

  .dropdown-button:focus:not(:focus-visible) {
    box-shadow: 0 4px 10px rgba(232, 59, 59, 0.25);
  }

  .menu-icon:focus-visible {
    outline: 2px solid #d32f2f;
    outline-offset: 2px;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .dropdown-button {
      padding: 6px 14px 6px 7px;
    }

    .text {
      font-size: 13px;
    }

    .menu-icon {
      width: 36px;
      height: 36px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dropdown-button,
    .dropdown-content,
    .menu-icon,
    .menu-icon svg,
    .text {
      transition: none;
    }
  }
`;

export default UserDropdown;
