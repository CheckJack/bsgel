import { db } from "@/lib/db"

export interface TaxCalculationResult {
  taxAmount: number
  taxRate: number
  taxRegion: string
}

/**
 * Normalizes a Portuguese postal code to a format suitable for pattern matching
 * Handles both "XXXX-XXX" and "XXXXXXX" formats
 */
function normalizePostalCode(postalCode: string): string {
  // Remove all non-digit characters
  const digits = postalCode.replace(/\D/g, "")
  
  // Return first 4 digits (the part that matters for region matching)
  return digits.slice(0, 4)
}

/**
 * Checks if a postal code matches a pattern
 * Patterns can be like "1*", "90*", "95*", etc.
 */
function matchesPattern(postalCode: string, pattern: string): boolean {
  // Remove wildcard and get the prefix
  const prefix = pattern.replace("*", "")
  
  // Check if postal code starts with the prefix
  return postalCode.startsWith(prefix)
}

/**
 * Determines the tax region from a Portuguese postal code
 * Returns the TaxRegion or null if no match found
 */
export async function getTaxRegionFromPostalCode(
  postalCode: string
): Promise<{ id: string; name: string; taxRate: number } | null> {
  if (!postalCode) {
    return null
  }

  const normalized = normalizePostalCode(postalCode)
  
  if (normalized.length < 1) {
    return null
  }

  const now = new Date()

  // Find active tax regions that are currently valid
  const taxRegions = await db.taxRegion.findMany({
    where: {
      isActive: true,
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" }, // Get most recent if multiple match
  })

  // Find the first region whose pattern matches the postal code
  for (const region of taxRegions) {
    for (const pattern of region.postalCodePatterns) {
      if (matchesPattern(normalized, pattern)) {
        return {
          id: region.id,
          name: region.name,
          taxRate: Number(region.taxRate),
        }
      }
    }
  }

  // Default to Mainland Portugal if no match found
  // Try to find Mainland Portugal region
  const mainlandRegion = taxRegions.find((r) => 
    r.name.toLowerCase().includes("mainland") || 
    r.name.toLowerCase().includes("portugal")
  )

  if (mainlandRegion) {
    return {
      id: mainlandRegion.id,
      name: mainlandRegion.name,
      taxRate: Number(mainlandRegion.taxRate),
    }
  }

  // If no regions exist at all, return null (shouldn't happen in production)
  return null
}

/**
 * Calculates tax amount based on subtotal and postal code
 * Returns tax amount, rate, and region name
 */
export async function calculateTax(
  subtotal: number,
  postalCode: string
): Promise<TaxCalculationResult> {
  const region = await getTaxRegionFromPostalCode(postalCode)

  if (!region) {
    // Default to 23% (Mainland Portugal) if no region found
    return {
      taxAmount: subtotal * 0.23,
      taxRate: 23.0,
      taxRegion: "Mainland Portugal",
    }
  }

  const taxAmount = subtotal * (region.taxRate / 100)

  return {
    taxAmount,
    taxRate: region.taxRate,
    taxRegion: region.name,
  }
}

