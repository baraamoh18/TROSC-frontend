import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../services/api";
import type { ContactPayload } from "../services/api";
import { useAuth } from "../context/useAuth";

// Value sent when the message isn't about a specific track.
const GENERAL_TRACK = "General inquiry";

type ContactFormInputs = ContactPayload;

const ContactUsForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInputs>({ defaultValues: { track: "" } });
  const { user } = useAuth();
  const [trackTitles, setTrackTitles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getTracks("published=true&limit=100&sort=title")
      .then((res) => {
        if (!cancelled) setTrackTitles(res.data.tracks.map((t) => t.title));
      })
      .catch(() => {
        // Select still offers "General inquiry"
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill name and email for signed-in users without overwriting typing.
  useEffect(() => {
    if (!user) return;
    if (!getValues("username")) setValue("username", user.name);
    if (!getValues("email")) setValue("email", user.email);
  }, [user, getValues, setValue]);

  const onSubmit = async (data: ContactFormInputs) => {
    try {
      const res = await api.submitContact(data);
      toast.success(res.message ?? "Message sent! We'll be in touch soon.");
      reset({ username: user?.name ?? "", email: user?.email ?? "", track: "", phone: "", message: "" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border-2 border-neutral-light-active bg-surface text-sm text-neutral-darker placeholder:text-neutral focus:outline-none focus:border-primary transition-colors duration-200";

  const errorClass = "border-primary-light-active focus:border-primary";

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold text-neutral-darker">Send us a message</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-semibold text-neutral-darker mb-1"
          >
            Name
          </label>
          <input
            id="username"
            autoComplete="name"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "contact-username-error" : undefined}
            type="text"
            placeholder="Your full name"
            className={`${inputBase} ${errors.username ? errorClass : ""}`}
            {...register("username", { required: "Name is required" })}
          />
          {errors.username && (
            <p id="contact-username-error" role="alert" className="mt-1 text-xs text-brand-dark">
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
          <select
            id="track"
            aria-invalid={!!errors.track}
            aria-describedby={errors.track ? "contact-track-error" : undefined}
            className={`${inputBase} cursor-pointer ${errors.track ? errorClass : ""}`}
            {...register("track", { required: "Please choose a track" })}
          >
            <option value="" disabled>
              Choose a track…
            </option>
            {trackTitles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
            <option value={GENERAL_TRACK}>{GENERAL_TRACK}</option>
          </select>
          {errors.track && (
            <p id="contact-track-error" role="alert" className="mt-1 text-xs text-brand-dark">
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
            placeholder="you@example.com"
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
            <p id="contact-email-error" role="alert" className="mt-1 text-xs text-brand-dark">
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
            placeholder="01xxxxxxxxx"
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
            <p id="contact-phone-error" role="alert" className="mt-1 text-xs text-brand-dark">
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
            placeholder="How can we help?"
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
            <p id="contact-message-error" role="alert" className="mt-1 text-xs text-brand-dark">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          id="contact-submit-btn"
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-lg py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactUsForm;
