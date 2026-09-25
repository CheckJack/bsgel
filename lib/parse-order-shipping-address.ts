export type ParsedShippingAddress = {
  name: string;
  email: string;
  phone: string;
  addressLines: string[];
  postalCity: string;
  district: string;
  country: string;
};

export function parseOrderShippingAddress(
  raw: string | null | undefined
): ParsedShippingAddress | null {
  if (!raw?.trim()) return null;

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) {
    return null;
  }

  const name = lines[0] ?? "";
  const email = lines[1] ?? "";
  const phone = lines[2] ?? "";

  if (lines.length >= 7) {
    return {
      name,
      email,
      phone,
      addressLines: [lines[3], lines[4]].filter(Boolean),
      postalCity: lines[5] ?? "",
      district: lines[6] ?? "",
      country: lines[7] ?? "",
    };
  }

  if (lines.length === 6) {
    return {
      name,
      email,
      phone,
      addressLines: [lines[3]].filter(Boolean),
      postalCity: lines[4] ?? "",
      district: lines[5] ?? "",
      country: "",
    };
  }

  return {
    name,
    email,
    phone,
    addressLines: [lines[3]].filter(Boolean),
    postalCity: lines[4] ?? "",
    district: lines[5] ?? "",
    country: lines[6] ?? "",
  };
}
