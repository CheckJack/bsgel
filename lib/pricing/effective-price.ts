export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveEffectiveUnitPrice(
  price: unknown,
  salePrice?: unknown
): number {
  const base = toNumberOrNull(price) ?? 0;
  const sale = toNumberOrNull(salePrice);

  // Ignore missing/zero salePrice — null was previously serialized as "0" in cart
  // payloads and incorrectly treated as a free discount.
  if (sale !== null && sale > 0 && sale < base) {
    return sale;
  }

  return base;
}
