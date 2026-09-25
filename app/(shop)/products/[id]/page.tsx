import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProductSeoByParam } from "@/lib/products/resolve";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
} from "@/lib/seo/product-seo";
import { productPath } from "@/lib/products/paths";
import {
  ProductDetailClient,
  type ProductDetailData,
} from "./product-detail-client";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadProductDetail(param: string): Promise<{
  product: ProductDetailData;
  matchedBy: "slug" | "id";
} | null> {
  const resolved = await getProductSeoByParam(param);
  if (!resolved) return null;

  const full = await db.product.findUnique({
    where: { id: resolved.product.id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      image: true,
      images: true,
      attributes: true,
      outOfStock: true,
      hemaFree: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!full) return null;

  let rating = 0;
  let reviewCount = 0;
  try {
    const stats = await db.$queryRaw<
      Array<{ reviewCount: bigint; avgRating: number }>
    >`
      SELECT
        COUNT(*)::int as "reviewCount",
        COALESCE(AVG(rating)::float, 0) as "avgRating"
      FROM "ProductReview"
      WHERE "productId" = ${full.id}
        AND status = 'APPROVED'
    `;
    reviewCount = Number(stats[0]?.reviewCount || 0);
    rating = Number(stats[0]?.avgRating || 0);
  } catch {
    // reviews optional
  }

  return {
    matchedBy: resolved.matchedBy,
    product: {
      id: full.id,
      slug: full.slug,
      name: full.name,
      description: full.description,
      price: String(full.price),
      salePrice: full.salePrice != null ? String(full.salePrice) : null,
      image: full.image,
      images: full.images || [],
      attributes: (full.attributes as ProductDetailData["attributes"]) || undefined,
      category: full.category,
      outOfStock: full.outOfStock,
      hemaFree: full.hemaFree,
      rating,
      reviewCount,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const resolved = await getProductSeoByParam(id);
  if (!resolved) {
    return { title: "Product not found | Bio Sculpture", robots: { index: false } };
  }
  return buildProductMetadata(resolved.product);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id: param } = await params;
  const loaded = await loadProductDetail(param);

  if (!loaded) {
    notFound();
  }

  const { product, matchedBy } = loaded;

  // Canonical URL is the slug. Old ID URLs permanently redirect.
  if (matchedBy === "id" && product.slug && product.slug !== param) {
    permanentRedirect(productPath(product));
  }

  const productJsonLd = buildProductJsonLd({
    ...product,
    slug: product.slug || product.id,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Produtos", path: "/products" },
    ...(product.category
      ? [{ name: product.category.name, path: `/products?categoryId=${product.category.id}` }]
      : []),
    { name: product.name, path: productPath(product) },
  ]);

  // Server-rendered summary for crawlers (client hydrates the full interactive PDP).
  const plainDescription =
    (product.description || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280) || `${product.name} — produto profissional Bio Sculpture.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="sr-only" aria-hidden={false}>
        <h1>{product.name}</h1>
        <p>{plainDescription}</p>
        <p>
          Price: €{product.salePrice || product.price}
          {product.outOfStock ? " (esgotado)" : ""}
        </p>
        {product.category ? <p>Category: {product.category.name}</p> : null}
      </article>
      <ProductDetailClient initialProduct={product} paramKey={param} />
    </>
  );
}
