export const COLOUR_BUILDER_PRODUCT_LIMIT = 4;

/** Transparent product cutouts (1485×3863). */
export const COLOUR_BUILDER_HERO_SOURCE = { width: 1485, height: 3863 } as const;

export const COLOUR_BUILDER_SLIDES = [
  { match: "hush", image: "/hero-builder-hush.png", background: "#dcbab2" },
  { match: "petal", image: "/hero-builder-petal.png", background: "#f0cac7" },
  { match: "peony", image: "/hero-builder-peony.png", background: "#ecdcdb" },
  { match: "ballet", image: "/hero-builder-ballet.png", background: "#edd2d4" },
] as const;

export function colourBuilderSlideForName(name: string) {
  const lower = name.toLowerCase();
  return COLOUR_BUILDER_SLIDES.find((entry) => lower.includes(entry.match));
}

export function colourBuilderHeroImageForName(name: string): string | null {
  return colourBuilderSlideForName(name)?.image ?? null;
}

export function colourBuilderBackgroundForName(name: string): string {
  return colourBuilderSlideForName(name)?.background ?? "#f5f3f0";
}

export function colourBuilderShadeName(name: string): string {
  const slide = colourBuilderSlideForName(name);
  if (slide) {
    return slide.match.charAt(0).toUpperCase() + slide.match.slice(1);
  }

  return name.replace(/^colour builder gel\s*/i, "").trim() || name;
}

export function isColourBuilderGelProduct(name: string): boolean {
  return name.toLowerCase().includes("colour builder gel");
}

export type ColourBuilderProduct = {
  id: string;
  name: string;
  shadeName: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
  background: string;
  outOfStock?: boolean;
};

export async function fetchColourBuilderProducts(): Promise<ColourBuilderProduct[]> {
  const load = async (query: string) => {
    const res = await fetch(query);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []) as Array<{
      id: string;
      name: string;
      price?: unknown;
      salePrice?: unknown;
      image?: string | null;
      images?: string[];
      outOfStock?: boolean;
    }>;
  };

  const mapProducts = (items: Awaited<ReturnType<typeof load>>) =>
    items
      .filter((product) => product.name.toLowerCase().includes("colour builder gel"))
      .slice(0, COLOUR_BUILDER_PRODUCT_LIMIT)
      .map((product) => {
        const heroImage = colourBuilderHeroImageForName(product.name);
        return {
          id: product.id,
          name: product.name,
          shadeName: colourBuilderShadeName(product.name),
          price: product.price?.toString() || "0",
          salePrice: product.salePrice?.toString() ?? null,
          image: heroImage || product.image || product.images?.[0] || null,
          background: colourBuilderBackgroundForName(product.name),
          outOfStock: product.outOfStock,
        };
      })
      .filter((product) => product.image != null);

  const fromBuilders = mapProducts(
    await load("/api/products?showcasingSection=builders&sortBy=newest&limit=32")
  );
  if (fromBuilders.length > 0) return fromBuilders;

  return mapProducts(
    await load("/api/products?search=Colour%20Builder%20Gel&sortBy=newest&limit=16")
  );
}
