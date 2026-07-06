"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SalonMap } from "@/components/layout/salon-map";
import { SalonDetailPanel, type SalonDetail } from "@/components/salon/salon-detail-panel";
import { Search, MapPin, Diamond, Info, X, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { syncIosViewportHeight, setAppScrollLocked } from "@/lib/mobile-scroll-root";

interface Salon extends SalonDetail {
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  status: string;
}

const PANEL_WIDTH = 384;

function useIsMobile(breakpoint = 1023) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

function FindSalonPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showBioDiamondOnly, setShowBioDiamondOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [bioDiamondInfoOpen, setBioDiamondInfoOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const selectedSalonId = searchParams.get("salon");

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    salons.forEach((salon) => {
      if (salon.city) citySet.add(salon.city);
    });
    return Array.from(citySet).sort();
  }, [salons]);

  const filteredSalons = useMemo(() => {
    let filtered = [...salons];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.address.toLowerCase().includes(query) ||
          salon.city.toLowerCase().includes(query) ||
          salon.postalCode?.toLowerCase().includes(query)
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((salon) => salon.city === selectedCity);
    }

    if (showBioDiamondOnly) {
      filtered = filtered.filter((salon) => salon.isBioDiamond === true);
    }

    return filtered;
  }, [salons, searchQuery, selectedCity, showBioDiamondOnly]);

  const selectedSalon = useMemo(
    () => salons.find((salon) => salon.id === selectedSalonId) ?? null,
    [salons, selectedSalonId]
  );

  const panelOpen = Boolean(selectedSalon);

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    setFiltersExpanded(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const previousHtmlBg = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#ddd";

    return () => {
      document.documentElement.style.backgroundColor = previousHtmlBg;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    const timer2 = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
    };
  }, [isLoading]);

  useEffect(() => {
    setAppScrollLocked(true);

    const sync = () => {
      syncIosViewportHeight();
      window.dispatchEvent(new Event("resize"));
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("scroll", sync, { passive: true });

    return () => {
      setAppScrollLocked(false);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  useEffect(() => {
    if (selectedSalonId && !isLoading && salons.length > 0) {
      const exists = salons.some((salon) => salon.id === selectedSalonId);
      if (!exists) {
        router.replace("/salons", { scroll: false });
      }
    }
  }, [selectedSalonId, isLoading, salons, router]);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/salons");
      if (res.ok) {
        const data = await res.json();
        setSalons(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch salons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSalon = useCallback(
    (salonId: string) => {
      if (isMobile) {
        setFiltersExpanded(false);
      }
      router.replace(`/salons?salon=${encodeURIComponent(salonId)}`, { scroll: false });
    },
    [isMobile, router]
  );

  const closePanel = useCallback(() => {
    router.replace("/salons", { scroll: false });
  }, [router]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setShowBioDiamondOnly(false);
    setBioDiamondInfoOpen(false);
  };

  const hasActiveFilters = searchQuery || selectedCity || showBioDiamondOnly;

  const salonCountLabel = isLoading
    ? t("findSalon.loadingSalons")
    : filteredSalons.length === 1
      ? t("findSalon.foundSalons", { count: String(filteredSalons.length) })
      : t("findSalon.foundSalonsPlural", { count: String(filteredSalons.length) });

  const filtersCard = (
    <div className="rounded-xl border border-gray-200/90 bg-white/95 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setFiltersExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-display text-base font-medium text-brand-black">{t("findSalon.title")}</p>
          <p className="text-xs text-brand-champagne">{salonCountLabel}</p>
        </div>
        {filtersExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        )}
      </button>

      {filtersExpanded && (
        <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("findSalon.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-base text-brand-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-champagne sm:text-sm"
            />
          </div>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-base text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-champagne sm:text-sm"
            >
              <option value="">{t("findSalon.allCities")}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-black">
              <input
                type="checkbox"
                checked={showBioDiamondOnly}
                onChange={(e) => setShowBioDiamondOnly(e.target.checked)}
                className="h-4 w-4 rounded text-brand-champagne focus:ring-brand-champagne"
              />
              <Diamond className="h-4 w-4 text-brand-champagne" />
              {t("findSalon.bioDiamondOnly")}
            </label>

            <span className="group/info relative inline-flex">
              <button
                type="button"
                onClick={() => isMobile && setBioDiamondInfoOpen((open) => !open)}
                className="flex size-5 items-center justify-center rounded-full text-brand-champagne transition-colors hover:bg-brand-champagne/10 hover:text-brand-champagne-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne/30"
                aria-label={t("findSalon.bioDiamondInfoLabel")}
                aria-expanded={bioDiamondInfoOpen}
              >
                <Info className="size-3.5" aria-hidden />
              </button>
              <span
                role="tooltip"
                className={cn(
                  "absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs leading-relaxed text-brand-black/75 shadow-lg sm:w-64",
                  isMobile
                    ? bioDiamondInfoOpen
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                    : "pointer-events-none opacity-0 transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
                )}
              >
                {t("findSalon.bioDiamondInfo")}
              </span>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-brand-champagne hover:text-brand-black"
              >
                <X className="h-3.5 w-3.5" />
                {t("findSalon.clearFilters")}
              </button>
            )}
          </div>

          {isMobile && (
            <p className="text-[11px] leading-relaxed text-brand-black/50">{t("findSalon.mapTouchHint")}</p>
          )}
        </div>
      )}
    </div>
  );

  const mapContent = isLoading ? (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-brand-champagne" />
        <p className="mt-4 text-brand-champagne">{t("findSalon.loadingSalons")}</p>
      </div>
    </div>
  ) : filteredSalons.length === 0 ? (
    <div className="flex h-full items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-xl font-medium text-brand-black sm:text-2xl">{t("findSalon.noSalonsFound")}</h3>
        <p className="mb-6 text-sm text-brand-champagne sm:text-base">{t("findSalon.noSalonsFoundDesc")}</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg bg-brand-black px-6 py-2 text-brand-white transition-colors hover:bg-brand-champagne"
          >
            {t("findSalon.clearAllFilters")}
          </button>
        )}
      </div>
    </div>
  ) : (
    <SalonMap
      salons={filteredSalons}
      selectedSalonId={selectedSalonId}
      focusPaddingLeft={panelOpen && !isMobile && !isMapFullscreen ? PANEL_WIDTH : 0}
      onMarkerClick={selectSalon}
      onMapBackgroundClick={closePanel}
      fillContainer
      fullscreenPanelOpen={panelOpen}
      onFullscreenChange={setIsMapFullscreen}
      fullscreenPanel={
        <SalonDetailPanel
          salon={selectedSalon}
          open={panelOpen}
          onClose={closePanel}
          fullscreen
        />
      }
    />
  );

  return (
    <div
      data-salons-map
      className={cn(
        "relative flex w-full flex-col overflow-hidden bg-[#ddd]",
        "max-lg:min-h-[calc(100lvh-var(--site-header-height,113px))]",
        "lg:fixed lg:inset-0 lg:z-[90] lg:top-[var(--site-header-height,113px)] lg:bg-brand-white"
      )}
    >
      <div className="relative min-h-0 flex-1 max-lg:min-h-[calc(100lvh-var(--site-header-height,113px))]">
        <div className="absolute inset-0">{mapContent}</div>

        {!(panelOpen && isMobile) && (
          <div
            className={cn(
              "absolute z-[800] transition-[left,right] duration-300 ease-out top-3",
              panelOpen && !isMobile
                ? "left-[calc(24rem+0.75rem)] right-3"
                : "left-3 right-3 lg:left-auto lg:right-3 lg:max-w-md"
            )}
          >
            {filtersCard}
          </div>
        )}

        <SalonDetailPanel
          salon={selectedSalon}
          open={panelOpen && !isMapFullscreen}
          onClose={closePanel}
          embedded
        />
      </div>
    </div>
  );
}

export default function FindSalonPage() {
  return (
    <Suspense fallback={null}>
      <FindSalonPageContent />
    </Suspense>
  );
}
