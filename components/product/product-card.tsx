"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useCart } from "@/contexts/cart-context";
import { toast } from "@/components/ui/toast";
import { dispatchStockToast } from "@/lib/stock-client";
import { productPath } from "@/lib/products/paths";

interface ProductCardProps {
  id: string;
  slug?: string | null;
  name: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
  featured?: boolean;
  outOfStock?: boolean;
  hemaFree?: boolean;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
  /** Only set for above-the-fold cards (LCP). Default: lazy load. */
  priority?: boolean;
}

const isVideo = (url: string) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith('data:video/');
};

function StarRating({ rating = 0 }: { rating?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="h-3 w-3 fill-pink-500 text-pink-500" />;
        }
        if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative h-3 w-3">
              <Star className="absolute inset-0 h-3 w-3 fill-gray-200 text-gray-200" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-3 w-3 fill-pink-500 text-pink-500" />
              </div>
            </div>
          );
        }
        return <Star key={i} className="h-3 w-3 fill-gray-200 text-gray-200" />;
      })}
    </div>
  );
}

export function ProductCard({ 
  id,
  slug,
  name, 
  price, 
  salePrice,
  image, 
  images = [], 
  featured,
  outOfStock,
  hemaFree,
  description: _description,
  rating: _rating,
  reviewCount: _reviewCount,
  priority = false,
}: ProductCardProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItemDetailed } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverMediaReady, setHoverMediaReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolvedRating = typeof _rating === "number" ? _rating : 0;
  const resolvedReviewCount = typeof _reviewCount === "number" ? _reviewCount : 0;
  const variantLabel =
    outOfStock ? t("products.outOfStock") : hemaFree ? t("products.hemaFree") : language === "pt" ? "Variante" : "Variant";
  
  // Combine image and images array, with image as first item
  const allMedia = image ? [image, ...images] : images;
  const firstMedia = allMedia[0] || null;
  const secondMedia = allMedia[1] || null;
  const hasSecondMedia = !!secondMedia;

  useEffect(() => {
    if (isHovered && videoRef.current && isVideo(secondMedia || '')) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, secondMedia]);

  const href = productPath({ id, slug });

  return (
    <div 
      className="flex h-full w-full flex-col"
      onMouseEnter={() => {
        setIsHovered(true);
        if (hasSecondMedia) setHoverMediaReady(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        aria-label={name}
        className="relative mb-3 block aspect-square w-full cursor-pointer overflow-hidden bg-[#F5F3F0] md:mb-4"
      >
        {firstMedia ? (
          <>
            {/* First media (always visible) */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered && hoverMediaReady ? 'opacity-0' : 'opacity-100'}`}>
              {isVideo(firstMedia) ? (
                <video
                  src={firstMedia}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay={!hasSecondMedia}
                  preload="metadata"
                />
              ) : (
                <Image
                  src={firstMedia}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover"
                  priority={priority}
                  loading={priority ? "eager" : "lazy"}
                  unoptimized={
                    firstMedia?.startsWith("data:") ||
                    firstMedia?.startsWith("blob:") ||
                    firstMedia?.startsWith("/api/") ||
                    (!firstMedia?.startsWith("http") && !firstMedia?.startsWith("/uploads/"))
                  }
                />
              )}
            </div>
            
            {/* Second media (fades in on hover) */}
            {hasSecondMedia && hoverMediaReady && (
              <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {isVideo(secondMedia) ? (
                  <video
                    ref={videoRef}
                    src={secondMedia}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    preload="none"
                  />
                ) : (
                  <Image
                    src={secondMedia}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                    unoptimized={
                      secondMedia?.startsWith("data:") ||
                      secondMedia?.startsWith("blob:") ||
                      secondMedia?.startsWith("/api/") ||
                      (!secondMedia?.startsWith("http") && !secondMedia?.startsWith("/uploads/"))
                    }
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">{t("products.noImage")}</span>
          </div>
        )}
        {(outOfStock || hemaFree) && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
            {outOfStock && (
              <div className="rounded bg-pink-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
                {t("products.outOfStock")}
              </div>
            )}
            {hemaFree && (
              <div className="rounded bg-pink-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
                {t("products.hemaFree")}
              </div>
            )}
          </div>
        )}
      </Link>

      <div className="flex justify-between md:text-md">
        <div className="mr-4">
          <Link href={href} className="text-left">
            <h3 className="text-balance font-semibold hover:text-brand-champagne">{name}</h3>
          </Link>
          <div className="text-sm text-brand-black/70">{variantLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {salePrice && price ? (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-xs text-brand-black/50 line-through md:text-sm">
                {formatPrice(price)}
              </span>
              <span className="text-md font-semibold text-brand-black md:text-lg">
                {formatPrice(salePrice)}
              </span>
            </div>
          ) : (
            <div className="text-md font-semibold md:text-lg">
              {price ? formatPrice(price) : t("products.priceOnRequest")}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-brand-black/70">
            <StarRating rating={resolvedRating} />
            <span>
              {resolvedRating.toFixed(1)} ({resolvedReviewCount})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 w-full md:mt-4">
        <button
          type="button"
          disabled={isAdding}
          className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 border border-brand-black bg-brand-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-black/90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (outOfStock) {
              dispatchStockToast({
                error: "OUT_OF_STOCK",
                productId: id,
                available: 0,
              });
              return;
            }
            if (!session) {
              router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
              return;
            }
            setIsAdding(true);
            try {
              const result = await addItemDetailed(id, 1);
              if (result === "ok" || result === "partial") {
                window.dispatchEvent(new CustomEvent("openCartDrawer"));
                toast(t("cart.addedToCart"), "success", 2500);
              } else if (result === "blocked") {
                toast(t("cart.addFailedRetry"), "error");
              }
            } finally {
              setIsAdding(false);
            }
          }}
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
          {t("products.addToCart")}
        </button>
      </div>
    </div>
  );
}
