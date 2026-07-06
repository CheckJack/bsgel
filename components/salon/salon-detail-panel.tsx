"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Diamond,
  X,
  ExternalLink,
  Instagram,
  Facebook,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export type SalonDetail = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string | null;
  facebook?: string | null;
  pinterest?: string | null;
  image?: string;
  logo?: string;
  images?: string[];
  description?: string;
  workingHours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  isBioDiamond?: boolean;
  latitude?: number;
  longitude?: number;
};

function formatSalonAddress(salon: SalonDetail): string {
  return [salon.address, salon.city, salon.postalCode].filter(Boolean).join(", ");
}

function getGoogleMapsDirectionsUrl(salon: SalonDetail): string {
  const lat = Number(salon.latitude);
  const lng = Number(salon.longitude);
  const destination =
    Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : formatSalonAddress(salon);

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function PinterestGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.655 2.568-.994 3.994-.283 1.194.599 2.169 1.777 2.169 2.132 0 3.772-2.245 3.772-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.098.121.112.225.085.345-.09.375-.293 1.199-.332 1.363-.053.225-.172.271-.403.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.378l-.749 2.848c-.266 1.016-.992 2.287-1.478 3.06 1.114.345 2.306.535 3.55.535 6.629 0 12.017-5.388 12.017-12.017C24.034 5.367 18.646.001 12.017.001z" />
    </svg>
  );
}

type SalonActionRowProps = {
  icon: LucideIcon | typeof PinterestGlyph;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  showTrailingIcon?: boolean;
};

function SalonActionRow({
  icon: Icon,
  label,
  hint,
  href,
  onClick,
  external,
  showTrailingIcon = true,
}: SalonActionRowProps) {
  const className =
    "flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left text-brand-black";

  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-champagne text-white">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-brand-black">
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-xs text-gray-500">
            {hint}
          </span>
        ) : null}
      </span>
      {showTrailingIcon ? (
        external ? (
          <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        )
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

type SalonDetailPanelProps = {
  salon: SalonDetail | null;
  open: boolean;
  onClose: () => void;
  className?: string;
  /** When true, panel is absolute within the map container (below site header) */
  embedded?: boolean;
  /** When true, panel is rendered inside the fullscreen map shell (left column) */
  fullscreen?: boolean;
};

export function SalonDetailPanel({
  salon,
  open,
  onClose,
  className,
  embedded = false,
  fullscreen = false,
}: SalonDetailPanelProps) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setShareCopied(false);
  }, [salon?.id]);

  const galleryImages =
    salon?.images && salon.images.length > 0
      ? salon.images
      : salon?.image
        ? [salon.image]
        : salon?.logo
          ? [salon.logo]
          : [];

  const formatWorkingHours = (workingHours: SalonDetail["workingHours"]) => {
    if (!workingHours || typeof workingHours !== "object") {
      return [];
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    const dayNames: Record<(typeof days)[number], string> = {
      monday: t("findSalon.dayNamesFull.monday"),
      tuesday: t("findSalon.dayNamesFull.tuesday"),
      wednesday: t("findSalon.dayNamesFull.wednesday"),
      thursday: t("findSalon.dayNamesFull.thursday"),
      friday: t("findSalon.dayNamesFull.friday"),
      saturday: t("findSalon.dayNamesFull.saturday"),
      sunday: t("findSalon.dayNamesFull.sunday"),
    };

    return days.map((day) => {
      const dayData = workingHours[day];
      if (dayData?.closed) {
        return { day: dayNames[day], hours: t("findSalon.closed") };
      }
      if (dayData && !dayData.closed) {
        return {
          day: dayNames[day],
          hours: `${dayData.open || "?"} – ${dayData.close || "?"}`,
        };
      }
      return null;
    }).filter(Boolean) as { day: string; hours: string }[];
  };

  const hoursRows = salon ? formatWorkingHours(salon.workingHours) : [];
  const fullAddress = salon ? formatSalonAddress(salon) : "";
  const hasContactActions = Boolean(
    salon?.phone ||
      salon?.email ||
      salon?.website ||
      salon?.instagram ||
      salon?.facebook ||
      salon?.pinterest
  );

  const handleShare = async () => {
    if (!salon) return;

    const address = formatSalonAddress(salon);
    const url = `${window.location.origin}/salons?salon=${encodeURIComponent(salon.id)}`;
    const shareText = `${salon.name}\n${address}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: salon.name,
          text: shareText,
          url,
        });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt(t("findSalon.sharePrompt"), `${shareText}\n${url}`);
    }
  };

  if (!open || !salon) {
    return null;
  }

  return (
    <>
      {embedded && !fullscreen && (
        <button
          type="button"
          aria-label={t("findSalon.closePanel")}
          onClick={onClose}
          className="absolute inset-0 z-[10040] bg-black/30 transition-opacity duration-300 ease-out lg:hidden"
        />
      )}

      <aside
        className={cn(
          "flex min-h-0 flex-col bg-white",
          fullscreen
            ? "relative flex h-full min-h-0 w-full flex-1 flex-col"
            : cn(
                "z-[10050] shadow-2xl transition-[transform,opacity] duration-300 ease-out",
                embedded
                  ? "absolute inset-y-0 left-0 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-[var(--site-header-height,113px)] max-lg:h-auto max-lg:w-full max-lg:border-r-0 max-lg:border-t max-lg:border-gray-200"
                  : "fixed top-[var(--site-header-height,113px)] h-[calc(100dvh-var(--site-header-height,113px))] left-0",
                "w-[min(100vw,24rem)] max-w-full border-r border-gray-200",
                "translate-x-0 opacity-100 max-lg:translate-y-0"
              ),
          className
        )}
      >
        {salon && (
          <>
            <div className="relative shrink-0">
              {galleryImages.length > 0 ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  <Image
                    src={galleryImages[currentImageIndex]}
                    alt={salon.name}
                    fill
                    className="object-cover"
                    unoptimized={
                      galleryImages[currentImageIndex]?.startsWith("data:") ||
                      !galleryImages[currentImageIndex]?.startsWith("http")
                    }
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-brand-champagne shadow"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-brand-champagne shadow"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                        {currentImageIndex + 1}/{galleryImages.length}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-brand-sweet-bianca/30">
                  <MapPin className="h-10 w-10 text-brand-champagne/40" />
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-brand-black shadow-md hover:bg-white"
                aria-label={t("findSalon.closePanel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 [-webkit-overflow-scrolling:touch]",
                fullscreen &&
                  "pb-[max(6rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))]"
              )}
            >
              <div>
                <div className="flex flex-wrap items-start gap-2">
                  <h2 className="font-display text-xl font-medium leading-tight text-brand-black">
                    {salon.name}
                  </h2>
                  {salon.isBioDiamond && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-champagne px-2.5 py-1 text-[10px] font-medium text-white">
                      <Diamond className="h-3 w-3" aria-hidden />
                      {t("findSalon.bioDiamondSalon")}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-champagne" aria-hidden />
                  <div className="text-sm text-gray-600">
                    <p>{salon.address}</p>
                    <p className="text-gray-500">
                      {salon.city}
                      {salon.postalCode ? `, ${salon.postalCode}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <SalonActionRow
                    icon={Navigation}
                    label={t("findSalon.directions")}
                    hint={fullAddress}
                    href={getGoogleMapsDirectionsUrl(salon)}
                    external
                  />
                  <SalonActionRow
                    icon={Share2}
                    label={shareCopied ? t("findSalon.shareCopied") : t("findSalon.share")}
                    hint={t("findSalon.shareHint")}
                    onClick={handleShare}
                    showTrailingIcon={false}
                  />
                  {hasContactActions && (
                    <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {t("findSalon.contact")}
                    </p>
                  )}
                  {salon.phone && (
                    <SalonActionRow
                      icon={Phone}
                      label={t("findSalon.phone")}
                      hint={salon.phone}
                      href={`tel:${salon.phone}`}
                    />
                  )}
                  {salon.email && (
                    <SalonActionRow
                      icon={Mail}
                      label={t("findSalon.email")}
                      hint={salon.email}
                      href={`mailto:${salon.email}`}
                    />
                  )}
                  {salon.website && (
                    <SalonActionRow
                      icon={Globe}
                      label={t("findSalon.website")}
                      hint={salon.website.replace(/^https?:\/\//, "")}
                      href={salon.website}
                      external
                    />
                  )}
                  {salon.instagram && (
                    <SalonActionRow
                      icon={Instagram}
                      label={t("findSalon.instagram")}
                      href={salon.instagram}
                      external
                    />
                  )}
                  {salon.facebook && (
                    <SalonActionRow
                      icon={Facebook}
                      label={t("findSalon.facebook")}
                      href={salon.facebook}
                      external
                    />
                  )}
                  {salon.pinterest && (
                    <SalonActionRow
                      icon={PinterestGlyph}
                      label={t("findSalon.pinterest")}
                      href={salon.pinterest}
                      external
                    />
                  )}
                </div>
              </div>

              {salon.description && (
                <div>
                  <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-champagne">
                    {t("findSalon.about")}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                    {salon.description}
                  </p>
                </div>
              )}

              {hoursRows.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-champagne" />
                    <h3 className="text-sm font-medium uppercase tracking-wide text-brand-champagne">
                      {t("findSalon.openingHours")}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {hoursRows.map((row) => (
                      <li
                        key={row.day}
                        className="flex justify-between gap-3 border-b border-gray-100 py-1.5 last:border-0"
                      >
                        <span>{row.day}</span>
                        <span className="text-gray-500">{row.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
