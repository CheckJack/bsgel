"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalonMap } from "@/components/layout/salon-map";
import { useLanguage } from "@/contexts/language-context";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  logo?: string;
  images?: string[];
  description?: string;
  workingHours?: any;
  isActive: boolean;
  isBioDiamond?: boolean;
  status: string;
}

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const salonId = params.id as string;
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (salonId) {
      fetchSalon();
    }
  }, [salonId]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [salon?.id]);

  // Keyboard navigation for gallery
  useEffect(() => {
    const galleryImages = salon?.images && salon.images.length > 0 
      ? salon.images 
      : salon?.image 
        ? [salon.image] 
        : [];
    
    if (galleryImages.length <= 1) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [salon?.images, salon?.image]);

  const fetchSalon = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[Salon Detail Page] Fetching salon with ID: ${salonId}`);
      const res = await fetch(`/api/salons/${salonId}`);
      console.log(`[Salon Detail Page] Response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[Salon Detail Page] Salon data received:`, data);
        setSalon(data);
      } else if (res.status === 404) {
        const errorData = await res.json().catch(() => ({}));
        console.log(`[Salon Detail Page] Salon not found:`, errorData);
        setError(t("findSalon.salonNotFound"));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Salon Detail Page] Error response:`, errorData);
        setError(t("findSalon.failedToLoad"));
      }
    } catch (error) {
      console.error("[Salon Detail Page] Failed to fetch salon:", error);
      setError(t("findSalon.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatWorkingHours = (workingHours: any): string => {
    if (!workingHours || typeof workingHours !== "object") {
      return t("findSalon.contactForHours");
    }

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayNames: { [key: string]: string } = {
      monday: t("findSalon.dayNamesFull.monday"),
      tuesday: t("findSalon.dayNamesFull.tuesday"),
      wednesday: t("findSalon.dayNamesFull.wednesday"),
      thursday: t("findSalon.dayNamesFull.thursday"),
      friday: t("findSalon.dayNamesFull.friday"),
      saturday: t("findSalon.dayNamesFull.saturday"),
      sunday: t("findSalon.dayNamesFull.sunday"),
    };

    const hoursList: string[] = [];
    days.forEach((day) => {
      const dayData = workingHours[day];
      if (dayData && !dayData.closed) {
        hoursList.push(
          `${dayNames[day]}: ${dayData.open || "?"} - ${dayData.close || "?"}`
        );
      } else if (dayData?.closed) {
        hoursList.push(`${dayNames[day]}: ${t("findSalon.closed")}`);
      }
    });

    return hoursList.length > 0 ? hoursList.join("\n") : t("findSalon.contactForHours");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-champagne"></div>
          <p className="mt-4 text-brand-champagne font-light">{t("findSalon.loadingSalonInfo")}</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-heading font-medium text-brand-black mb-4">
            {error || t("findSalon.salonNotFound")}
          </h1>
          <p className="text-brand-champagne font-light mb-8">
            {t("findSalon.salonNotFoundDesc")}
          </p>
          <Link href="/salons">
            <Button className="bg-brand-champagne hover:bg-brand-champagne-dark text-white">
              {t("findSalon.backToSalons")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = salon?.images && salon.images.length > 0 ? salon.images : salon?.image ? [salon.image] : [];

  const nextImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white">
      {/* Gallery Hero Section */}
      {galleryImages.length > 0 && (
        <div className="relative w-full h-[40vh] sm:h-[45vh] lg:h-[50vh] overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src={galleryImages[currentImageIndex]}
              alt={`${salon?.name} - Gallery ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              priority
              unoptimized={galleryImages[currentImageIndex]?.startsWith('data:') || galleryImages[currentImageIndex]?.startsWith('blob:') || !galleryImages[currentImageIndex]?.startsWith('http')}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            
            {/* Navigation Buttons */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-brand-champagne hover:text-brand-black rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-brand-champagne hover:text-brand-black rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-light">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            )}

            {/* Back Button Overlay */}
            <div className="absolute top-4 sm:top-6 lg:top-8 left-4 sm:left-6 lg:left-8 z-10">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="bg-white/90 hover:bg-white text-brand-champagne hover:text-brand-black font-light shadow-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("findSalon.backToSalons")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button (if no gallery) */}
      {galleryImages.length === 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-brand-champagne hover:text-brand-black hover:bg-brand-sweet-bianca/30 font-light"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("findSalon.backToSalons")}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-sweet-bianca/40 via-brand-white to-brand-white py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
            {/* Salon Image/Logo */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              {salon.logo ? (
                <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-brand-sweet-bianca/50 flex items-center justify-center">
                  <Image
                    src={salon.logo}
                    alt={salon.name}
                    width={256}
                    height={256}
                    className="w-full h-full object-contain p-6"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    unoptimized={salon.logo?.startsWith('data:') || salon.logo?.startsWith('blob:') || !salon.logo?.startsWith('http')}
                  />
                </div>
              ) : salon.image ? (
                <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-gray-50 shadow-xl">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    width={256}
                    height={256}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    unoptimized={salon.image?.startsWith('data:') || salon.image?.startsWith('blob:') || !salon.image?.startsWith('http')}
                  />
                </div>
              ) : (
                <div className="w-full sm:w-64 h-64 rounded-2xl bg-brand-sweet-bianca/20 flex items-center justify-center border-2 border-brand-sweet-bianca/30">
                  <MapPin className="h-20 w-20 text-brand-champagne/40" />
                </div>
              )}
            </div>

            {/* Salon Info */}
            <div className="flex-1 w-full">
              <div className="mb-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium text-brand-black leading-tight">
                    {salon.name}
                  </h1>
                  {salon.isBioDiamond && (
                    <div className="inline-flex items-center gap-2 bg-brand-champagne text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md">
                      <Sparkles className="h-4 w-4" />
                      {t("findSalon.bioDiamondSalon")}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 mb-6">
                  <MapPin className="h-5 w-5 text-brand-champagne flex-shrink-0 mt-1" />
                  <div className="text-brand-champagne font-light">
                    <p className="font-medium text-base">{salon.address}</p>
                    <p className="text-sm">
                      {salon.city}
                      {salon.postalCode && `, ${salon.postalCode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex flex-wrap gap-3">
                {salon.phone && (
                  <a
                    href={`tel:${salon.phone}`}
                    className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl hover:bg-brand-sweet-bianca/30 hover:border-brand-champagne/30 transition-all duration-200 text-brand-champagne hover:text-brand-black shadow-sm"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="font-light text-sm">{salon.phone}</span>
                  </a>
                )}
                {salon.email && (
                  <a
                    href={`mailto:${salon.email}`}
                    className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl hover:bg-brand-sweet-bianca/30 hover:border-brand-champagne/30 transition-all duration-200 text-brand-champagne hover:text-brand-black shadow-sm"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="font-light text-sm">{t("findSalon.email")}</span>
                  </a>
                )}
                {salon.website && (
                  <a
                    href={salon.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl hover:bg-brand-sweet-bianca/30 hover:border-brand-champagne/30 transition-all duration-200 text-brand-champagne hover:text-brand-black shadow-sm"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="font-light text-sm">{t("findSalon.website")}</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Opening Hours & Map Section - Location & Time Info Together */}
        {(salon.workingHours || (salon.latitude && salon.longitude)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Opening Hours */}
            {salon.workingHours && (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-sweet-bianca/30 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-sweet-bianca/40 rounded-lg">
                    <Clock className="h-5 w-5 text-brand-champagne" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-medium text-brand-black">
                    {t("findSalon.openingHours")}
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-brand-black/70 font-light leading-relaxed whitespace-pre-line space-y-1">
                  {formatWorkingHours(salon.workingHours).split('\n').map((line, idx) => (
                    <div key={idx} className="py-1.5 border-b border-brand-sweet-bianca/20 last:border-0">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {salon.latitude && salon.longitude && (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-sweet-bianca/30 overflow-hidden">
                <div className="h-64 sm:h-80 lg:h-full min-h-[300px]">
                  <SalonMap
                    salons={[salon]}
                    onMarkerClick={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* About Section - Full Width */}
        {salon.description && (
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-brand-sweet-bianca/30">
            <h2 className="text-2xl sm:text-3xl font-heading font-medium text-brand-black mb-6">
              {t("findSalon.about")}
            </h2>
            <p className="text-brand-black/80 font-light leading-relaxed text-base sm:text-lg whitespace-pre-line">
              {salon.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

