const INLINE_MEDIA_PREFIXES = ["data:", "blob:"] as const;

export function isInlineMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return INLINE_MEDIA_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function productImageApiUrl(productId: string, index = 0): string {
  return `/api/products/${encodeURIComponent(productId)}/image?index=${index}`;
}

function toPublicMediaUrl(
  productId: string,
  url: string | null | undefined,
  index: number
): string | null {
  if (!url) return null;
  if (isInlineMediaUrl(url)) return productImageApiUrl(productId, index);
  return url;
}

function combinedMedia(
  image: string | null | undefined,
  images: string[] | null | undefined
): string[] {
  const gallery = images ?? [];
  if (!image) return gallery;
  if (gallery.length === 0 || gallery[0] === image) return [image, ...gallery.slice(1)];
  return [image, ...gallery.filter((item) => item !== image)];
}

/** Keep primary + hover image only — listing cards never need the full gallery. */
export function trimProductListMedia<
  T extends { image?: string | null; images?: string[] | null },
>(product: T, maxMedia = 2): T {
  const media = combinedMedia(product.image, product.images).slice(0, maxMedia);
  return {
    ...product,
    image: media[0] ?? null,
    images: media.slice(1),
  };
}

/** Replace inline data/blob URLs with API URLs; leave file/http URLs as-is. */
export function sanitizeProductListImages<
  T extends { id: string; image?: string | null; images?: string[] | null },
>(product: T): T {
  const media = combinedMedia(product.image, product.images).slice(0, 2);
  const sanitizedMedia = media
    .map((url, index) => toPublicMediaUrl(product.id, url, index))
    .filter((url): url is string => !!url);

  return {
    ...product,
    image: sanitizedMedia[0] ?? null,
    images: sanitizedMedia.slice(1),
  };
}

export function sanitizeProductList<
  T extends { id: string; image?: string | null; images?: string[] | null },
>(products: T[]): T[] {
  return products.map(sanitizeProductListImages);
}

/**
 * Sanitize a product detail payload: rewrite top-level inline image/images to API URLs.
 * Attribute media is left unchanged here (migration converts those to file URLs).
 */
export function sanitizeProductDetail<
  T extends {
    id: string;
    image?: string | null;
    images?: string[] | null;
  },
>(product: T): T {
  return sanitizeProductListImages(product);
}

export function getProductMediaAtIndex(
  image: string | null | undefined,
  images: string[] | null | undefined,
  index: number
): string | null {
  const media = combinedMedia(image, images);
  return media[index] ?? null;
}

export function parseDataUrl(
  dataUrl: string
): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/);
  if (!match?.[2]) return null;

  try {
    return {
      mime: match[1] || "application/octet-stream",
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}
