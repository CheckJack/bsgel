const INLINE_MEDIA_PREFIXES = ["data:", "blob:"] as const;

export function isInlineMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return INLINE_MEDIA_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function productImageApiUrl(productId: string, index = 0): string {
  return `/api/products/${encodeURIComponent(productId)}/image?index=${index}`;
}

function toListImageUrl(
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

export function sanitizeProductListImages<
  T extends { id: string; image?: string | null; images?: string[] | null },
>(product: T): T {
  const media = combinedMedia(product.image, product.images);
  const primary = toListImageUrl(product.id, media[0] ?? null, 0);
  const secondary = media[1] ? toListImageUrl(product.id, media[1], 1) : null;

  return {
    ...product,
    image: primary,
    images: secondary ? [secondary] : [],
  };
}

export function sanitizeProductList<
  T extends { id: string; image?: string | null; images?: string[] | null },
>(products: T[]): T[] {
  return products.map(sanitizeProductListImages);
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
