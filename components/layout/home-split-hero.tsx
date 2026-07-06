"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { cn, formatPrice } from "@/lib/utils";

const COLOUR_BUILDER_PRODUCT_LIMIT = 4;

/** Transparent product cutouts (1485×3863). */
const HERO_SOURCE = { width: 1485, height: 3863 } as const;

/** Cap requested widths (keeps default q=75; avoids 3840px srcset picks). */
const HERO_IMAGE_SIZES = {
  mobile: "(max-width: 1023px) 100vw, 1080px",
  desktop: "(min-width: 1024px) 50vw, 960px",
} as const;

const DESKTOP_MQ = "(min-width: 1024px)";

let heroProductsPromise: Promise<BuilderGelProduct[]> | null = null;
const preloadedCarouselVariants = new Set<"desktop" | "mobile">();

type HeroHoverMedia = {
  src: string;
  type: "image" | "video";
};

/** Jar photography on brand-matched panel backgrounds. */
const HERO_PRODUCT_SLIDE_IMAGES: {
  match: string;
  desktop: string;
  mobile: string;
  background: string;
  hoverMedia?: HeroHoverMedia[];
}[] = [
  {
    match: "hush",
    desktop: "/hero-builder-hush.png",
    mobile: "/hero-builder-hush.png",
    background: "#dcbab2",
    hoverMedia: [
      { src: "/hero-hover/hush/monart-3.png", type: "image" },
      { src: "/hero-hover/hush/monart-4-1.png", type: "image" },
      { src: "/hero-hover/hush/monart-4-2.png", type: "image" },
      { src: "/hero-hover/hush/monart-1-1.png", type: "image" },
      { src: "/hero-hover/hush/monart-1-2.png", type: "image" },
    ],
  },
  {
    match: "petal",
    desktop: "/hero-builder-petal.png",
    mobile: "/hero-builder-petal.png",
    background: "#f0cac7",
    hoverMedia: [
      { src: "/hero-hover/petal/monart-4.jpeg", type: "image" },
      { src: "/hero-hover/petal/monart-1.jpeg", type: "image" },
      { src: "/hero-hover/petal/ingrid-3.jpeg", type: "image" },
      { src: "/hero-hover/petal/ingrid-1.jpeg", type: "image" },
      { src: "/hero-hover/petal/nailsbytaniab-8.jpg", type: "image" },
    ],
  },
  {
    match: "peony",
    desktop: "/hero-builder-peony.png",
    mobile: "/hero-builder-peony.png",
    background: "#ecdcdb",
  },
  {
    match: "ballet",
    desktop: "/hero-builder-ballet.png",
    mobile: "/hero-builder-ballet.png",
    background: "#edd2d4",
    hoverMedia: [
      { src: "/hero-hover/ballet/ingrid-nel.jpg", type: "image" },
      { src: "/hero-hover/ballet/monart-2.jpeg", type: "image" },
      { src: "/hero-hover/ballet/monart-3.jpeg", type: "image" },
      { src: "/hero-hover/ballet/monart-4.jpeg", type: "image" },
      { src: "/hero-hover/ballet/monart-5.jpeg", type: "image" },
    ],
  },
];

/** Fan behind the product — centered on the bottle with readable spacing. */
const HERO_HOVER_BURST_TRANSFORMS = [
  "translate(calc(-50% - 158px), calc(-50% - 74px)) rotate(-7deg)",
  "translate(calc(-50% - 79px), calc(-50% - 94px)) rotate(-3deg)",
  "translate(-50%, calc(-50% - 104px)) rotate(0deg)",
  "translate(calc(-50% + 79px), calc(-50% - 94px)) rotate(3deg)",
  "translate(calc(-50% + 158px), calc(-50% - 74px)) rotate(7deg)",
  "translate(calc(-50% - 118px), calc(-50% - 66px)) rotate(-5deg)",
  "translate(calc(-50% + 118px), calc(-50% - 66px)) rotate(5deg)",
] as const;

function isHeroHoverVideo(src: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

const HERO_DEFAULT_BACKGROUND = "#f5f3f0";

type BuilderGelProduct = {
  id: string;
  name: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
};

function HeroCopy({ headingId }: { headingId?: string }) {
  const { t } = useLanguage();

  return (
    <>
      <h1
        id={headingId}
        className="mb-4 text-left text-4xl font-bold leading-[1.05] tracking-tight text-brand-black md:mb-5 lg:text-5xl 2xl:text-6xl"
      >
        <span className="block">{t("home.splitHeroTitleLine1")}</span>
        <span className="block">{t("home.splitHeroTitleLine2")}</span>
      </h1>
      <p className="max-w-sm text-left text-sm leading-relaxed text-brand-black/80 md:max-w-md md:text-base lg:max-w-[26rem]">
        {t("home.splitHeroDesc")}
      </p>
      <div className="mt-6 md:mt-8">
        <Button
          className="h-10 shrink-0 rounded-none bg-brand-black px-6 py-0 text-brand-white hover:bg-brand-black/90"
          asChild
        >
          <Link href="/builders">{t("home.splitHeroCta")}</Link>
        </Button>
      </div>
    </>
  );
}

function HeroHoverMediaTile({
  item,
  index,
  visible,
  compact,
}: {
  item: HeroHoverMedia;
  index: number;
  visible: boolean;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.type === "video" || isHeroHoverVideo(item.src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (visible) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [visible, isVideo]);

  const spread =
    HERO_HOVER_BURST_TRANSFORMS[index % HERO_HOVER_BURST_TRANSFORMS.length];

  return (
    <div
      className="absolute overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10"
      style={{
        left: "50%",
        top: "50%",
        width: compact ? 90 : 118,
        height: compact ? 110 : 140,
        opacity: visible ? 0.95 : 0,
        transform: visible ? spread : "translate(-50%, -50%) scale(0.5) rotate(0deg)",
        transition:
          "transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 450ms ease",
        transitionDelay: visible ? `${index * 35}ms` : "0ms",
        zIndex: index,
      }}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.src}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          preload="metadata"
        />
      ) : (
        <img
          src={item.src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
}

function HeroProductImage({
  product,
  imageSrc,
  imageSizes,
  hoverMedia,
  priority,
  loading,
  onReady,
  compact,
}: {
  product: BuilderGelProduct;
  imageSrc: string;
  imageSizes: string;
  hoverMedia: HeroHoverMedia[];
  priority?: boolean;
  loading?: "eager" | "lazy";
  onReady?: () => void;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hasHoverMedia = hoverMedia.length > 0;

  useEffect(() => {
    setHovered(false);
  }, [imageSrc]);

  return (
    <div
      className="relative flex -translate-y-8 items-center justify-center sm:-translate-y-10"
      onMouseEnter={() => hasHoverMedia && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hasHoverMedia ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          {hoverMedia.map((item, index) => (
            <HeroHoverMediaTile
              key={item.src}
              item={item}
              index={index}
              visible={hovered}
              compact={compact}
            />
          ))}
        </div>
      ) : null}

      <Image
        src={imageSrc}
        alt={product.name}
        width={HERO_SOURCE.width}
        height={HERO_SOURCE.height}
        className="relative z-10 block h-auto w-auto max-h-[min(52%,380px)] max-w-[min(30%,155px)] object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.14)]"
        style={{ objectPosition: "bottom center" }}
        sizes={imageSizes}
        priority={priority}
        loading={loading}
        onLoad={onReady}
        onError={onReady}
        unoptimized={
          imageSrc.startsWith("data:") ||
          imageSrc.startsWith("blob:") ||
          !imageSrc.startsWith("/")
        }
      />
    </div>
  );
}

function ProductSlideOverlay({ product }: { product: BuilderGelProduct }) {
  const { t } = useLanguage();
  const displayPrice =
    product.salePrice != null && product.salePrice !== ""
      ? product.salePrice
      : product.price;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-8 sm:px-8 sm:pb-10">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-brand-black/55 sm:text-xs">
        {t("home.splitHeroSlideEyebrow")}
      </p>
      <p className="max-w-md text-lg font-semibold leading-tight text-brand-black sm:text-xl">
        {product.name}
      </p>
      <p className="mt-1 text-sm font-medium text-brand-black/75">
        {formatPrice(displayPrice)}
      </p>
      {product.id ? (
        <Link
          href={`/products/${product.id}`}
          className="pointer-events-auto mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-black/70 transition-colors hover:text-brand-black"
        >
          <span>{t("home.splitHeroViewProduct")}</span>
          <Eye className="size-3.5" strokeWidth={1.75} />
        </Link>
      ) : (
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-black/40">
          <span>{t("home.splitHeroViewProduct")}</span>
          <Eye className="size-3.5" strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}

function preloadOptimizedHeroSrc(src: string, variant: "desktop" | "mobile") {
  if (typeof window === "undefined") return;
  const { props } = getImageProps({
    src,
    width: HERO_SOURCE.width,
    height: HERO_SOURCE.height,
    sizes: HERO_IMAGE_SIZES[variant],
    quality: 75,
    alt: "",
  });
  const img = new window.Image();
  if (props.srcSet) img.srcset = props.srcSet;
  if (props.sizes) img.sizes = props.sizes;
  img.src = props.src;
}

export function preloadHeroCarouselImages(variant: "desktop" | "mobile") {
  if (typeof window === "undefined" || preloadedCarouselVariants.has(variant)) return;
  preloadedCarouselVariants.add(variant);

  const sizes = HERO_IMAGE_SIZES[variant];

  HERO_PRODUCT_SLIDE_IMAGES.forEach(({ desktop, mobile }, index) => {
    const src = variant === "mobile" ? mobile : desktop;
    const { props } = getImageProps({
      src,
      width: HERO_SOURCE.width,
      height: HERO_SOURCE.height,
      sizes,
      quality: 75,
      alt: "",
    });

    if (index === 0) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = props.src;
      if (props.srcSet) {
        link.setAttribute("imagesrcset", props.srcSet);
        link.setAttribute("imagesizes", sizes);
      }
      document.head.appendChild(link);
    }

    preloadOptimizedHeroSrc(src, variant);
  });
}

export function buildDefaultHeroProducts(): BuilderGelProduct[] {
  return HERO_PRODUCT_SLIDE_IMAGES.map(({ match, desktop }) => ({
    id: "",
    name: `Colour Builder Gel ${match.charAt(0).toUpperCase()}${match.slice(1)}`,
    price: "0",
    salePrice: null,
    image: desktop,
  }));
}

export function prefetchHeroProducts(): Promise<BuilderGelProduct[]> {
  if (!heroProductsPromise) {
    heroProductsPromise = fetchColourBuilderProducts();
  }
  return heroProductsPromise;
}

function HeroImageCarousel({
  products,
  onImageReady,
  className,
  imageVariant = "desktop",
  loadImages = true,
}: {
  products: BuilderGelProduct[];
  onImageReady?: () => void;
  className?: string;
  imageVariant?: "desktop" | "mobile";
  loadImages?: boolean;
}) {
  const imageSizes = HERO_IMAGE_SIZES[imageVariant];
  const slideCount = products.length;
  const [activeIndex, setActiveIndex] = useState(0);

  const resolveImageSrc = useCallback(
    (product: BuilderGelProduct) =>
      heroSlideImageForName(product.name, imageVariant) ??
      (imageVariant === "desktop" ? product.image : null),
    [imageVariant]
  );

  const goToSlide = useCallback(
    (targetIndex: number) => {
      if (slideCount <= 1) return;
      const next = (targetIndex + slideCount) % slideCount;
      setActiveIndex((current) => (next === current ? current : next));
    },
    [slideCount]
  );

  const scrollPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const scrollNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const handleFirstSlideReady = useCallback(() => {
    onImageReady?.();
  }, [onImageReady]);

  useEffect(() => {
    if (!loadImages || products.length <= 1) return;
    products.slice(1).forEach((product) => {
      const src = heroSlideImageForName(product.name, imageVariant);
      if (src) preloadOptimizedHeroSrc(src, imageVariant);
    });
  }, [loadImages, products, imageVariant]);

  const activeProduct = products[activeIndex] ?? products[0];
  const imageSrc = activeProduct ? resolveImageSrc(activeProduct) : null;
  const hoverMedia = activeProduct ? heroSlideHoverMediaForName(activeProduct.name) : [];
  const panelBackground = activeProduct
    ? heroSlideBackgroundForName(activeProduct.name)
    : HERO_DEFAULT_BACKGROUND;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ backgroundColor: panelBackground }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-6 py-10 sm:px-10">
        {loadImages && imageSrc && activeProduct ? (
          <HeroProductImage
            product={activeProduct}
            imageSrc={imageSrc}
            imageSizes={imageSizes}
            hoverMedia={hoverMedia}
            priority={activeIndex <= 1}
            loading={activeIndex <= 1 ? "eager" : "lazy"}
            onReady={activeIndex === 0 ? handleFirstSlideReady : undefined}
            compact={imageVariant === "mobile"}
          />
        ) : (
          <div className="h-full w-full" aria-hidden />
        )}
      </div>

      {activeProduct ? <ProductSlideOverlay product={activeProduct} /> : null}

      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-black shadow-sm backdrop-blur-sm transition hover:bg-white sm:left-4 sm:size-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-black shadow-sm backdrop-blur-sm transition hover:bg-white sm:right-4 sm:size-10"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-4 right-4 z-30 flex gap-1.5 sm:bottom-5 sm:right-5">
            {Array.from({ length: slideCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-500 ease-in-out",
                  activeIndex === index ? "scale-110 bg-white" : "bg-white/45"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function heroSlideConfigForName(name: string) {
  const lower = name.toLowerCase();
  return HERO_PRODUCT_SLIDE_IMAGES.find((entry) => lower.includes(entry.match));
}

function heroSlideImageForName(
  name: string,
  variant: "desktop" | "mobile" = "desktop"
): string | null {
  const override = heroSlideConfigForName(name);
  if (!override) return null;
  return variant === "mobile" ? override.mobile : override.desktop;
}

function heroSlideBackgroundForName(name: string): string {
  return heroSlideConfigForName(name)?.background ?? HERO_DEFAULT_BACKGROUND;
}

function heroSlideHoverMediaForName(name: string): HeroHoverMedia[] {
  return heroSlideConfigForName(name)?.hoverMedia ?? [];
}

function mapBuilderGelProducts(
  items: Array<{
    id: string;
    name: string;
    price?: unknown;
    salePrice?: unknown;
    image?: string | null;
    images?: string[];
  }>
): BuilderGelProduct[] {
  return items
    .filter((p) => p.name.toLowerCase().includes("colour builder gel"))
    .slice(0, COLOUR_BUILDER_PRODUCT_LIMIT)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price?.toString() || "0",
      salePrice: p.salePrice?.toString() ?? null,
      image: heroSlideImageForName(p.name),
    }))
    .filter((p) => p.image != null);
}

async function fetchColourBuilderProducts(): Promise<BuilderGelProduct[]> {
  const load = async (query: string) => {
    const res = await fetch(query);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []) as Array<{
      id: string;
      name: string;
      price?: unknown;
      salePrice?: unknown;
      image?: string | null;
      images?: string[];
    }>;
  };

  const fromBuilders = mapBuilderGelProducts(
    await load("/api/products?showcasingSection=builders&sortBy=newest&limit=32")
  );
  if (fromBuilders.length > 0) return fromBuilders;

  return mapBuilderGelProducts(
    await load("/api/products?search=Colour%20Builder%20Gel&sortBy=newest&limit=16")
  );
}

function DesktopHeroPanel({
  products,
  onImageReady,
  loadImages,
}: {
  products: BuilderGelProduct[];
  onImageReady?: () => void;
  loadImages: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div className="relative z-20 flex h-full w-1/2 flex-col items-center justify-center px-10 xl:px-16 2xl:px-20">
        <div className="w-full max-w-[26rem] xl:max-w-[28rem]">
          <HeroCopy headingId="home-split-hero-heading" />
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 z-10 h-full w-1/2">
        <HeroImageCarousel
          products={products}
          onImageReady={onImageReady}
          loadImages={loadImages}
          imageVariant="desktop"
        />
      </div>
    </div>
  );
}

function getInitialIsDesktop() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_MQ).matches;
}

export function HomeSplitHero({ onImageReady }: { onImageReady?: () => void }) {
  const [products, setProducts] = useState<BuilderGelProduct[]>(buildDefaultHeroProducts);
  const [isDesktop, setIsDesktop] = useState(getInitialIsDesktop);

  useLayoutEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const variant = isDesktop ? "desktop" : "mobile";
    preloadHeroCarouselImages(variant);
  }, [isDesktop]);

  useEffect(() => {
    let cancelled = false;
    void prefetchHeroProducts().then((items) => {
      if (!cancelled && items.length > 0) setProducts(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="home-split-hero-heading"
      className="w-full bg-white pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 xl:pt-28 xl:pb-24"
    >
      <div className="flex flex-col lg:hidden">
        <div className="flex flex-col justify-center px-6 py-14 md:px-10 md:py-16">
          <HeroCopy headingId="home-split-hero-heading" />
        </div>
        <div className="relative aspect-[1920/2000] w-full">
          <HeroImageCarousel
            products={products}
            onImageReady={onImageReady}
            className="absolute inset-0"
            imageVariant="mobile"
            loadImages={!isDesktop}
          />
        </div>
      </div>

      <div className="relative hidden min-h-[75vh] w-full lg:block">
        <DesktopHeroPanel
          products={products}
          onImageReady={onImageReady}
          loadImages={isDesktop}
        />
      </div>
    </section>
  );
}
