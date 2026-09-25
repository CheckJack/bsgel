import { getProductList } from "@/lib/products/get-product-list";
import { db } from "@/lib/db";
import { ProductsPageClient } from "./products-page-client";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const categoryId = firstParam(searchParams.categoryId) || null;
  const search = firstParam(searchParams.search);
  const minPrice = firstParam(searchParams.minPrice);
  const maxPrice = firstParam(searchParams.maxPrice);
  const sortBy = firstParam(searchParams.sortBy) || "newest";
  const featured = firstParam(searchParams.featured) === "true";
  const page = parseInt(firstParam(searchParams.page) || "1", 10) || 1;

  const [list, categories] = await Promise.all([
    getProductList({
      categoryId,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      sortBy,
      featured,
      page,
      limit: 12,
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProductsPageClient
      initialProducts={list.products}
      initialPage={list.pagination.page}
      initialTotalPages={list.pagination.totalPages}
      initialTotal={list.pagination.total}
      initialCategories={categories}
      initialCategoryId={categoryId}
      initialSearch={search}
      initialMinPrice={minPrice}
      initialMaxPrice={maxPrice}
      initialSortBy={sortBy}
      initialFeatured={featured}
    />
  );
}
