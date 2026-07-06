"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useCart } from "@/contexts/cart-context";
import { formatPrice, cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export interface CarouselProduct {
  id: string;
  name: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
  category?: { name: string } | null;
  outOfStock?: boolean;
}

export interface HomeProductsCarouselLabels {
  ariaLabel: string;
  tagline: string;
  heading: string;
  description: string;
  viewAllHref: string;
  viewAllLabel: string;
  loading: string;
  empty: string;
  emptyViewAllHref: string;
  emptyViewAllLabel: string;
}

interface HomeProductsCarouselProps {
  labels: HomeProductsCarouselLabels;
  loadProducts: () => Promise<CarouselProduct[]>;
  /** Fit header, carousel, and controls in one viewport below the site header (lg+). */
  viewportFit?: boolean;
}

const SLIDE_CLASS =
  "min-w-0 shrink-0 grow-0 basis-[calc(100vw-5vw-12vw)] sm:basis-[calc((100vw-14vw-1.5rem)/2)] lg:basis-[calc((100vw-18vw-3rem)/3)]";

const CAROUSEL_PEEK_RIGHT = "pr-[10vw]";

function CarouselProductCard({
  product,
  viewportFit = false,
}: {
  product: CarouselProduct;
  viewportFit?: boolean;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const productUrl = `/products/${product.id}`;
  const imageSrc = product.image || product.images?.[0];
  const displayPrice =
    product.salePrice != null && product.salePrice !== ""
      ? product.salePrice
      : product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.outOfStock) return;
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(productUrl)}`);
      return;
    }
    setIsAdding(true);
    try {
      const ok = await addItem(product.id, 1);
      if (ok) {
        window.dispatchEvent(new CustomEvent("openCartDrawer"));
        toast(
          language === "pt" ? "Adicionado ao carrinho" : "Added to cart",
          "success",
          2500
        );
      } else {
        toast(
          language === "pt"
            ? "Não foi possível adicionar. Tente novamente."
            : "Could not add to cart. Please try again.",
          "error"
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <Link
        href={productUrl}
        className={cn(
          "relative mb-3 block aspect-[5/6] w-full overflow-hidden bg-transparent md:mb-4",
          viewportFit
            ? "max-h-[min(22rem,42vw)] lg:mb-3 lg:max-h-[min(18rem,calc((100dvh-var(--site-header-height,113px)-12rem)*0.55))] xl:max-h-[min(20rem,calc((100dvh-var(--site-header-height,113px)-11rem)*0.58))]"
            : "max-h-[min(22rem,42vw)]"
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="!object-contain"
            sizes="(max-width: 640px) 95vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-gray-400">
            —
          </div>
        )}
      </Link>

      <Link
        href={productUrl}
        className="flex shrink-0 items-start justify-between gap-3 text-brand-black transition-opacity hover:opacity-80"
      >
        <div className="mr-2 min-w-0 flex-1">
          <h3
            className={cn(
              "line-clamp-2 text-sm font-semibold leading-snug sm:text-base",
              viewportFit && "lg:line-clamp-1 lg:text-sm"
            )}
          >
            {product.name}
          </h3>
          {product.category?.name && (
            <div className="mt-0.5 line-clamp-1 text-xs text-gray-600 sm:text-sm">
              {product.category.name}
            </div>
          )}
        </div>
        <div className="shrink-0 text-sm font-semibold sm:text-base">
          {formatPrice(displayPrice)}
        </div>
      </Link>

      <button
        type="button"
        disabled={product.outOfStock || isAdding}
        onClick={handleAddToCart}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-3 w-full px-5 py-2 md:mt-4",
          viewportFit && "lg:mt-2 lg:py-1.5 lg:text-sm",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {isAdding ? (
          <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
        ) : null}
        {product.outOfStock ? t("products.outOfStock") : t("products.addToCart")}
      </button>
    </div>
  );
}

export function HomeProductsCarousel({
  labels,
  loadProducts,
  viewportFit = false,
}: HomeProductsCarouselProps) {
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const items = await loadProducts();
        if (!cancelled) setProducts(items);
      } catch (error) {
        console.error("Failed to load homepage products:", error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [loadProducts]);

  useEffect(() => {
    emblaApi?.reInit({ loop: false, align: "start" });
  }, [emblaApi, products]);

  const dotCount = emblaApi?.scrollSnapList().length ?? products.length;

  return (
    <section
      className={cn(
        "w-full overflow-hidden bg-white",
        viewportFit
          ? "max-lg:my-0 max-lg:pt-11 max-lg:pb-8 md:my-6 md:py-10 lg:my-8 lg:flex lg:min-h-[calc(100dvh-var(--site-header-height,113px))] lg:flex-col lg:justify-evenly lg:py-12 xl:my-10 xl:py-14"
          : "py-12 md:py-16 lg:py-20"
      )}
      aria-label={labels.ariaLabel}
    >
      <div className={cn("px-[5%]", viewportFit && "lg:shrink-0")}>
        <div
          className={cn(
            "mb-8 grid grid-cols-1 items-end gap-6 md:mb-10 md:grid-cols-[1fr_max-content] lg:gap-8",
            viewportFit && "lg:mb-0 lg:gap-5"
          )}
        >
          <div className="max-w-lg">
            <p className="mb-1 text-xs font-semibold text-brand-black sm:mb-1.5 sm:text-sm">
              {labels.tagline}
            </p>
            <h2
              className={cn(
                "font-display mb-2 text-4xl font-normal tracking-tight text-brand-black md:mb-3 md:text-5xl lg:text-5xl",
                viewportFit && "lg:mb-1.5 lg:text-4xl xl:text-5xl 2xl:text-6xl"
              )}
            >
              {labels.heading}
            </h2>
            <p
              className={cn(
                "text-sm text-gray-600 md:text-base",
                viewportFit && "lg:text-sm lg:leading-snug"
              )}
            >
              {labels.description}
            </p>
          </div>
          <Link
            href={labels.viewAllHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden shrink-0 px-5 py-2 text-sm md:inline-flex"
            )}
          >
            {labels.viewAllLabel}
          </Link>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm font-light text-gray-600">{labels.loading}</div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="py-8 text-center">
            <p className="mb-3 text-base text-brand-black">{labels.empty}</p>
            <Link
              href={labels.emptyViewAllHref}
              className="inline-flex items-center text-sm font-medium text-brand-black transition-colors hover:text-brand-champagne"
            >
              {labels.emptyViewAllLabel}
            </Link>
          </div>
        )}
      </div>

      {!isLoading && products.length > 0 && (
        <div
          className={cn(
            "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2",
            viewportFit && "lg:shrink-0"
          )}
          role="region"
          aria-roledescription="carousel"
        >
          <div
            className={cn(
              "relative pb-16 md:pb-20",
              viewportFit && "lg:flex lg:flex-col lg:gap-4 lg:pb-0 xl:gap-5"
            )}
          >
            <div
              ref={emblaRef}
              className={cn(
                "overflow-hidden pl-[5vw]",
                CAROUSEL_PEEK_RIGHT,
                viewportFit && "lg:shrink-0"
              )}
            >
              <div className="flex touch-pan-y gap-4 md:gap-6 lg:gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    role="group"
                    aria-roledescription="slide"
                    className={SLIDE_CLASS}
                  >
                    <CarouselProductCard product={product} viewportFit={viewportFit} />
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "absolute bottom-0 left-0 flex w-full items-end justify-between px-[5%]",
                viewportFit && "lg:static lg:shrink-0"
              )}
            >
              <div className="flex h-6 items-center">
                {Array.from({ length: dotCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    data-carousel-dot
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "carousel-dot mx-0.5 h-1.5 w-1.5 shrink-0 rounded-full p-0 transition-colors sm:mx-[3px] sm:h-2 sm:w-2",
                      selectedIndex === index ? "bg-brand-black" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={scrollPrev}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-gray-300 bg-white text-brand-black transition-colors hover:border-brand-black sm:size-11"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="size-5 sm:size-6" />
                </button>
                <button
                  type="button"
                  onClick={scrollNext}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-gray-300 bg-white text-brand-black transition-colors hover:border-brand-black sm:size-11"
                  aria-label="Next slide"
                >
                  <ChevronRight className="size-5 sm:size-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div
          className={cn(
            "mt-6 px-[5%] text-center md:hidden",
            viewportFit && "lg:hidden"
          )}
        >
          <Link
            href={labels.viewAllHref}
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex px-6 py-2.5 text-sm")}
          >
            {labels.viewAllLabel}
          </Link>
        </div>
      )}
    </section>
  );
}
