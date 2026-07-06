export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
};

let categoriesCache: ShopCategory[] | null = null;
let categoriesPromise: Promise<ShopCategory[]> | null = null;

export async function fetchShopCategories(): Promise<ShopCategory[]> {
  if (categoriesCache) {
    return categoriesCache;
  }

  if (!categoriesPromise) {
    categoriesPromise = fetch("/api/categories?lite=1")
      .then((res) => (res.ok ? res.json() : { categories: [] as ShopCategory[] }))
      .then((data: { categories?: ShopCategory[] }) => {
        const categories = data.categories ?? [];
        categoriesCache = categories;
        return categories;
      })
      .catch(() => {
        categoriesCache = [];
        return [] as ShopCategory[];
      })
      .finally(() => {
        categoriesPromise = null;
      });
  }

  return categoriesPromise;
}
