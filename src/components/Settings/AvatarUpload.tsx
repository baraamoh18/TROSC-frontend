import { useRef, useState } from "react";
import { Camera, Loader2, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { isDefaultPhoto } from "../../utils/photoUtils";
import { ACCEPTED_TYPES, deleteUploadedImage, prepareImage, uploadImage } from "../../utils/imageUpload";

// Avatars are shown at 96px at most; 512px covers sharp high-DPI screens.
const AVATAR_SIDE = 512;

const AvatarUpload = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const displaySrc = preview ?? user.photo ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setUploading(true);
    let deleteToken: string | undefined;
    try {
      const blob = await prepareImage(file, AVATAR_SIDE);
      setPreview(URL.createObjectURL(blob));
      const uploaded = await uploadImage(blob);
      deleteToken = uploaded.deleteToken;
      const res = await api.updateMe({ photo: uploaded.url });
      setUser(res.data.user);
      toast.success("Profile picture updated");
    } catch (err) {
      // The upload is useless if the profile didn't take it
      deleteUploadedImage(deleteToken);
      toast.error(err instanceof Error ? err.message : "Couldn't update your photo. Try again.");
    } finally {
      setPreview((url) => {
        if (url) URL.revokeObjectURL(url);
        return null; // the saved photo from AuthContext takes over
      });
      setUploading(false);
    }
  };

  return (
    <div className="relative h-24 w-24 shrink-0">
      {/* Avatar */}
      {displaySrc && !isDefaultPhoto(displaySrc) ? (
        <img
          src={displaySrc}
          alt={user.name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-light shadow-md"
        />
      ) : (
        <UserCircle
          size={96}
          className="text-brand-light"
          strokeWidth={1}
        />
      )}

      {/* Upload spinner overlay */}
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
          <Loader2 size={24} className="text-white animate-spin" />
        </div>
      )}

      {/* The visible camera control works equally well on mouse and touch devices. */}
      {!uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change profile picture"
          title="Change profile picture"
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Camera size={17} aria-hidden="true" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
