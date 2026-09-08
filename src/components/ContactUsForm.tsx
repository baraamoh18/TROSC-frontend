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
    "w-full px-4 py-2.5 rounded-2xl border border-black/30 bg-transparent font-[Poppins] text-sm text-gray-800 placeholder:text-black/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200";

  const errorClass = "border-red-400 focus:border-red-500 focus:ring-red-200";

  return (
    <div className="w-full">
      <p className="font-[Poppins] font-semibold text-[30px] leading-[1.5] text-black mb-1">
        We'd love to hear from you!
      </p>
      <p className="font-[Poppins] font-semibold text-[30px] leading-[1.5] text-black mb-4">
        Let's get in touch
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block font-[Poppins] text-sm font-normal text-black mb-1"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            className={`${inputBase} ${errors.username ? errorClass : ""}`}
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500 font-[Poppins]">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="track"
            className="block font-[Poppins] text-sm font-normal text-black mb-1"
          >
            Track
          </label>
          <input
            id="track"
            type="text"
            placeholder="Enter your track"
            className={`${inputBase} ${errors.track ? errorClass : ""}`}
            {...register("track", { required: "Track is required" })}
          />
          {errors.track && (
            <p className="mt-1 text-xs text-red-500 font-[Poppins]">
              {errors.track.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block font-[Poppins] text-sm font-normal text-black mb-1"
          >
            Email
          </label>
          <input
            id="email"
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
            <p className="mt-1 text-xs text-red-500 font-[Poppins]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block font-[Poppins] text-sm font-normal text-black mb-1"
          >
            Phone Number
          </label>
          <input
            id="phone"
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
            <p className="mt-1 text-xs text-red-500 font-[Poppins]">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="message"
            className="block font-[Poppins] text-sm font-normal text-black mb-1"
          >
            Your Message
          </label>
          <textarea
            id="message"
            rows={4}
            placeholder="Enter your message Here..."
            className={`${inputBase} resize-none bg-[#EAEAEA] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.25)] border-black/10 rounded-[20px] ${errors.message ? errorClass : ""}`}
            {...register("message", {
              required: "Message is required",
              minLength: {
                value: 10,
                message: "Message must be at least 10 characters",
              },
            })}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-500 font-[Poppins]">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          id="contact-submit-btn"
          className="w-full flex items-center justify-center gap-3 bg-[#D41132] text-white font-[Poppins] font-bold text-[20px] leading-[1.5] py-3 rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactUsForm;
