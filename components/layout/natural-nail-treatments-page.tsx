"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { GeminiHeroBadge } from "@/components/layout/category-hero-badge";
import { useLanguage } from "@/contexts/language-context";

/** Tall bottle packshots — natural aspect ~757×2000. Always object-contain. */
const BOTTLES = {
  kiwi: "/natural-nail-treatments/bottles/kiwi-cuticle-scrub.webp",
  cuticleRemover: "/natural-nail-treatments/bottles/cuticle-remover.webp",
  vitaminDose: "/natural-nail-treatments/bottles/vitamin-dose.webp",
  lavenderBase: "/natural-nail-treatments/bottles/lavender-base.webp",
  executiveBase: "/natural-nail-treatments/bottles/executive-base.webp",
  seaweedBase: "/natural-nail-treatments/bottles/seaweed-calcium-base.webp",
  almondOil: "/natural-nail-treatments/bottles/almond-cuticle-oil.webp",
  goldenSerum: "/natural-nail-treatments/bottles/golden-nail-serum.webp",
  blackcurrantOil: "/natural-nail-treatments/bottles/blackcurrant-cuticle-oil.webp",
  rosehipOil: "/natural-nail-treatments/bottles/rosehip-cuticle-oil.webp",
  jasmineOil: "/natural-nail-treatments/bottles/jasmine-cuticle-oil.webp",
} as const;

/** Retail single units from the Natural Nail Treatments / ETHOS nail-care range. */
const SHOP_PRODUCT_IDS = [
  "TRE27",
  "TRE36",
  "TRE32",
  "TRE28",
  "TRE44",
  "TRE31",
  "TRE34",
  "TRE45",
  "TRE41",
  "TRE39",
] as const;

type TreatmentKey =
  | "kiwiScrub"
  | "cuticleRemover"
  | "vitaminDose"
  | "lavenderBase"
  | "executiveBase"
  | "seaweedBase"
  | "almondOil"
  | "goldenSerum"
  | "rosehipOil"
  | "jasmineOil"
  | "blackcurrantOil";

type TreatmentBlock = {
  key: TreatmentKey;
  bottle: string;
  productId: string | null;
};

/** Preferred design language: bottle + title + description + See product — one block per treatment. */
const TREATMENT_BLOCKS: TreatmentBlock[] = [
  { key: "kiwiScrub", bottle: BOTTLES.kiwi, productId: "TRE27" },
  { key: "cuticleRemover", bottle: BOTTLES.cuticleRemover, productId: "TRE36" },
  { key: "vitaminDose", bottle: BOTTLES.vitaminDose, productId: "TRE32" },
  { key: "lavenderBase", bottle: BOTTLES.lavenderBase, productId: "TRE28" },
  { key: "executiveBase", bottle: BOTTLES.executiveBase, productId: "TRE44" },
  { key: "seaweedBase", bottle: BOTTLES.seaweedBase, productId: "TRE31" },
  { key: "almondOil", bottle: BOTTLES.almondOil, productId: "TRE34" },
  { key: "goldenSerum", bottle: BOTTLES.goldenSerum, productId: "TRE45" },
  { key: "rosehipOil", bottle: BOTTLES.rosehipOil, productId: "TRE41" },
  { key: "jasmineOil", bottle: BOTTLES.jasmineOil, productId: "TRE39" },
  { key: "blackcurrantOil", bottle: BOTTLES.blackcurrantOil, productId: null },
];

type ShopProduct = {
  id: string;
  slug?: string;
  name: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
  featured?: boolean;
  outOfStock?: boolean;
  hemaFree?: boolean;
  rating?: number;
  reviewCount?: number;
};

/**
 * Radiating callouts in a wide frame around the tall bottle.
 * viewBox 100×140 matches aspect-[5/7]; bottle packshot sits center ~32–68% x.
 * Four side rays only (no bottom) — upper pair + mid pair, mirrored L/R.
 */
type CalloutRay = {
  ox: number;
  oy: number;
  ex: number;
  ey: number;
  /** Label sits outside the tip: "right" = label on left of bottle, "left" = on right */
  align: "left" | "right";
  delayMs: number;
};

const CALLOUT_RAYS: CalloutRay[] = [
  // Origins sit inward under the bottle silhouette so strokes emerge from beneath.
  // Upper left / right — start at top of glass / base of cap (not above the packshot)
  { ox: 44, oy: 30, ex: 3, ey: 8, align: "right", delayMs: 0 },
  { ox: 56, oy: 30, ex: 97, ey: 8, align: "left", delayMs: 55 },
  // Mid left / right — lower on the body, slight downward drift for breath
  { ox: 42, oy: 48, ex: 2, ey: 54, align: "right", delayMs: 110 },
  { ox: 58, oy: 48, ex: 98, ey: 54, align: "left", delayMs: 165 },
];

function rayPath(ray: CalloutRay): string {
  const dx = ray.ex - ray.ox;
  const dy = ray.ey - ray.oy;
  // Soft outward arc — control point nudged away from the bottle
  const outward = dx >= 0 ? 1 : -1;
  const mx = ray.ox + dx * 0.48 + outward * Math.min(Math.abs(dx) * 0.12, 4);
  const my = ray.oy + dy * 0.28;
  return `M ${ray.ox} ${ray.oy} Q ${mx} ${my} ${ray.ex} ${ray.ey}`;
}

function RayArrowhead({ ray }: { ray: CalloutRay }) {
  const dx = ray.ex - ray.ox;
  const dy = ray.ey - ray.oy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  // Slim, sharp chevron tip
  const back = 1.65;
  const spread = 0.85;
  const bx = ray.ex - ux * back;
  const by = ray.ey - uy * back;
  const d = `M ${bx + px * spread} ${by + py * spread} L ${ray.ex} ${ray.ey} L ${bx - px * spread} ${by - py * spread}`;
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={0.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function BottleWithHighlights({
  src,
  alt,
  highlights,
  priority = false,
}: {
  src: string;
  alt: string;
  highlights: string[];
  priority?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tapped, setTapped] = useState(false);
  const items = highlights.slice(0, 4);
  const show = hovered || tapped;

  return (
    <div
      className="relative mx-auto w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[500px]"
      onMouseEnter={() => {
        const fine =
          typeof window !== "undefined" &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (fine) setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTapped(false);
      }}
    >
      {/* Wide frame: room for rays + labels; bottle stays object-contain in center */}
      <div className="relative mx-auto aspect-[5/7] w-full">
        {/* Rays behind the bottle — origins occluded so strokes emerge from beneath */}
        {items.length > 0 && (
          <svg
            className={`pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible text-brand-champagne-dark/70 ${
              show ? "visible" : "invisible"
            }`}
            viewBox="0 0 100 140"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            aria-hidden
            style={{
              opacity: show ? 1 : 0,
              transition: show ? "opacity 0.05s linear" : "none",
            }}
          >
            {items.map((_, i) => {
              const ray = CALLOUT_RAYS[i];
              if (!ray) return null;
              return (
                <g
                  key={`ray-${i}`}
                  style={{
                    opacity: show ? 1 : 0,
                    transition: show
                      ? `opacity 0.35s ease-out ${ray.delayMs + 80}ms`
                      : "none",
                  }}
                >
                  {/* Solid continuous stroke — start tucked under bottle (z below img) */}
                  <path
                    d={rayPath(ray)}
                    stroke="currentColor"
                    strokeWidth={0.85}
                    strokeLinecap="round"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  <RayArrowhead ray={ray} />
                </g>
              );
            })}
          </svg>
        )}

        <button
          type="button"
          className="absolute left-1/2 top-[2%] z-10 h-[88%] w-[42%] max-w-[280px] -translate-x-1/2 cursor-default touch-manipulation border-0 bg-transparent p-0"
          aria-label={alt}
          aria-expanded={items.length > 0 ? show : undefined}
          onClick={() => {
            if (items.length === 0) return;
            const fine =
              typeof window !== "undefined" &&
              window.matchMedia("(hover: hover) and (pointer: fine)").matches;
            if (!fine) setTapped((v) => !v);
          }}
        >
          <span className="relative block h-full w-full">
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              className="object-contain object-center"
              style={{ objectFit: "contain", objectPosition: "center" }}
              sizes="(max-width: 640px) 160px, (max-width: 1023px) 200px, 280px"
              unoptimized
            />
          </span>
        </button>

        {/* Labels above bottle — tips stay visible beside the packshot */}
        {items.length > 0 && (
          <div
            className={`pointer-events-none absolute inset-0 z-20 ${
              show ? "visible" : "invisible"
            }`}
            aria-hidden={!show}
          >
            {items.map((text, i) => {
              const ray = CALLOUT_RAYS[i];
              if (!ray) return null;
              const isLeftLabel = ray.align === "right";

              return (
                <div
                  key={`${text}-${i}`}
                  className={`absolute max-w-[7.75rem] sm:max-w-[9.25rem] ${
                    isLeftLabel
                      ? "-translate-x-full -translate-y-1/2 text-right"
                      : "-translate-y-1/2 text-left"
                  }`}
                  style={{
                    left: `${ray.ex}%`,
                    top: `${(ray.ey / 140) * 100}%`,
                    // Generous gap between chevron tip and label text
                    paddingInlineEnd: isLeftLabel ? "0.95rem" : undefined,
                    paddingInlineStart: isLeftLabel ? undefined : "0.95rem",
                    opacity: show ? 1 : 0,
                    visibility: show ? "visible" : "hidden",
                    transition: show
                      ? `opacity 0.45s ease-out ${ray.delayMs + 100}ms`
                      : "none",
                  }}
                >
                  <p className="font-header text-[10px] font-medium leading-[1.4] tracking-[0.03em] text-brand-black/68 sm:text-[11px] sm:leading-[1.45]">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function NaturalNailTreatmentsPage() {
  const { t, tArray } = useLanguage();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/by-ids?ids=${encodeURIComponent(SHOP_PRODUCT_IDS.join(","))}`
        );
        if (!res.ok) throw new Error("Failed to load products");
        const data = (await res.json()) as ShopProduct[];
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Hero — full-bleed background video with cream scrim for copy */}
      <section
        className="relative overflow-hidden bg-[#f7f4f1]"
        aria-labelledby="nnt-hero-heading"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/natural-nail-treatments-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        >
          <source
            src="/natural-nail-treatments/hero-background.mp4"
            type="video/mp4"
          />
        </video>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7f4f1]/45 from-[0%] via-[#f7f4f1]/20 via-[38%] to-transparent to-[68%] sm:from-[28%] sm:via-[#f7f4f1]/15 sm:via-[50%]"
          aria-hidden
        />
        <GeminiHeroBadge />
        <div className="relative z-10 container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28">
          <div className="max-w-xl lg:max-w-2xl">
            <p className="font-header text-xs uppercase tracking-[0.18em] text-brand-champagne-dark">
              {t("naturalNailTreatments.heroEyebrow")}
            </p>
            <div className="mt-4 inline-block max-w-full sm:mt-5">
              <h1
                id="nnt-hero-heading"
                className="whitespace-pre-line font-display text-[2.4rem] font-normal leading-[1.05] tracking-tight text-brand-black sm:text-5xl lg:text-[3.5rem]"
              >
                {t("naturalNailTreatments.heroTitle")}
              </h1>
              <p className="mt-5 w-0 min-w-full font-header text-sm leading-relaxed text-brand-black/70 sm:mt-6 sm:text-base">
                {t("naturalNailTreatments.heroSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment range — zigzag product blocks, all white */}
      <div id="nnt-range">
        <div className="border-t border-brand-black/8 bg-brand-white px-4 py-12 text-center sm:px-6 sm:py-16">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-normal tracking-tight text-brand-black sm:text-4xl">
              {t("naturalNailTreatments.lineupTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-header text-sm leading-relaxed text-brand-black/70 sm:text-base">
              {t("naturalNailTreatments.lineupIntro")}
            </p>
          </ScrollReveal>
        </div>

        {TREATMENT_BLOCKS.map((item, index) => {
          const reverse = index % 2 === 1;
          const name = t(`naturalNailTreatments.products.${item.key}.name`);
          const tagline = t(
            `naturalNailTreatments.products.${item.key}.tagline`
          );
          const summary = t(
            `naturalNailTreatments.products.${item.key}.summary`
          );
          const highlights = tArray(
            `naturalNailTreatments.products.${item.key}.highlights`
          ).slice(0, 4);

          return (
            <section
              key={item.key}
              className="bg-brand-white"
              aria-labelledby={`nnt-${item.key}-heading`}
            >
              <div
                className={`mx-auto grid max-w-7xl grid-cols-1 items-center lg:grid-cols-2 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="flex items-center justify-center overflow-visible bg-brand-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
                  <ScrollReveal direction={reverse ? "left" : "right"}>
                    <BottleWithHighlights
                      src={item.bottle}
                      alt={name}
                      highlights={highlights}
                      priority={index === 0}
                    />
                  </ScrollReveal>
                </div>

                <ScrollReveal
                  direction={reverse ? "right" : "left"}
                  className="flex flex-col justify-center px-6 py-14 sm:px-10 md:px-12 lg:px-14 lg:py-20 xl:px-20"
                >
                  {/* Eyebrow — crisp short line, readable size */}
                  <p className="font-header text-xs uppercase tracking-[0.14em] text-brand-champagne-dark sm:text-[13px] sm:tracking-[0.16em]">
                    {tagline}
                  </p>

                  {/* Title — block hero */}
                  <h2
                    id={`nnt-${item.key}-heading`}
                    className="mt-3 font-display text-[2.15rem] font-normal italic leading-[1.08] tracking-tight text-brand-black sm:mt-3.5 sm:text-[2.6rem] lg:text-[2.85rem]"
                  >
                    {name}
                  </h2>

                  {/* Description */}
                  <p className="mt-5 max-w-xl font-header text-[15px] leading-[1.65] text-brand-black/68 sm:mt-6 sm:text-base sm:leading-relaxed">
                    {summary}
                  </p>

                  <div className="mt-9 sm:mt-10">
                    {item.productId ? (
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-header inline-flex min-h-11 items-center justify-center rounded-full bg-brand-black px-7 text-xs uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-12 sm:px-8 sm:text-sm"
                      >
                        {t("naturalNailTreatments.viewProduct")}
                      </Link>
                    ) : (
                      <p className="font-header text-xs leading-relaxed text-brand-black/45">
                        {t("naturalNailTreatments.catalogUnavailable")}
                      </p>
                    )}
                  </div>
                </ScrollReveal>
              </div>
            </section>
          );
        })}
      </div>

      {/* Shop products */}
      <section
        id="nnt-products"
        className="border-t border-brand-black/8 bg-brand-white py-16 sm:py-20"
        aria-labelledby="nnt-products-heading"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            id="nnt-products-heading"
            className="font-display text-3xl font-normal tracking-tight text-brand-black sm:text-4xl"
          >
            {t("naturalNailTreatments.productsTitle")}
          </h2>
          <p className="mt-3 max-w-2xl font-header text-sm leading-relaxed text-brand-black/65 sm:text-base">
            {t("naturalNailTreatments.productsIntro")}
          </p>

          {isLoading ? (
            <p className="py-16 text-center font-header text-brand-black/55">
              {t("productPages.loadingProducts")}
            </p>
          ) : products.length === 0 ? (
            <p className="py-16 text-center font-header text-brand-black/55">
              {t("naturalNailTreatments.productsEmpty")}
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-1 justify-items-start gap-x-5 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-12">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                    slug={product.slug}
                  name={product.name}
                  price={product.price}
                  salePrice={product.salePrice}
                  image={product.image}
                  images={product.images}
                  featured={product.featured}
                  outOfStock={product.outOfStock}
                  hemaFree={product.hemaFree}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
