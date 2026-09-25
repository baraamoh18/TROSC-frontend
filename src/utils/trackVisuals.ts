/** The backend's default cover image; treated as "no image" in the UI. */
export const TRACK_PLACEHOLDER_IMAGE = "https://placehold.co/800x400?text=Trosc+Track";

const GRADIENTS = [
  "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
  "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
  "linear-gradient(135deg, #16a34a 0%, #14532d 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)",
  "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
];

/** Stable fallback gradient for a track, derived from its ObjectId. */
export const trackGradient = (trackId: string): string =>
  GRADIENTS[(parseInt(trackId.slice(-1), 16) || 0) % GRADIENTS.length];

/** Returns the cover image URL, or undefined when it's missing/placeholder. */
export const trackCoverImage = (coverImage?: string): string | undefined =>
  coverImage && coverImage !== TRACK_PLACEHOLDER_IMAGE ? coverImage : undefined;
