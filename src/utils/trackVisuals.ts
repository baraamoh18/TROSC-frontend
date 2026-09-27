/** The backend's default cover image; treated as "no image" in the UI. */
export const TRACK_PLACEHOLDER_IMAGE = "https://placehold.co/800x400?text=Trosc+Track";

// Brand-red tints only, so tracks without a cover still look like TROSC.
const GRADIENTS = [
  "linear-gradient(135deg, #d32f2f 0%, #7f1d1d 100%)",
  "linear-gradient(135deg, #b92828 0%, #511515 100%)",
  "linear-gradient(135deg, #8b2323 0%, #2b0b0b 100%)",
  "linear-gradient(135deg, #a02222 0%, #3f0f0f 100%)",
  "linear-gradient(135deg, #7a2e2e 0%, #1f1111 100%)",
];

/** Stable fallback gradient for a track, derived from its ObjectId. */
export const trackGradient = (trackId: string): string =>
  GRADIENTS[(parseInt(trackId.slice(-1), 16) || 0) % GRADIENTS.length];

/** Returns the cover image URL, or undefined when it's missing/placeholder. */
export const trackCoverImage = (coverImage?: string): string | undefined =>
  coverImage && coverImage !== TRACK_PLACEHOLDER_IMAGE ? coverImage : undefined;

/** The backend fills empty covers with placehold.co images; treat those as missing. */
export const realImage = (url?: string | null): string | undefined =>
  url && !url.toLowerCase().includes("placehold.co") ? url : undefined;
