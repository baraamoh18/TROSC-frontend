import { useRef, useState } from "react";
import { Camera, Loader2, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { isDefaultPhoto } from "../../utils/photoUtils";

const MAX_SOURCE_FILE_SIZE_MB = 5;
// The API accepts a base64 photo inside its JSON request body (100 KB max).
// Resize client-side so a normal phone photo can still be used as an avatar.
const MAX_AVATAR_BYTES = 70 * 1024;
const MAX_AVATAR_DIMENSION = 512;

// ── Avatar upload section ─────────────────────────────────────

const compressAvatar = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(
        1,
        MAX_AVATAR_DIMENSION / Math.max(image.width, image.height),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

      let quality = 0.9;
      const encode = (): void => {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= MAX_AVATAR_BYTES || quality <= 0.4) {
          resolve(dataUrl);
          return;
        }
        quality -= 0.1;
        encode();
      };
      encode();
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be read."));
    };
    image.src = objectUrl;
  });

const AvatarUpload = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const displaySrc = preview ?? user.photo ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_SOURCE_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_SOURCE_FILE_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await compressAvatar(file);
      setPreview(dataUrl);
      await uploadPhoto(dataUrl);
    } catch (err) {
      setPreview(null);
      toast.error(
        err instanceof Error ? err.message : "Failed to process the image.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async (dataUrl: string) => {
    try {
      const res = await api.updateMe({ photo: dataUrl });
      setUser(res.data.user);
      setPreview(null); // let the AuthContext photo take over
      toast.success("Profile picture updated!");
    } catch (err) {
      setPreview(null); // revert preview on failure
      toast.error(
        err instanceof Error ? err.message : "Failed to update photo.",
      );
    } finally {
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
          className="text-primary-light"
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
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Camera size={17} aria-hidden="true" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
