"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";
import { getAppScrollIntersectionRoot } from "@/lib/mobile-scroll-root";

export interface ProductHeaderLayoutProps {
  productName: string;
  descriptionHtml: string | null;
  priceLabel: string;
  originalPriceLabel?: string | null;
  rating: number;
  reviewCount: number;
  images: string[];
  categoryName: string | null;
  categoryId: string | null;
  breadcrumbs: { title: string; href: string }[];
  attributes: Record<string, Array<{ value: string; disabled?: boolean }>>;
  selectedAttributes: Record<string, string>;
  onAttributeSelect: (category: string, value: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdding: boolean;
  freeShippingNote: string;
  detailsTabHtml: string | null;
  catalogueTabContent?: ReactNode;
  shippingTabText: string;
  returnsTabText: string;
  labels: {
    select: string;
    variant: string;
    addToCart: string;
    buyNow: string;
    details: string;
    shipping: string;
    returns: string;
    catalogue?: string;
    reviews: string;
    review: string;
    stars: string;
  };
}

function isVideo(url: string) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith("data:video/");
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="size-4 fill-pink-500 text-pink-500" />;
        }
        if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative size-4">
              <Star className="absolute size-4 fill-gray-200 text-gray-200" />
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className="size-4 fill-pink-500 text-pink-500" />
              </div>
            </div>
          );
        }
        return <Star key={i} className="size-4 fill-gray-200 text-gray-200" />;
      })}
    </div>
  );
}

function GalleryMedia({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        className="absolute inset-0 size-full object-contain"
        playsInline
        muted
        loop
        autoPlay
        preload={priority ? "auto" : "metadata"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="!object-contain"
      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 50vw"
      priority={priority}
      unoptimized={src.startsWith("data:") || src.startsWith("blob:") || !src.startsWith("http")}
    />
  );
}

function ProductMobileGalleryCarousel({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, images]);

  if (images.length === 0) {
    return <div className="relative aspect-square w-full bg-gray-100" />;
  }

  return (
    <div className="w-full">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-square min-w-0 shrink-0 grow-0 basis-full overflow-hidden bg-gray-50"
            >
              <GalleryMedia
                src={src}
                alt={`${productName} - ${index + 1}`}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Product images">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Image ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "carousel-dot h-1.5 w-1.5 rounded-full p-0 transition-colors sm:h-2 sm:w-2",
                index === selectedIndex ? "bg-brand-black" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getStickTop() {
  const headerVar = getComputedStyle(document.documentElement).getPropertyValue(
    "--site-header-height"
  );
  return (parseFloat(headerVar) || 113) + 24;
}

export function ProductHeaderLayout({
  productName,
  descriptionHtml: _descriptionHtml,
  priceLabel,
  originalPriceLabel,
  rating,
  reviewCount,
  images,
  breadcrumbs,
  attributes,
  selectedAttributes,
  onAttributeSelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isAdding,
  freeShippingNote,
  detailsTabHtml,
  catalogueTabContent,
  shippingTabText,
  returnsTabText,
  labels,
}: ProductHeaderLayoutProps) {
  const [activeTab, setActiveTab] = useState<
    "details" | "shipping" | "returns" | "catalogue"
  >("details");
  const attributeEntries = Object.entries(attributes).filter(([, values]) => values.length > 0);
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : null;

  const galleryRef = useRef<HTMLDivElement>(null);
  const purchaseColRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [pinMode, setPinMode] = useState<"static" | "fixed" | "absolute">("static");
  const [fixedPin, setFixedPin] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [absoluteTop, setAbsoluteTop] = useState(0);
  const [columnHeight, setColumnHeight] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);

  const updateScrollPin = useCallback(() => {
    // Two-column + lock from tablet (md) up; phone stays single-column carousel.
    const isTabletUp = window.matchMedia("(min-width: 768px)").matches;
    const gallery = galleryRef.current;
    const column = purchaseColRef.current;
    const panel = panelRef.current;

    if (!isTabletUp || !gallery || !column || !panel) {
      setPinMode("static");
      setFixedPin(null);
      setColumnHeight(0);
      setPanelHeight(0);
      return;
    }

    const stickTop = getStickTop();
    const viewH = Math.max(0, window.innerHeight - stickTop);
    const galH = gallery.offsetHeight;
    const panH = panel.offsetHeight;
    // Column must cover the image stack and the full info panel so that after
    // the last image, main-page scroll can walk through long product copy.
    const colH = Math.max(galH, panH);
    const visiblePanelH = Math.min(panH, viewH);

    setColumnHeight(colH);
    setPanelHeight(panH);

    // Use viewport rects — works for both window scroll (desktop) and
    // `.app-scroll-root` scroll (tablet ≤1023px). window.scrollY alone is wrong
    // on tablet and left the buy box fixed over reviews.
    const galleryRect = gallery.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();
    const releaseLine = stickTop + visiblePanelH;
    const canPin = galleryRect.height > visiblePanelH;

    if (galleryRect.top > stickTop) {
      setPinMode("static");
      setFixedPin(null);
      return;
    }

    if (canPin && galleryRect.bottom > releaseLine) {
      setPinMode("fixed");
      setFixedPin({
        top: stickTop,
        left: columnRect.left,
        width: columnRect.width,
      });
      return;
    }

    // Past the last image (or gallery too short to pin): park at column bottom
    // so reviews scroll clear of the purchase panel.
    setPinMode("absolute");
    setFixedPin(null);
    setAbsoluteTop(Math.max(0, colH - panH));
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateScrollPin);
    };

    let scrollTarget: HTMLElement | Window | null = null;

    const bindScroll = () => {
      if (scrollTarget) {
        scrollTarget.removeEventListener("scroll", schedule);
      }
      scrollTarget = (getAppScrollIntersectionRoot() as HTMLElement | null) ?? window;
      scrollTarget.addEventListener("scroll", schedule, { passive: true });
    };

    const onResize = () => {
      bindScroll();
      schedule();
    };

    bindScroll();
    schedule();
    window.addEventListener("resize", onResize);

    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", onResize);

    const ro = new ResizeObserver(schedule);
    if (galleryRef.current) ro.observe(galleryRef.current);
    if (panelRef.current) ro.observe(panelRef.current);

    return () => {
      cancelAnimationFrame(raf);
      if (scrollTarget) {
        scrollTarget.removeEventListener("scroll", schedule);
      }
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onResize);
      ro.disconnect();
    };
  }, [updateScrollPin, images, activeTab, detailsTabHtml]);

  const detailTabs = (
    <div>
      <div
        className="mb-5 flex flex-wrap items-center gap-6 border-b border-gray-200 md:mb-6"
        role="tablist"
      >
        {(
          [
            { id: "details" as const, label: labels.details },
            { id: "shipping" as const, label: labels.shipping },
            { id: "returns" as const, label: labels.returns },
            ...(catalogueTabContent
              ? [
                  {
                    id: "catalogue" as const,
                    label: labels.catalogue ?? "Catalogue",
                  },
                ]
              : []),
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "border-b-[1.5px] px-0 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-brand-black text-brand-black"
                : "border-transparent text-gray-500 hover:text-brand-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && detailsTabHtml && (
        <div
          className="product-details-prose prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(detailsTabHtml, {
              ALLOWED_TAGS: [
                "p",
                "br",
                "strong",
                "em",
                "u",
                "h1",
                "h2",
                "h3",
                "ul",
                "ol",
                "li",
                "a",
                "img",
                "div",
                "span",
              ],
              ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"],
            }),
          }}
        />
      )}
      {activeTab === "catalogue" && catalogueTabContent}
      {activeTab === "shipping" && (
        <p className="text-gray-700 leading-relaxed">{shippingTabText}</p>
      )}
      {activeTab === "returns" && (
        <p className="text-gray-700 leading-relaxed">{returnsTabText}</p>
      )}
    </div>
  );

  const purchasePanel = (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-brand-black sm:gap-2">
          {breadcrumbs.map((item, index) => (
            <li key={item.href} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden />
              )}
              <Link
                href={item.href}
                className={cn(
                  "hover:text-brand-champagne transition-colors",
                  index === breadcrumbs.length - 1 && "font-medium"
                )}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="mb-5 text-balance text-2xl font-bold leading-snug text-brand-black md:mb-6 md:text-3xl lg:text-4xl">
        {productName}
      </h1>

      <div className="mb-5 flex flex-col flex-wrap sm:flex-row sm:items-center md:mb-6">
        <div className="flex flex-col">
          {originalPriceLabel ? (
            <p className="text-sm text-brand-black/50 line-through md:text-base">
              {originalPriceLabel}
            </p>
          ) : null}
          <p className="text-xl font-bold text-brand-black md:text-2xl">{priceLabel}</p>
        </div>
        {(ratingDisplay || reviewCount > 0) && (
          <>
            <div className="mx-4 hidden w-px self-stretch bg-gray-200 sm:block" />
            <div className="mt-2 flex flex-wrap items-center gap-3 sm:mt-0">
              {ratingDisplay && <StarRating rating={rating} />}
              <p className="text-sm text-gray-600">
                {ratingDisplay ? `(${ratingDisplay} ${labels.stars})` : ""}
                {reviewCount > 0
                  ? ` • ${reviewCount} ${reviewCount === 1 ? labels.review : labels.reviews}`
                  : ""}
              </p>
            </div>
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddToCart();
        }}
      >
        <div className="grid grid-cols-1 gap-6">
          {attributeEntries.map(([category, values], attrIndex) => {
            const selected = selectedAttributes[category] ?? values[0]?.value;
            const useSelect = values.length > 5 && attrIndex === 0;

            return (
              <div key={category} className="flex flex-col">
                <label className="mb-2 text-sm font-medium capitalize text-brand-black">
                  {category}
                </label>
                {useSelect ? (
                  <Select
                    value={selected}
                    onChange={(e) => onAttributeSelect(category, e.target.value)}
                    className="min-h-11 rounded-none border-gray-300"
                  >
                    <option value="">{labels.select}</option>
                    {values.map((v) => (
                      <option key={v.value} value={v.value} disabled={v.disabled}>
                        {v.value}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {values.map((v) => {
                      const isSelected = selected === v.value;
                      return (
                        <button
                          key={v.value}
                          type="button"
                          disabled={v.disabled}
                          onClick={() => onAttributeSelect(category, v.value)}
                          className={cn(
                            "inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-medium transition-colors",
                            isSelected
                              ? "border-brand-black bg-brand-black text-white"
                              : "border-gray-300 bg-white text-brand-black hover:border-brand-black",
                            v.disabled && "pointer-events-none opacity-25"
                          )}
                        >
                          {v.value}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-[4rem_1fr] gap-x-4">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                onQuantityChange(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="min-h-11 rounded-none border-gray-300 text-center"
            />
            <Button
              type="submit"
              disabled={isAdding}
              className="min-h-11 rounded-none bg-brand-black text-white hover:bg-brand-black/90"
            >
              {labels.addToCart}
            </Button>
          </div>
          <div className="my-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-none border-gray-300"
              onClick={onBuyNow}
              disabled={isAdding}
            >
              {labels.buyNow}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-600">{freeShippingNote}</p>
        </div>
      </form>
    </>
  );

  return (
    <header className="w-full bg-white" data-product-header>
      {/*
        Phone (< md): carousel + stacked purchase.
        Tablet+ (md): two columns with image stack + locked purchase panel.
        Desktop (lg+): same layout with wider gaps / padding.
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8 lg:gap-12">
        <div className="md:hidden">
          <ProductMobileGalleryCarousel images={images} productName={productName} />
        </div>

        <div ref={galleryRef} className="hidden space-y-4 md:block md:space-y-5 lg:space-y-6">
          {images.length > 0 ? (
            images.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative aspect-square w-full overflow-hidden bg-gray-50"
              >
                <GalleryMedia
                  src={src}
                  alt={`${productName} - ${index + 1}`}
                  priority={index === 0}
                />
              </div>
            ))
          ) : (
            <div className="relative aspect-square w-full bg-gray-100" />
          )}
        </div>

        {/*
          Single page scrollbar only. Right panel locks (fixed) while the image
          stack scrolls, then parks at the column bottom (absolute) so further
          main-page scroll walks through long product info — never an inner
          overflow scrollbar, never covering reviews.
        */}
        <div
          ref={purchaseColRef}
          className={cn(
            "relative px-[5%] pb-16 pt-6",
            "md:px-0 md:pb-16 md:pt-10 md:pl-6 md:pr-[4%]",
            "lg:pb-20 lg:pt-20 lg:pl-12 lg:pr-[5vw] xl:pl-20"
          )}
          style={
            columnHeight > 0
              ? ({ minHeight: columnHeight } as React.CSSProperties)
              : undefined
          }
        >
          {pinMode === "fixed" && panelHeight > 0 ? (
            <div
              className="pointer-events-none hidden md:block"
              style={{ height: panelHeight }}
              aria-hidden
            />
          ) : null}

          <div
            ref={panelRef}
            className={cn(
              "w-full max-w-md bg-white md:max-w-none lg:max-w-md",
              pinMode === "fixed" && "md:fixed md:z-20",
              pinMode === "absolute" && "md:absolute md:left-0 md:right-0 md:z-10"
            )}
            style={
              pinMode === "fixed" && fixedPin
                ? {
                    top: fixedPin.top,
                    left: fixedPin.left,
                    width: fixedPin.width,
                  }
                : pinMode === "absolute"
                  ? { top: absoluteTop }
                  : undefined
            }
          >
            {purchasePanel}
            <div className="mt-8 md:mt-9 lg:mt-10">{detailTabs}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
