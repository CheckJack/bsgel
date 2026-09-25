export type CheckoutShippingFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  district: string;
  country: string;
};

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function emptyCheckoutShipping(
  defaults?: Partial<CheckoutShippingFields>
): CheckoutShippingFields {
  return {
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
    ...defaults,
  };
}

export function normalizeCheckoutShipping(
  input: Partial<CheckoutShippingFields> | Record<string, unknown>
): CheckoutShippingFields {
  return {
    firstName: asString(input.firstName),
    lastName: asString(input.lastName),
    email: asString(input.email),
    phone: asString(input.phone),
    addressLine1: asString(input.addressLine1),
    addressLine2: asString(input.addressLine2),
    city: asString(input.city),
    postalCode: asString(input.postalCode),
    district: asString(input.district),
    country: asString(input.country) || "Portugal",
  };
}

function parseFormattedShipping(raw: string): CheckoutShippingFields | null {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 5) return null;

  const { firstName, lastName } = splitFullName(lines[0] || "");
  const email = lines[1] || "";
  const phone = lines[2] || "";
  const rest = lines.slice(3);
  const postalRe = /^(\d{4}-?\d{0,3})\s+(.+)$/;

  let postalIdx = -1;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (postalRe.test(rest[i])) {
      postalIdx = i;
      break;
    }
  }

  let addressLines: string[] = [];
  let postalCity = "";
  let district = "";
  let country = "Portugal";

  if (postalIdx >= 0) {
    addressLines = rest.slice(0, postalIdx);
    postalCity = rest[postalIdx] || "";
    district = rest[postalIdx + 1] || "";
    country = rest[postalIdx + 2] || "Portugal";
  } else if (rest.length >= 3) {
    addressLines = rest.slice(0, -3);
    postalCity = rest[rest.length - 3] || "";
    district = rest[rest.length - 2] || "";
    country = rest[rest.length - 1] || "Portugal";
  } else {
    return null;
  }

  const postalMatch = postalCity.match(/^(\d{4}-?\d{0,3})\s*(.*)$/);

  return {
    firstName,
    lastName,
    email,
    phone,
    addressLine1: addressLines[0] || "",
    addressLine2: addressLines.slice(1).join(", "),
    postalCode: postalMatch?.[1] || "",
    city: (postalMatch?.[2] || "").trim(),
    district,
    country,
  };
}

/** Accepts JSON from the account, or the multiline string stored on orders. */
export function parseStoredShippingAddress(
  raw: string | null | undefined
): CheckoutShippingFields | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const normalized = normalizeCheckoutShipping(parsed);
      if (
        normalized.firstName ||
        normalized.lastName ||
        normalized.addressLine1 ||
        normalized.postalCode ||
        normalized.phone
      ) {
        return normalized;
      }
    }
  } catch {
    // Not JSON — try the order multiline format
  }

  return parseFormattedShipping(raw);
}

export function stringifyCheckoutShipping(fields: CheckoutShippingFields): string {
  return JSON.stringify(normalizeCheckoutShipping(fields));
}

export function formatCheckoutShippingForOrder(fields: CheckoutShippingFields): string {
  const f = normalizeCheckoutShipping(fields);
  const line2 = f.addressLine2 ? `\n${f.addressLine2}` : "";
  return `${f.firstName} ${f.lastName}\n${f.email}\n${f.phone}\n${f.addressLine1}${line2}\n${f.postalCode} ${f.city}\n${f.district}\n${f.country}`;
}
