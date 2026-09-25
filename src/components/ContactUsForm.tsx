import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../services/api";
import type { ContactPayload } from "../services/api";

type ContactFormInputs = ContactPayload;

const ContactUsForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInputs>();

  const onSubmit = async (data: ContactFormInputs) => {
    try {
      const res = await api.submitContact(data);
      toast.success(res.message ?? "Message sent! We'll be in touch soon.");
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 rounded-2xl border-2 border-neutral-light-active bg-white text-sm text-neutral-darker placeholder:text-neutral focus:outline-none focus:border-primary transition-colors duration-200";

  const errorClass = "border-primary-light-active focus:border-primary";

  return (
    <div className="w-full">
      <p className="font-semibold text-2xl md:text-3xl leading-normal text-neutral-darker mb-1">
        We'd love to hear from you!
      </p>
      <p className="font-semibold text-2xl md:text-3xl leading-normal text-neutral-darker mb-4">
        Let's get in touch
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "contact-username-error" : undefined}
            type="text"
            placeholder="Enter your username"
            className={`${inputBase} ${errors.username ? errorClass : ""}`}
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <p id="contact-username-error" role="alert" className="mt-1 text-xs text-primary-dark">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="track"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Track
          </label>
          <input
            id="track"
            aria-invalid={!!errors.track}
            aria-describedby={errors.track ? "contact-track-error" : undefined}
            type="text"
            placeholder="Enter your track"
            className={`${inputBase} ${errors.track ? errorClass : ""}`}
            {...register("track", { required: "Track is required" })}
          />
          {errors.track && (
            <p id="contact-track-error" role="alert" className="mt-1 text-xs text-primary-dark">
              {errors.track.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Email
          </label>
          <input
            id="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            type="email"
            placeholder="Enter your email"
            className={`${inputBase} ${errors.email ? errorClass : ""}`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className="mt-1 text-xs text-primary-dark">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Phone Number
          </label>
          <input
            id="phone"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            type="tel"
            placeholder="Enter your phone num"
            className={`${inputBase} ${errors.phone ? errorClass : ""}`}
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9+\s\-()]{7,15}$/,
                message: "Please enter a valid phone number",
              },
            })}
          />
          {errors.phone && (
            <p id="contact-phone-error" role="alert" className="mt-1 text-xs text-primary-dark">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Your Message
          </label>
          <textarea
            id="message"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            rows={4}
            placeholder="Enter your message Here..."
            className={`${inputBase} resize-none ${errors.message ? errorClass : ""}`}
            {...register("message", {
              required: "Message is required",
              minLength: {
                value: 10,
                message: "Message must be at least 10 characters",
              },
            })}
          />
          {errors.message && (
            <p id="contact-message-error" role="alert" className="mt-1 text-xs text-primary-dark">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          id="contact-submit-btn"
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-lg py-3 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactUsForm;
