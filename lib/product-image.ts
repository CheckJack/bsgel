/** Strip embedded base64/blob URLs from list payloads (can be MB per row). */
export function imageForListPayload(image: string | null | undefined): {
  image: string | null;
  hasImage: boolean;
} {
  if (!image) return { image: null, hasImage: false };
  if (
    image.startsWith("/") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return { image, hasImage: true };
  }
  return { image: null, hasImage: true };
}
