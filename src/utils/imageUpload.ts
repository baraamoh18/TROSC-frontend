// Image uploads go straight from the browser to Cloudinary through an
// unsigned upload preset; the API only ever stores the resulting
// https://res.cloudinary.com/... link (already an allowed host).
// Cloud name and preset are public by design (they ship in the bundle);
// the preset limits formats, size and folder on Cloudinary's side.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "d8xhaxa9";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "trosc_images";
const API = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_MB = 15;

export interface UploadedImage {
  url: string;
  /** Lets this browser delete the image for 10 minutes after upload. */
  deleteToken?: string;
}

/**
 * Check, shrink and re-encode an image before upload: at most `maxSide`
 * pixels on the long edge, WebP (JPEG where the browser can't make WebP).
 * Re-encoding also drops EXIF data such as a phone photo's GPS location.
 */
export async function prepareImage(file: File, maxSide = 1600): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > MAX_SOURCE_MB * 1024 * 1024) throw new Error(`The image must be smaller than ${MAX_SOURCE_MB} MB.`);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file couldn't be read as an image.");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("That image couldn't be processed.");
  return jpeg;
}

/** Upload a prepared image; `onProgress` gets 0 to 1. */
export function uploadImage(blob: Blob, onProgress?: (fraction: number) => void): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", blob);
    body.append("upload_preset", UPLOAD_PRESET);

    // XHR rather than fetch, for upload progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { secure_url?: string; delete_token?: string; error?: { message?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve({ url: data.secure_url, deleteToken: data.delete_token });
      } else {
        reject(new Error(data.error?.message ? `Upload failed: ${data.error.message}` : "Upload failed. Try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(body);
  });
}

/** Best-effort removal of an image uploaded in the last 10 minutes. */
export function deleteUploadedImage(deleteToken?: string) {
  if (!deleteToken) return;
  const body = new FormData();
  body.append("token", deleteToken);
  fetch(`${API}/delete_by_token`, { method: "POST", body }).catch(() => {
    // Leaving an unused image behind is harmless
  });
}
