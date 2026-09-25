/** Shape used by the landing-page track cards (mapped from BackendTrack). */
export interface TrackItem {
  id: string;
  /** Cover image URL. When absent, `gradient` is used instead. */
  imageUrl?: string;
  /** CSS gradient string used as the card header when there is no image. */
  gradient: string;
  title: string;
  description: string;
}
