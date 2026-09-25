import type { Metadata } from "next";

const SITE_NAME = "Bio Sculpture";
const TITLE_MAX = 65;
const DESC_MAX = 160;

function truncate(text: string, max: number) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSiteOrigin() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "";
  return base.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  const origin = getSiteOrigin();
  if (!origin) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildProductMetadata(product: {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  images?: string[];
}): Metadata {
  const title = truncate(`${product.name} | ${SITE_NAME}`, TITLE_MAX);
  const description = truncate(
    stripHtml(product.description) ||
      `Compre ${product.name} na Bio Sculpture — produtos profissionais para unhas, salões e técnicas certificadas.`,
    DESC_MAX
  );
  const canonicalPath = `/products/${encodeURIComponent(product.slug || product.id)}`;
  const canonical = absoluteUrl(canonicalPath);
  const ogImage = product.image || product.images?.[0] || undefined;
  const ogImageAbs = ogImage ? absoluteUrl(ogImage) : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      ...(ogImageAbs ? { images: [{ url: ogImageAbs, alt: product.name }] } : {}),
    },
    twitter: {
      card: ogImageAbs ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImageAbs ? { images: [ogImageAbs] } : {}),
    },
  };
}

export function buildProductJsonLd(product: {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: unknown;
  salePrice?: unknown | null;
  image?: string | null;
  images?: string[];
  outOfStock?: boolean;
  rating?: number;
  reviewCount?: number;
  category?: { name: string } | null;
}) {
  const origin = getSiteOrigin() || "https://biosculpture.pt";
  const url = `${origin}/products/${encodeURIComponent(product.slug || product.id)}`;
  const images = [
    ...(product.image ? [absoluteUrl(product.image)] : []),
    ...((product.images || []).map((src) => absoluteUrl(src)) || []),
  ].filter(Boolean);
  const priceRaw = product.salePrice ?? product.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw.toFixed(2)
      : String(priceRaw ?? "").replace(",", ".");

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description) || undefined,
    sku: product.id,
    url,
    image: images.length ? images : undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category?.name || undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: price || undefined,
      availability: product.outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.reviewCount && product.reviewCount > 0 && product.rating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating).toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return jsonLd;
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  const origin = getSiteOrigin() || "https://biosculpture.pt";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}
