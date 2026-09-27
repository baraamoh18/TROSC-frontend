import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";

interface ProfileFormData {
  name: string;
  bio: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
}

const inputClasses =
  "px-4 py-3 border-2 border-neutral-light-active rounded-lg bg-neutral-light text-neutral-darker placeholder-neutral focus:outline-none focus:border-primary transition-colors";

const ProfileForm = () => {
  const { user, setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    values: {
      name: user?.name ?? "",
      bio: user?.bio ?? "",
      website: user?.website ?? "",
      twitter: user?.socialMedia?.twitter ?? "",
      linkedin: user?.socialMedia?.linkedin ?? "",
      github: user?.socialMedia?.github ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const res = await api.updateMe({
        name: data.name.trim(),
        bio: data.bio.trim() || undefined,
        website: data.website.trim() || undefined,
        socialMedia: {
          twitter: data.twitter.trim() || undefined,
          linkedin: data.linkedin.trim() || undefined,
          github: data.github.trim() || undefined,
        },
      });
      setUser(res.data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-darker">
          Profile information
        </h2>
        <p className="mt-1 text-sm text-neutral-dark">
          Update your public profile details.
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-sm font-semibold text-neutral-darker"
        >
          Full name
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Name is required" })}
          placeholder="Your name"
          className={inputClasses}
        />
        {errors.name && (
          <span className="text-xs text-red-600">{errors.name.message}</span>
        )}
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="bio"
          className="text-sm font-semibold text-neutral-darker"
        >
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          {...register("bio")}
          placeholder="Tell the community a little about yourself..."
          className="px-4 py-3 border-2 border-neutral-light-active rounded-lg bg-neutral-light text-neutral-darker placeholder-neutral focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Website */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="website"
          className="text-sm font-semibold text-neutral-darker"
        >
          Website
        </label>
        <input
          id="website"
          type="url"
          {...register("website", {
            pattern: {
              value: /^https?:\/\/.+/i,
              message: "Must be a full URL starting with http(s)://",
            },
          })}
          placeholder="https://your-portfolio.com"
          className={inputClasses}
        />
        {errors.website && (
          <span className="text-xs text-red-600">{errors.website.message}</span>
        )}
      </div>

      {/* Social links */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold text-neutral-darker mb-1">
          Social links
        </legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="twitter" className="text-sm text-neutral-dark">
            Twitter / X
          </label>
          <input
            id="twitter"
            type="text"
            {...register("twitter")}
            placeholder="https://x.com/username"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="linkedin" className="text-sm text-neutral-dark">
            LinkedIn
          </label>
          <input
            id="linkedin"
            type="text"
            {...register("linkedin")}
            placeholder="https://linkedin.com/in/username"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="github" className="text-sm text-neutral-dark">
            GitHub
          </label>
          <input
            id="github"
            type="text"
            {...register("github")}
            placeholder="https://github.com/username"
            className={inputClasses}
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={18} className="animate-spin" />}
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
};

export default ProfileForm;
