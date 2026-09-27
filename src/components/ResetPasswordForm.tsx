import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import PasswordInput from "./PasswordInput";

interface ResetPasswordData {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordData) => Promise<void>;
}

const ResetPasswordForm = ({ onSubmit }: ResetPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>();

  return (
    <div className="w-full max-w-md bg-neutral-light px-8 py-12 rounded-xl shadow-lg">
      <div className="flex justify-center mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
          <LockKeyhole size={28} aria-hidden="true" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-neutral-darker text-center mb-2">
        Reset password
      </h1>
      <p className="text-center text-neutral-dark mb-8 text-sm">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* New Password Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-semibold text-neutral-darker"
          >
            New Password
          </label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
            placeholder="Enter your new password"
            className="bg-white"
          />
          {errors.newPassword && (
            <span id="newPassword-error" role="alert" className="text-xs text-red-600">
              {errors.newPassword.message}
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
                value === watch("newPassword") || "Passwords do not match",
            })}
            placeholder="Confirm your new password"
            className="bg-white"
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
          className="w-full py-3 mt-2 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-lg rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Resetting..." : "Set New Password"}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="text-center mt-8">
        <span className="text-neutral-darker text-sm">
          Know your Password?{" "}
        </span>
        <Link
          to="/signin"
          className="text-primary font-semibold hover:text-primary-hover transition-colors text-sm"
        >
          Log In
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
