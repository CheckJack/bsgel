export type CheckoutPaymentChoice = "CARD" | "KLARNA" | "MBWAY" | "BANK";

const CARD_BRANDS = [
  { src: "/visa-65d650f7.svg", alt: "Visa" },
  { src: "/master-54b5a7ce.svg", alt: "Mastercard" },
  { src: "/maestro-61c41725.svg", alt: "Maestro" },
] as const;

const SINGLE_BRAND: Record<
  Exclude<CheckoutPaymentChoice, "CARD">,
  { src: string; alt: string }
> = {
  KLARNA: { src: "/klarna.svg", alt: "Klarna" },
  MBWAY: { src: "/mbway.svg", alt: "MB Way" },
  BANK: { src: "/bank-transfer.svg", alt: "Bank transfer" },
};

function BrandBadge({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={38}
      height={24}
      className="h-6 w-[2.375rem] shrink-0"
      loading="lazy"
      decoding="async"
    />
  );
}

export function PaymentMethodBrands({ method }: { method: CheckoutPaymentChoice }) {
  if (method === "CARD") {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {CARD_BRANDS.map((brand) => (
          <BrandBadge key={brand.alt} {...brand} />
        ))}
      </div>
    );
  }

  const brand = SINGLE_BRAND[method];
  return (
    <div className="flex shrink-0 items-center justify-end">
      <BrandBadge {...brand} />
    </div>
  );
}
