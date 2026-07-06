"use client";

import Image from "next/image";
import Link from "next/link";
import { Diamond, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type SalonPreviewData = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  image?: string;
  logo?: string;
  description?: string;
  isBioDiamond?: boolean;
};

function salonThumbnail(salon: SalonPreviewData) {
  return salon.image || salon.logo || null;
}

function SalonThumbnail({
  salon,
  className,
  priority,
}: {
  salon: SalonPreviewData;
  className?: string;
  priority?: boolean;
}) {
  const src = salonThumbnail(salon);
  const isDataUrl = src?.startsWith("data:") || src?.startsWith("blob:");

  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-sweet-bianca/60 to-gray-100",
          className
        )}
      >
        <MapPin className="h-8 w-8 text-brand-champagne/50" aria-hidden />
      </div>
    );
  }

  if (isDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={salon.name}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={salon.name}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 320px"
      priority={priority}
      unoptimized={!src.startsWith("http")}
    />
  );
}

type SalonPreviewCardProps = {
  salon: SalonPreviewData;
  variant: "map" | "list";
  viewProfileLabel: string;
  bioDiamondLabel: string;
  onClick?: () => void;
  className?: string;
};

export function SalonPreviewCard({
  salon,
  variant,
  viewProfileLabel,
  bioDiamondLabel,
  onClick,
  className,
}: SalonPreviewCardProps) {
  const isMap = variant === "map";
  const locationLine = [salon.city, salon.postalCode].filter(Boolean).join(", ");

  const inner = (
    <>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-gray-100",
          isMap ? "aspect-[2/1]" : "aspect-[16/10]"
        )}
      >
        <SalonThumbnail salon={salon} priority={isMap} />
        {salon.isBioDiamond && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-black/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <Diamond className="h-3 w-3" aria-hidden />
            {bioDiamondLabel}
          </span>
        )}
      </div>

      <div className={cn(isMap ? "p-3" : "p-4")}>
        <h3
          className={cn(
            "font-medium leading-tight text-brand-black",
            isMap ? "text-sm line-clamp-2" : "font-display text-base line-clamp-2 sm:text-lg"
          )}
        >
          {salon.name}
        </h3>

        <div className={cn("mt-2", isMap ? "space-y-0.5" : "space-y-1")}>
          <div className="flex gap-1.5">
            <MapPin
              className={cn(
                "mt-px shrink-0 text-brand-champagne",
                isMap ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
              aria-hidden
            />
            <p
              className={cn(
                "min-w-0 flex-1 text-gray-600",
                isMap ? "text-[11px] leading-[1.25] line-clamp-2" : "text-xs leading-snug line-clamp-2"
              )}
            >
              {salon.address}
            </p>
          </div>
          {locationLine && (
            <p
              className={cn(
                "text-gray-500",
                isMap ? "pl-5 text-[11px] leading-[1.25]" : "pl-[22px] text-xs leading-snug"
              )}
            >
              {locationLine}
            </p>
          )}
        </div>

        {!isMap && salon.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-gray-500">{salon.description}</p>
        )}

        <p
          className={cn(
            "border-t border-gray-100 pt-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-champagne",
            isMap ? "mt-2.5" : "mt-3 group-hover:text-brand-black transition-colors"
          )}
        >
          {viewProfileLabel}
        </p>
      </div>
    </>
  );

  const cardClass = cn(
    "group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
    isMap ? "w-[min(15rem,calc(100vw-2rem))] cursor-pointer shadow-md hover:shadow-lg" : "cursor-pointer hover:border-brand-champagne/30 hover:shadow-md transition-all",
    className
  );

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        className={cardClass}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/salons?salon=${encodeURIComponent(salon.id)}`} className={cn(cardClass, "block")}>
      {inner}
    </Link>
  );
}
