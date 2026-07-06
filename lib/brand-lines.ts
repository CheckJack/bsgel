export const BRAND_LINE_SLUGS = {
  evo: "evo",
  ethos: "ethos",
  gemini: "gemini",
} as const;

export type BrandLineSlug = (typeof BRAND_LINE_SLUGS)[keyof typeof BRAND_LINE_SLUGS];

/** Display names for admin and DB category labels (Portuguese-first site). */
export const BRAND_LINE_ADMIN_LABELS: Record<BrandLineSlug, string> = {
  evo: "Verniz Gel",
  ethos: "Cuidados das Unhas",
  gemini: "Verniz Tradicional",
};

export const ADMIN_SHOWCASING_SECTIONS = [
  { value: "bases", label: "Bases" },
  { value: "builders", label: "Construtores" },
  { value: "softs", label: "Softs" },
  { value: "extensao", label: "Extensao" },
  { value: "eletronicos", label: "Eletronicos" },
  { value: "promocoes", label: "Promocoes" },
  { value: "solventes", label: "Soluções" },
  { value: "nail-art", label: "Nail Art" },
  { value: "tips", label: "Tips" },
  { value: "utensilios", label: "Utensilios" },
  { value: "pinceis", label: "Pinceis" },
  { value: "lima-buffs", label: "Lima e Buffs" },
  { value: "evo", label: BRAND_LINE_ADMIN_LABELS.evo },
  { value: "ethos", label: BRAND_LINE_ADMIN_LABELS.ethos },
  { value: "gemini", label: BRAND_LINE_ADMIN_LABELS.gemini },
] as const;

export function findCategoryByBrandSlug<
  T extends { slug?: string | null; name?: string | null },
>(categories: T[], slug: BrandLineSlug): T | undefined {
  return categories.find((cat) => cat.slug?.toLowerCase() === slug);
}
