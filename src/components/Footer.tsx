import { Link } from "react-router-dom";
import React from "react";
import TroscLogo from "../../assets/Trosc4x.webp";

const MailIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-3 text-white/70"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-3 text-white/70"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer
      id="contact"
      className="bg-primary-darker text-white/80 py-12 px-8 font-sans"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo */}
          <div className="md:col-span-1 flex items-start">
            <img loading="lazy" src={TroscLogo} alt="Trosc Logo" className="h-30 w-auto" />
          </div>

          {/* Column 2: About Us */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">About Us</h3>
            <p className="text-sm leading-relaxed text-white/70">
              TROSC is a student team at the Faculty of Computers and Information
              that runs learning tracks, sessions and events.
            </p>
          </div>

          {/* Column 3: Contact Us */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center">
                <MailIcon />
                <a
                  href="mailto:troscscu2@gmail.com"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  troscscu2@gmail.com
                </a>
              </li>
              <li className="flex items-center">
                <PhoneIcon />
                <a href="tel:+201201864338" className="text-white/70 hover:text-white transition-colors">
                  01201864338
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Explore */}
          <nav aria-label="Footer" className="md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/explore", label: "Explore" },
                { to: "/#events", label: "Events" },
                { to: "/contact", label: "Contact us" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} TROSC. A student team at the Faculty of Computers and Information, Suez Canal
            University.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link to="/privacy" className="inline-flex min-h-8 items-center hover:text-white transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="inline-flex min-h-8 items-center hover:text-white transition-colors">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
