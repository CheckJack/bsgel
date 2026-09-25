export const BLOG_PRODUCT_GRID_ATTR = "data-blog-product-grid";

export const MIN_BLOG_PRODUCT_GRID_COUNT = 1;
export const MAX_BLOG_PRODUCT_GRID_COUNT = 6;

export type BlogProductGridAttrs = {
  productIds: string[];
  columns: number;
};

export type BlogContentPart =
  | { type: "html"; content: string }
  | ({ type: "grid" } & BlogProductGridAttrs);

const GRID_TAG_REGEX =
  /<div\b[^>]*\bdata-blog-product-grid\b[^>]*>\s*<\/div>/gi;

function decodeHtmlEntities(value: string): string {
  let decoded = value;
  for (let i = 0; i < 5; i++) {
    const next = decoded
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

export function parseProductIdsAttr(raw: string | null | undefined): string[] {
  if (!raw) return [];

  const decoded = decodeHtmlEntities(raw.trim());
  if (!decoded) return [];

  if (decoded.startsWith("[")) {
    try {
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
      }
    } catch {
      // Fall through to comma-separated parsing.
    }
  }

  return decoded
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function formatProductIdsAttr(productIds: string[]): string {
  return productIds.filter(Boolean).join(",");
}

export function columnsForProductCount(count: number): number {
  const safeCount = Math.max(MIN_BLOG_PRODUCT_GRID_COUNT, Math.min(MAX_BLOG_PRODUCT_GRID_COUNT, count));
  if (safeCount <= 1) return 1;
  if (safeCount === 2) return 2;
  if (safeCount === 3) return 3;
  if (safeCount === 4) return 2;
  return 3;
}

export function gridColumnClass(columns: number): string {
  switch (columns) {
    case 1:
      return "grid-cols-1";
    case 3:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case 2:
    default:
      return "grid-cols-1 sm:grid-cols-2";
  }
}

export function parseGridElementMarkup(markup: string): BlogProductGridAttrs {
  const idsMatch = markup.match(/data-product-ids=(?:"([^"]*)"|'([^']*)')/i);
  const columnsMatch = markup.match(/data-columns=(?:"(\d+)"|'(\d+)')/i);

  const productIds = parseProductIdsAttr(idsMatch?.[1] ?? idsMatch?.[2] ?? null);
  const columns = parseInt(columnsMatch?.[1] ?? columnsMatch?.[2] ?? "2", 10);

  return {
    productIds,
    columns: Number.isFinite(columns) ? columns : columnsForProductCount(productIds.length || 2),
  };
}

export function parseBlogContent(html: string): BlogContentPart[] {
  if (!html?.trim()) return [];

  const parts: BlogContentPart[] = [];
  let lastIndex = 0;
  const regex = new RegExp(GRID_TAG_REGEX.source, GRID_TAG_REGEX.flags);
  let match = regex.exec(html);

  while (match) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "html", content: html.slice(lastIndex, index) });
    }
    parts.push({ type: "grid", ...parseGridElementMarkup(match[0]) });
    lastIndex = index + match[0].length;
    match = regex.exec(html);
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", content: html.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "html", content: html });
  }

  return parts;
}

export function serializeBlogProductGrid(attrs: BlogProductGridAttrs): string {
  const productIds = attrs.productIds.filter(Boolean);
  const columns = attrs.columns || columnsForProductCount(productIds.length || 2);

  return `<div ${BLOG_PRODUCT_GRID_ATTR}="" data-product-ids="${formatProductIdsAttr(productIds)}" data-columns="${columns}" class="blog-product-grid"></div>`;
}
