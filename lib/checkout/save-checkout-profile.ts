import { db } from "@/lib/db";
import {
  normalizeCheckoutShipping,
  parseStoredShippingAddress,
  stringifyCheckoutShipping,
  type CheckoutShippingFields,
} from "@/lib/checkout/checkout-address";

export async function saveCheckoutDetailsToUser(
  userId: string,
  input: {
    structured?: Partial<CheckoutShippingFields> | null;
    shippingAddressRaw?: string | null;
    billingNif?: string | null;
    billingAddress?: string | null;
  }
): Promise<void> {
  const fromStructured = input.structured
    ? normalizeCheckoutShipping(input.structured)
    : null;
  const fromRaw = parseStoredShippingAddress(input.shippingAddressRaw);

  const fields = (() => {
    if (!fromStructured && !fromRaw) return null;
    const merged = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      district: "",
      country: "Portugal",
    };
    for (const src of [fromRaw, fromStructured]) {
      if (!src) continue;
      (Object.keys(merged) as (keyof typeof merged)[]).forEach((key) => {
        if (src[key]) merged[key] = src[key];
      });
    }
    return merged;
  })();

  const data: {
    shippingAddress?: string;
    name?: string;
    phone?: string;
    billingNif?: string | null;
    billingAddress?: string | null;
  } = {};

  if (fields) {
    data.shippingAddress = stringifyCheckoutShipping(fields);
    const fullName = `${fields.firstName} ${fields.lastName}`.trim();
    if (fullName) data.name = fullName;
    if (fields.phone) data.phone = fields.phone;
  }

  if (input.billingNif !== undefined) {
    const v = input.billingNif?.trim() ?? "";
    data.billingNif = v === "" ? null : v;
  }
  if (input.billingAddress !== undefined) {
    const v = input.billingAddress?.trim() ?? "";
    data.billingAddress = v === "" ? null : v;
  }

  if (Object.keys(data).length === 0) return;

  try {
    await db.user.update({
      where: { id: userId },
      data,
    });
  } catch (error) {
    console.error("Failed to save checkout details to account:", error);
  }
}
