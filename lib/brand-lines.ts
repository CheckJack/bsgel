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
  gemini: "Verniz Clássico",
};

/**
 * DB category slugs that map to each brand-line route.
 * Routes keep /evo, /ethos, /gemini for SEO; categories were renamed
 * (e.g. Verniz Gel → slug verniz-gel).
 */
export const BRAND_LINE_CATEGORY_SLUGS: Record<BrandLineSlug, string[]> = {
  evo: ["verniz-gel", "evo"],
  ethos: ["ethos", "cuidados-das-unhas"],
  gemini: ["verniz-clssico", "verniz-classico", "gemini"],
};

/** Loose name matchers when slug aliases miss (accents / trailing spaces). */
const BRAND_LINE_NAME_MATCHERS: Record<BrandLineSlug, RegExp> = {
  evo: /verniz\s*gel/i,
  ethos: /cuidado|ethos/i,
  gemini: /verniz\s*cl[aá]ssico|gemini/i,
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
  const aliases = BRAND_LINE_CATEGORY_SLUGS[slug] || [slug];
  const bySlug = categories.find((cat) => {
    const catSlug = cat.slug?.toLowerCase().trim();
    return !!catSlug && aliases.includes(catSlug);
  });
  if (bySlug) return bySlug;

  const nameMatcher = BRAND_LINE_NAME_MATCHERS[slug];
  if (!nameMatcher) return undefined;
  return categories.find((cat) => nameMatcher.test(cat.name || ""));
}
