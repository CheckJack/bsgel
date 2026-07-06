import { db } from "@/lib/db"

export interface ShippingCalculationResult {
  shippingAmount: number
  shippingZone: string
  isFreeShipping: boolean
  freeShippingThreshold: number | null
}

function normalizePostalCodeForRange(postalCode: string): number | null {
  const digits = postalCode.replace(/\D/g, "")
  if (digits.length < 7) return null
  const normalized = digits.slice(0, 7)
  return Number(normalized)
}

function normalizeLegacyBoundary(value: number): number {
  // Backwards compatibility for old 4-digit saved ranges.
  if (value >= 1000 && value <= 9999) return value * 1000
  return value
}

export async function calculateShipping(
  subtotalAfterDiscount: number,
  postalCode: string
): Promise<ShippingCalculationResult> {
  const normalizedPostal = normalizePostalCodeForRange(postalCode)

  if (normalizedPostal === null) {
    return {
      shippingAmount: 0,
      shippingZone: "Unknown zone",
      isFreeShipping: false,
      freeShippingThreshold: null,
    }
  }

  const zone = await db.shippingZone.findFirst({
    where: {
      isActive: true,
      postalCodeStart: { lte: normalizedPostal },
      postalCodeEnd: { gte: normalizedPostal },
    },
    orderBy: [{ postalCodeStart: "asc" }, { createdAt: "desc" }],
  })

  if (!zone) {
    // Fallback for any pre-existing 4-digit-only zones.
    const legacyZones = await db.shippingZone.findMany({
      where: { isActive: true },
      orderBy: [{ postalCodeStart: "asc" }, { createdAt: "desc" }],
    })
    for (const legacyZone of legacyZones) {
      const start = normalizeLegacyBoundary(legacyZone.postalCodeStart)
      const end = normalizeLegacyBoundary(legacyZone.postalCodeEnd) + 999
      if (normalizedPostal >= start && normalizedPostal <= end) {
        const legacyThreshold =
          legacyZone.freeShippingThreshold !== null &&
          legacyZone.freeShippingThreshold !== undefined
            ? Number(legacyZone.freeShippingThreshold)
            : null
        const legacyFree = legacyThreshold !== null && subtotalAfterDiscount >= legacyThreshold
        return {
          shippingAmount: legacyFree ? 0 : Number(legacyZone.shippingCost),
          shippingZone: legacyZone.name,
          isFreeShipping: legacyFree,
          freeShippingThreshold: legacyThreshold,
        }
      }
    }

    return {
      shippingAmount: 0,
      shippingZone: "No configured zone",
      isFreeShipping: false,
      freeShippingThreshold: null,
    }
  }

  const zoneThreshold =
    zone.freeShippingThreshold !== null && zone.freeShippingThreshold !== undefined
      ? Number(zone.freeShippingThreshold)
      : null
  const isFreeShipping = zoneThreshold !== null && subtotalAfterDiscount >= zoneThreshold

  return {
    shippingAmount: isFreeShipping ? 0 : Number(zone.shippingCost),
    shippingZone: zone.name,
    isFreeShipping,
    freeShippingThreshold: zoneThreshold,
  }
}
