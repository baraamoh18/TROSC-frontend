import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  logo?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, logo }) => {
  return (
    <div className="relative w-full min-h-screen bg-page lg:bg-page-alt">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-neutral-dark transition-colors hover:text-neutral-darker sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to TROSC
      </Link>
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col items-center justify-center bg-page-alt px-8 py-12">
          <Link to="/" className="text-center">
            <div className="mb-2">
              {logo ? (
                <img src={logo} alt="TROSC Logo" className="w-1 lg:w-[28rem] mx-auto cursor-pointer" />
              ) : (
                <p className="text-5xl lg:text-6xl font-black text-brand mb-2 cursor-pointer">
                  TROSC
                </p>
              )}
            </div>

            {/* Tagline */}
            <h2 className="text-2xl lg:text-3xl font-bold text-neutral-darker uppercase tracking-wider mt-2">
              EACH MOVES OTHERS
            </h2>
          </Link>
        </div>

        {/* Right Section - Form */}
        <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-12 lg:py-0 bg-page lg:bg-page-alt">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
