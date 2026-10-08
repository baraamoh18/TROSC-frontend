import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import PasswordInput from "../PasswordInput";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";

interface SecurityFormData {
  passwordCurrent: string;
  password: string;
  passwordConfirm: string;
}

const SecurityForm = () => {
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SecurityFormData>();

  const onSubmit = async (data: SecurityFormData) => {
    try {
      const res = await api.updateMyPassword({
        passwordCurrent: data.passwordCurrent,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      });
      // The backend may issue a fresh session/user payload with the response.
      if (res.data?.user) setUser(res.data.user);
      reset();
      toast.success("Password updated successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-darker">
          Change password
        </h2>
        <p className="mt-1 text-sm text-neutral-dark">
          Use at least 8 characters. You'll stay signed in after the change.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="passwordCurrent"
          className="text-sm font-semibold text-neutral-darker"
        >
          Current password
        </label>
        <PasswordInput
          id="passwordCurrent"
          autoComplete="current-password"
          {...register("passwordCurrent", {
            required: "Current password is required",
          })}
          placeholder="Enter your current password"
        />
        {errors.passwordCurrent && (
          <span className="text-xs text-danger-ink">
            {errors.passwordCurrent.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-neutral-darker"
        >
          New password
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password", {
            required: "New password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
          placeholder="Enter a new password"
        />
        {errors.password && (
          <span className="text-xs text-danger-ink">{errors.password.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="passwordConfirm"
          className="text-sm font-semibold text-neutral-darker"
        >
          Confirm new password
        </label>
        <PasswordInput
          id="passwordConfirm"
          autoComplete="new-password"
          {...register("passwordConfirm", {
            required: "Please confirm your new password",
            validate: (value, formValues) =>
              value === formValues.password || "Passwords do not match",
          })}
          placeholder="Repeat the new password"
        />
        {errors.passwordConfirm && (
          <span className="text-xs text-danger-ink">
            {errors.passwordConfirm.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={18} className="animate-spin" />}
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
};

export default SecurityForm;
