import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";
import * as api from "../services/api";
import { useAuth } from "../context/useAuth";

// Rough strength score (0–4) used only as a hint; the server decides what
// it accepts.
const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-neutral", "bg-primary", "bg-amber-500", "bg-lime-500", "bg-green-600"];

const passwordStrength = (password: string): number => {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score++;
  return score;
};

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignUpForm() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>();
  const password = watch("password") ?? "";
  const strength = passwordStrength(password);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const res = await api.signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.confirmPassword,
      });
      // Signup sets the auth cookie, so the user is already signed in.
      setUser(res.data.user);
      toast.success(`Welcome to TROSC, ${res.data.user.name}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Sign up failed. Please try again.",
      );
    }
  };

  return (
    <div className="w-full max-w-lg bg-neutral-light px-8 py-12 rounded-3xl shadow-lg font-family-poppins">
      <h1 className="text-4xl font-bold text-neutral-darker text-center mb-8">
        Sign Up
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Full Name Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="name"
            className="text-sm font-semibold text-neutral-darker"
          >
            Full Name
          </label>
          <input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            type="text"
            {...register("name", { required: "Full name is required" })}
            placeholder="Enter your full name"
            className="px-4 py-3 border-2 border-neutral-light-active rounded-full bg-neutral-light text-neutral-darker placeholder-neutral focus:outline-none focus:border-primary transition-colors"
          />
          {errors.name && (
            <span id="name-error" role="alert" className="text-xs text-red-600">{errors.name.message}</span>
          )}
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-neutral-darker"
          >
            Email
          </label>
          <input
            id="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
            })}
            placeholder="Enter your email"
            className="px-4 py-3 border-2 border-neutral-light-active rounded-full bg-neutral-light text-neutral-darker placeholder-neutral focus:outline-none focus:border-primary transition-colors"
          />
          {errors.email && (
            <span id="email-error" role="alert" className="text-xs text-red-600">{errors.email.message}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-neutral-darker"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
            placeholder="Enter your password"
          />
          {password && (
            <div aria-live="polite">
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={`h-1 flex-1 rounded-full ${n <= strength ? STRENGTH_COLORS[strength] : "bg-neutral-light-active"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-dark">
                Password strength: <span className="font-semibold">{STRENGTH_LABELS[strength]}</span>
                {strength < 3 && " — mix upper/lowercase letters, numbers and symbols"}
              </p>
            </div>
          )}
          {errors.password && (
            <span id="password-error" role="alert" className="text-xs text-red-600">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-neutral-darker"
          >
            Confirm Password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === watch("password") || "Passwords do not match",
            })}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span id="confirmPassword-error" role="alert" className="text-xs text-red-600">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-6 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-lg rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="text-center mt-8">
        <span className="text-neutral-darker">Already have an Account? </span>
        <Link
          to="/signin"
          className="text-primary font-semibold hover:text-primary-hover transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default SignUpForm;
