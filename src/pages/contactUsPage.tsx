import React from "react";
import { Phone, Mail } from "lucide-react";
import ContactUsForm from "../components/ContactUsForm";

const ContactUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-light-hover pt-20 font-family-poppins">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          <div className="lg:w-5/12 flex flex-col">


            <h1 className="font-bold text-4xl md:text-5xl leading-tight text-neutral-darker mt-8 mb-6">
              Get in Touch
            </h1>

            <h2 className="font-semibold text-2xl text-neutral-darker mb-4">
              Contact Us
            </h2>

            <p className="text-lg md:text-xl leading-relaxed text-neutral-dark-active mb-6 max-w-md">
              Got a question or an idea? We're more than a team — we're a family
              that listens and supports. Reach out anytime, and let's turn your
              message into the start of something great.
            </p>

            <div className="flex flex-col gap-4">

              <a
                href="tel:01023456789"
                className="flex items-center gap-3 group w-fit"
                aria-label="Call us"
              >
                <span className="flex items-center justify-center w-7 h-7 text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  <Phone size={22} strokeWidth={2} />
                </span>
                <span className="font-semibold text-base text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  01023456789
                </span>
              </a>

              <a
                href="mailto:trosc@gmail.com"
                className="flex items-center gap-3 group w-fit"
                aria-label="Email us"
              >
                <span className="flex items-center justify-center w-7 h-7 text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  <Mail size={22} strokeWidth={2} />
                </span>
                <span className="font-semibold text-base text-neutral-darker group-hover:text-primary transition-colors duration-200">
                  trosc@gmail.com
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
