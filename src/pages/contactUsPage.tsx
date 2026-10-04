import React from "react";
import { Phone, Mail } from "lucide-react";
import ContactUsForm from "../components/ContactUsForm";
import usePageTitle from "../hooks/usePageTitle";

const ContactUsPage: React.FC = () => {
  usePageTitle("Contact us");
  return (
    <div className="min-h-screen bg-neutral-light-hover pt-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          <div className="lg:w-5/12 flex flex-col">


            <h1 className="font-bold text-4xl md:text-5xl leading-tight text-neutral-darker mt-8 mb-6">
              Contact us
            </h1>

            <p className="text-lg md:text-xl leading-relaxed text-neutral-dark-active mb-6 max-w-md">
              Questions about a track, an event, or joining TROSC? Send us a
              message, call, or email and a team member will get back to you.
            </p>

            <div className="flex flex-col gap-4">

              <a
                href="tel:+201201864338"
                className="flex items-center gap-3 group w-fit"
                aria-label="Call us"
              >
                <span className="flex items-center justify-center w-7 h-7 text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  <Phone size={22} strokeWidth={2} />
                </span>
                <span className="font-semibold text-base text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  01201864338
                </span>
              </a>

              <a
                href="mailto:troscscu2@gmail.com"
                className="flex items-center gap-3 group w-fit"
                aria-label="Email us"
              >
                <span className="flex items-center justify-center w-7 h-7 text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  <Mail size={22} strokeWidth={2} />
                </span>
                <span className="font-semibold text-base text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  troscscu2@gmail.com
                </span>
              </a>
            </div>
          </div>

          <div className="lg:w-7/12">
            <ContactUsForm />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
